'use strict';
/**
 * MyAKTA172 Fasa 3 — SQLite dev adapter for the LOCKED AUTO-DOWNGRADE engine.
 * NOT an HTTP server, not production auth or a distributed database.
 * Use :memory: or an absolute path OUTSIDE the GitHub Pages repository.
 * Node.js >=22.13 recommended (node:sqlite built in, no dependency).
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {DatabaseSync}=require('node:sqlite');
const {effectiveSubscription}=require('./admin-subscription-engine.cjs');
const policy=require('./admin-package-policy.js');

function accountIdOK(value){return typeof value==='string' && /^[a-zA-Z0-9_-]{1,64}$/.test(value)}
function iso(value){return typeof value==='string'&&Number.isFinite(Date.parse(value))&&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)}
function safeDatabasePath(filename){
  if(filename===':memory:')return filename;
  if(typeof filename!=='string' || !path.isAbsolute(filename))throw Error('DB_PATH_MUST_BE_ABSOLUTE');
  const parent=fs.realpathSync(path.dirname(filename));
  const requested=path.join(parent,path.basename(filename));
  const repo=fs.realpathSync(__dirname);
  const rel=path.relative(repo,requested);
  if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))
    throw Error('DB_MUST_NOT_BE_IN_PUBLIC_REPOSITORY');
  return requested;
}
function sessionHash(token){
  if(typeof token!=='string'||token.length<12)return null;
  return crypto.createHash('sha256').update(token,'utf8').digest('hex');
}
function createDevSQLiteStore({filename=':memory:',allowTestSeed=false}={}) {
  const requested=safeDatabasePath(filename);
  const db=new DatabaseSync(requested,{timeout:5000});
  db.exec('PRAGMA foreign_keys=ON;');
  // Fail closed: schema local and tests only, NEVER migrate or touch index.html.
  db.exec(fs.readFileSync(path.join(__dirname,'admin-backend-sqlite.sql'),'utf8'));

  const statements={
    account:db.prepare('SELECT account_id,email,role,status FROM accounts WHERE account_id=?'),
    subscription:db.prepare('SELECT account_id,plan,status,starts_at,expires_at,revision FROM subscriptions WHERE account_id=?'),
    update:db.prepare("UPDATE subscriptions SET plan=?,status=?,starts_at=?,expires_at=?,revision=revision+1,updated_at=? WHERE account_id=?"),
    audit:db.prepare("INSERT OR IGNORE INTO audit_events(event_id,account_id,action,previous_plan,new_plan,expired_at,processed_at) VALUES(?,?,?,?,?,?,?)"),
    history:db.prepare("INSERT INTO subscription_history(event_id,account_id,old_plan,new_plan,previous_expiry,changed_at) VALUES(?,?,?,?,?,?)"),
    events:db.prepare('SELECT * FROM audit_events WHERE account_id=? ORDER BY processed_at,event_id'),
    historyAll:db.prepare('SELECT * FROM subscription_history WHERE account_id=? ORDER BY changed_at,event_id'),
    activeSessions:db.prepare("SELECT COUNT(*) n FROM device_sessions WHERE account_id=? AND revoked_at IS NULL AND expires_at_ms>?"),
    session:db.prepare("SELECT 1 present FROM device_sessions WHERE account_id=? AND session_hash=? AND revoked_at IS NULL AND expires_at_ms>?")
  };
  let queue=Promise.resolve();
  let closed=false;
  const ensureOpen=()=>{if(closed)throw Error('DB_ALREADY_CLOSED')};
  const mapSubscription=row=>row?{
    accountId:row.account_id,plan:row.plan,status:row.status,
    startsAt:row.starts_at,expiresAt:row.expires_at,revision:row.revision
  }:null;
  const getSubscription=async accountId=>{
    ensureOpen();
    if(!accountIdOK(accountId))return null;
    return mapSubscription(statements.subscription.get(accountId));
  };
  const readAccount=async accountId=>{
    ensureOpen();
    if(!accountIdOK(accountId))return null;
    const r=statements.account.get(accountId);
    return r?{accountId:r.account_id,email:r.email,role:r.role,status:r.status}:null;
  };
  // Backend auth verifier must create a trusted identity. This only verifies
  // hashed session ownership; it does NOT authenticate a client on its own.
  const checkSingleActiveSession=async(accountId,token,at=Date.now())=>{
    ensureOpen();
    if(!accountIdOK(accountId)||!sessionHash(token)||!Number.isFinite(Number(at)))
      return {authorized:false,activeCount:0};
    const now=Number(at);
    const n=Number(statements.activeSessions.get(accountId,now).n);
    const active=!!statements.session.get(accountId,sessionHash(token),now);
    return {authorized:active&&n===1,activeCount:n};
  };

  // Async callback serialized on a single connection. BEGIN IMMEDIATE
  // provides SQLite writer lock for concurrent SQLite connections.
  // Not a multi-region/multi-tenant production adapter.
  const transaction=async(accountId,callback)=>{
    ensureOpen();
    if(!accountIdOK(accountId)||typeof callback!=='function')throw Error('TRANSACTION_INVALID');
    const prior=queue;
    let release;
    queue=new Promise(resolve=>{release=resolve});
    await prior;
    try {
      ensureOpen();
      db.exec('BEGIN IMMEDIATE');
      let committed=false;
      try {
        const tx={
          getSubscription:async id=>id===accountId?mapSubscription(statements.subscription.get(id)):null,
          insertAuditEventOnce:async e=>{
            if(!e||e.accountId!==accountId||e.action!=='AUTO_EXPIRED'||
              !policy.packages[e.previousPlan]||e.previousPlan==='Free'||e.newPlan!=='Free'||
              !iso(e.expiredAt)||!iso(e.processedAt))throw Error('AUDIT_EVENT_INVALID');
            const key='AUTO_EXPIRED:'+accountId+':'+e.expiredAt;
            if(e.eventId!==key)throw Error('AUDIT_EVENT_ID_INVALID');
            const result=statements.audit.run(e.eventId,accountId,e.action,e.previousPlan,e.newPlan,e.expiredAt,e.processedAt);
            if(result.changes!==1)throw Error('AUDIT_EVENT_DUPLICATE');
            statements.history.run(e.eventId,accountId,e.previousPlan,e.newPlan,e.expiredAt,e.processedAt);
          },
          saveSubscription:async(id,s)=>{
            if(id!==accountId||!s||s.accountId!==accountId||
               !['Free','Basic','Rahmah','Premium'].includes(s.plan)||
               !['Aktif','Digantung','Tamat'].includes(s.status))throw Error('SUBSCRIPTION_INVALID');
            if(s.plan==='Free' && (s.startsAt!=null||s.expiresAt!=null))throw Error('FREE_DATES_NOT_NULL');
            if(s.plan!=='Free'&&(!iso(s.expiresAt)|| (s.startsAt!=null&&!iso(s.startsAt))))
              throw Error('DATES_INVALID');
            const n=statements.update.run(s.plan,s.status,s.startsAt??null,s.expiresAt??null,new Date().toISOString(),id);
            if(n.changes!==1)throw Error('SUBSCRIPTION_NOT_FOUND');
          }
        };
        const result=await callback(tx);
        db.exec('COMMIT');
        committed=true;
        return result;
      } finally {
        if(!committed)db.exec('ROLLBACK');
      }
    } finally {release()}
  };

  const getAuditEvents=async accountId=>{ensureOpen();return statements.events.all(accountId)};
  const getPlanHistory=async accountId=>{ensureOpen();return statements.historyAll.all(accountId)};
  const getEffective=async(accountId,at=Date.now())=>{
    const sub=await getSubscription(accountId);
    return effectiveSubscription(sub,at);
  };
  // Local fixtures: disabled by default; no real account collection endpoint.
  const seedForTest=(account,subscription)=>{
    ensureOpen();
    if(!allowTestSeed)throw Error('TEST_SEED_DISABLED');
    if(!account||!accountIdOK(account.accountId)||typeof account.email!=='string'||
      !/^[^@\s]+@[^@\s]+$/.test(account.email))throw Error('SEED_ACCOUNT_INVALID');
    if(!subscription||subscription.accountId!==account.accountId)throw Error('SEED_SUBSCRIPTION_INVALID');
    if(!['Free','Basic','Rahmah','Premium'].includes(subscription.plan))throw Error('SEED_PLAN_INVALID');
    if(subscription.plan!=='Free'&&!iso(subscription.expiresAt))throw Error('SEED_EXPIRY_INVALID');
    db.exec('BEGIN IMMEDIATE');
    try{
      db.prepare('INSERT INTO accounts(account_id,email,role,status,created_at) VALUES(?,?,?,?,?)')
        .run(account.accountId,account.email,'user',account.status||'Aktif',new Date().toISOString());
      db.prepare('INSERT INTO subscriptions(account_id,plan,status,starts_at,expires_at,updated_at) VALUES(?,?,?,?,?,?)')
        .run(account.accountId,subscription.plan,subscription.status,subscription.startsAt??null,
          subscription.expiresAt??null,new Date().toISOString());
      db.exec('COMMIT');
    }catch(e){db.exec('ROLLBACK');throw e}
  };
  const seedSessionForTest=(accountId,token,expiresAt)=>{
    ensureOpen();
    if(!allowTestSeed)throw Error('TEST_SEED_DISABLED');
    if(!accountIdOK(accountId)||!sessionHash(token)||!iso(expiresAt))throw Error('SESSION_INVALID');
    db.prepare("INSERT INTO device_sessions(session_hash,account_id,expires_at_ms) VALUES(?,?,?)")
      .run(sessionHash(token),accountId,Date.parse(expiresAt));
  };
  const revokeSessionForTest=(accountId,token)=>{
    ensureOpen();
    if(!allowTestSeed)throw Error('TEST_SEED_DISABLED');
    db.prepare("UPDATE device_sessions SET revoked_at=? WHERE account_id=? AND session_hash=? AND revoked_at IS NULL")
      .run(new Date().toISOString(),accountId,sessionHash(token));
  };
  const execForTest=sql=>{ensureOpen();if(!allowTestSeed)throw Error('TEST_SEED_DISABLED');db.exec(sql)};
  const selectForTest=(sql,...args)=>{ensureOpen();if(!allowTestSeed)throw Error('TEST_SEED_DISABLED');return db.prepare(sql).all(...args)};
  const close=async()=>{await queue;if(!closed){db.close();closed=true}};
  return Object.freeze({
    readAccount,getSubscription,getEffective,checkSingleActiveSession,
    transaction,getAuditEvents,getPlanHistory,
    seedForTest,seedSessionForTest,revokeSessionForTest,execForTest,selectForTest,close
  });
}
module.exports=Object.freeze({createDevSQLiteStore});
