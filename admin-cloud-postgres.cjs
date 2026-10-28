'use strict';
/**
 * MyAKTA172 Fasa 3B — PostgreSQL private backend repository.
 * Only call from a trusted SERVER. No HTTP routes and no public data exposure.
 * Requires an app-only SQL role with narrowly scoped grants and RLS policies.
 * Never use a superuser/schema owner connection in public-facing runtime.
 */
const {sessionDigest}=require('./admin-auth-foundation.cjs');
const {effectiveSubscription}=require('./admin-subscription-engine.cjs');

const uuid=id=>typeof id==='string'&&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const strictISO=value=>typeof value==='string'&&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)&&
  Number.isFinite(Date.parse(value));
const accountMap=row=>row?Object.freeze({
  accountId:row.account_id,email:row.email,role:row.role,status:row.status
}):null;
const subscriptionMap=row=>row?Object.freeze({
  accountId:row.account_id,plan:row.plan,status:row.status,
  startsAt:row.starts_at instanceof Date?row.starts_at.toISOString():null,
  expiresAt:row.expires_at instanceof Date?row.expires_at.toISOString():null,
  revision:String(row.revision)
}):null;
const msToDate=value=>{
  if(!Number.isSafeInteger(value)||value<0)throw Error('INVALID_SERVER_CLOCK');
  return new Date(value).toISOString();
};
function validateEvent(e,id) {
  if(!e||e.accountId!==id||e.action!=='AUTO_EXPIRED'||
    !['Basic','Rahmah','Premium'].includes(e.previousPlan)||
    e.newPlan!=='Free'||!strictISO(e.expiredAt)||!strictISO(e.processedAt)||
    e.eventId!=='AUTO_EXPIRED:'+id+':'+e.expiredAt)
    throw Error('AUDIT_EVENT_INVALID');
}
function createPostgresRepository({pool,clock=()=>Date.now()}={}) {
  if(!pool||typeof pool.connect!=='function'||typeof pool.query!=='function')
    throw Error('POSTGRES_POOL_REQUIRED');
  async function findAccountBySubject(subject,issuer) {
    if(typeof subject!=='string'||!subject||subject.length>256||
       typeof issuer!=='string'||!issuer||issuer.length>256)return null;
    const r=await pool.query(
      'SELECT account_id,email,role,status FROM myakta_private.accounts '+
      'WHERE auth_subject=$1 AND auth_issuer=$2 LIMIT 1',[subject,issuer]);
    return accountMap(r.rows[0]);
  }
  async function getSubscription(accountId){
    if(!uuid(accountId))return null;
    const r=await pool.query(
      'SELECT account_id,plan,status,starts_at,expires_at,revision '+
      'FROM myakta_private.subscriptions WHERE account_id=$1',[accountId]);
    return subscriptionMap(r.rows[0]);
  }
  async function verifySessionHash(accountId,hash,at=clock()) {
    if(!uuid(accountId)||typeof hash!=='string'||!/^[0-9a-f]{64}$/.test(hash)||
       !Number.isSafeInteger(at)||at<0)return {authorized:false,activeCount:0};
    const r=await pool.query(
      'SELECT COUNT(*) FILTER (WHERE expires_at>$3::timestamptz)::int AS active_count,'+
      'COALESCE(BOOL_OR(session_hash=$2::bytea AND expires_at>$3::timestamptz),false) AS owns '+
      'FROM myakta_private.device_sessions WHERE account_id=$1 AND revoked_at IS NULL',
      [accountId,Buffer.from(hash,'hex'),msToDate(at)]);
    const n=r.rows[0]?.active_count??0;
    return Object.freeze({authorized:n===1&&r.rows[0].owns===true,activeCount:n});
  }
  async function checkSingleActiveSession(accountId,rawSessionToken){
    try{return await verifySessionHash(accountId,sessionDigest(rawSessionToken),clock())}
    catch{return {authorized:false,activeCount:0}}
  }
  // Issue tokens only AFTER authenticating user through the trusted IdP;
  // no HTTP endpoint is exposed here. Revoke the previous device atomically.
  async function rotateDeviceSession({accountId,sessionHash,expiresAt}={}){
    if(!uuid(accountId)||typeof sessionHash!=='string'||
       !/^[0-9a-f]{64}$/.test(sessionHash)||!strictISO(expiresAt)||
       Date.parse(expiresAt)<=Number(clock()))throw Error('DEVICE_SESSION_INVALID');
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const r=await client.query(
        'SELECT status FROM myakta_private.accounts WHERE account_id=$1 FOR UPDATE',[accountId]);
      if(r.rows[0]?.status!=='Aktif')throw Error('ACCOUNT_NOT_ACTIVE');
      await client.query(
        'UPDATE myakta_private.device_sessions SET revoked_at=$2::timestamptz '+
        'WHERE account_id=$1 AND revoked_at IS NULL',[accountId,msToDate(Number(clock()))]);
      await client.query(
        'INSERT INTO myakta_private.device_sessions(session_hash,account_id,expires_at) '+
        'VALUES($1::bytea,$2,$3::timestamptz)',
        [Buffer.from(sessionHash,'hex'),accountId,expiresAt]);
      await client.query('COMMIT');
      return Object.freeze({activeCount:1,issued:true});
    }catch(e){await client.query('ROLLBACK');throw e}
    finally{client.release()}
  }
  async function revokeDeviceSession(accountId,sessionHash){
    if(!uuid(accountId)||typeof sessionHash!=='string'||!/^[0-9a-f]{64}$/.test(sessionHash))
      throw Error('DEVICE_SESSION_INVALID');
    const r=await pool.query(
      'UPDATE myakta_private.device_sessions SET revoked_at=$3::timestamptz '+
      'WHERE account_id=$1 AND session_hash=$2::bytea AND revoked_at IS NULL',
      [accountId,Buffer.from(sessionHash,'hex'),msToDate(Number(clock()))]);
    return r.rowCount===1;
  }
  // Must be an atomic transaction on one pinned PostgreSQL connection;
  // lock current subscription to serialize audit and plan changes.
  async function transaction(accountId,callback){
    if(!uuid(accountId)||typeof callback!=='function')throw Error('TRANSACTION_INVALID');
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const row=await client.query(
        'SELECT account_id FROM myakta_private.subscriptions WHERE account_id=$1 FOR UPDATE',
        [accountId]);
      if(row.rowCount!==1)throw Error('SUBSCRIPTION_UNAVAILABLE');
      const tx=Object.freeze({
        getSubscription:async id=>{
          if(id!==accountId)return null;
          const r=await client.query(
            'SELECT account_id,plan,status,starts_at,expires_at,revision '+
            'FROM myakta_private.subscriptions WHERE account_id=$1',[id]);
          return subscriptionMap(r.rows[0]);
        },
        insertAuditEventOnce:async e=>{
          validateEvent(e,accountId);
          const r=await client.query(
            'INSERT INTO myakta_private.audit_events '+
            '(event_id,account_id,action,previous_plan,new_plan,expired_at,processed_at) '+
            'VALUES($1,$2,$3,$4,$5,$6::timestamptz,$7::timestamptz) '+
            'ON CONFLICT (event_id) DO NOTHING',
            [e.eventId,accountId,e.action,e.previousPlan,e.newPlan,e.expiredAt,e.processedAt]);
          if(r.rowCount!==1)throw Error('AUDIT_EVENT_DUPLICATE');
          await client.query(
            'INSERT INTO myakta_private.subscription_history '+
            '(event_id,account_id,old_plan,new_plan,previous_expiry,changed_at) '+
            'VALUES($1,$2,$3,$4,$5::timestamptz,$6::timestamptz)',
            [e.eventId,accountId,e.previousPlan,e.newPlan,e.expiredAt,e.processedAt]);
        },
        saveSubscription:async(id,s)=>{
          if(id!==accountId||s?.accountId!==accountId||!Number.isSafeInteger(Number(s.revision))||
             !['Free','Basic','Rahmah','Premium'].includes(s.plan)||
             !['Aktif','Digantung','Tamat'].includes(s.status))throw Error('SUBSCRIPTION_INVALID');
          if(s.plan==='Free'&&(s.startsAt!==null||s.expiresAt!==null))
            throw Error('FREE_DATES_NOT_NULL');
          if(s.plan!=='Free'&&(!strictISO(s.expiresAt)||
            (s.startsAt!==null&&!strictISO(s.startsAt))))
            throw Error('PAID_DATES_INVALID');
          const q=await client.query(
            'UPDATE myakta_private.subscriptions SET plan=$1,status=$2,'+
            'starts_at=$3::timestamptz,expires_at=$4::timestamptz,'+
            'revision=revision+1,updated_at=now() '+
            'WHERE account_id=$5 AND revision=$6::bigint',
            [s.plan,s.status,s.startsAt,s.expiresAt,id,s.revision]);
          if(q.rowCount!==1)throw Error('SUBSCRIPTION_VERSION_CONFLICT');
        }
      });
      const result=await callback(tx);
      await client.query('COMMIT');
      return result;
    }catch(e){await client.query('ROLLBACK');throw e}
    finally{client.release()}
  }
  async function getEffective(accountId,at=clock()){
    const record=await getSubscription(accountId);
    return effectiveSubscription(record,at);
  }
  async function getAuditEvents(accountId){
    if(!uuid(accountId))return [];
    const r=await pool.query('SELECT event_id,action,previous_plan,new_plan,processed_at '+
      'FROM myakta_private.audit_events WHERE account_id=$1 ORDER BY processed_at,event_id',[accountId]);
    return r.rows;
  }
  async function health(){
    const r=await pool.query('SELECT 1 AS ok');
    return r.rows[0]?.ok===1;
  }
  return Object.freeze({findAccountBySubject,getSubscription,getEffective,
    verifySessionHash,checkSingleActiveSession,rotateDeviceSession,revokeDeviceSession,
    transaction,getAuditEvents,health});
}
module.exports=Object.freeze({createPostgresRepository});
