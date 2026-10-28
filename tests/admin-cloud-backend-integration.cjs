'use strict';
// Fasa 3B: isolated PostgreSQL 16 CI. NO user data or real cloud secrets.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {Client,Pool}=require('pg');
const {createBackendServices}=require('../admin-cloud-backend.cjs');
const {sessionDigest,newSessionToken,verifyAccessToken}=require('../admin-auth-foundation.cjs');
const cfg={host:process.env.PGHOST||'127.0.0.1',port:Number(process.env.PGPORT||5432),
 user:process.env.PGUSER||'myakta_ci',password:process.env.PGPASSWORD,
 database:process.env.PGDATABASE||'myakta_ci'};
const nowAt=Date.parse('2026-10-27T14:00:00Z');
const expiry=new Date(nowAt).toISOString();
const rsa=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const issuer='https://idp.example.test',audience='myakta172-private-api';
const b64=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
function jwt(sub,extra={}){
 const h=b64({alg:'RS256',typ:'JWT',kid:'staging-key'});
 const p=b64({iss:issuer,aud:audience,sub,
   iat:Math.floor(nowAt/1000)-30,exp:Math.floor(nowAt/1000)+3600,...extra});
 const msg=h+'.'+p;
 return msg+'.'+crypto.sign('RSA-SHA256',Buffer.from(msg),rsa.privateKey).toString('base64url');
}
async function main(){
 let checks=0;
 const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
 const owner=new Client(cfg);
 await owner.connect();
 let runtime=null;
 try{
  const root=path.join(__dirname,'..');
  await owner.query(fs.readFileSync(path.join(root,'admin-backend-postgresql.sql'),'utf8'));
  await owner.query(fs.readFileSync(path.join(root,'admin-backend-cloud-roles.sql'),'utf8'));
  // Ephemeral test login only, never a production credential.
  await owner.query("CREATE ROLE myakta_ci_runtime LOGIN PASSWORD 'TEST_ONLY_RUNTIME_2026' IN ROLE myakta_backend_runtime");
  const a=crypto.randomUUID(),b=crypto.randomUUID();
  const people=[
    [a,'user-a@example.test','subject-a','Rahmah','Aktif'],
    [b,'user-b@example.test','subject-b','Premium','Digantung']
  ];
  for(const [id,email,subject,plan,status] of people){
   await owner.query('INSERT INTO myakta_private.accounts '+
     '(account_id,email,auth_issuer,auth_subject,status) VALUES($1,$2,$3,$4,$5)',
     [id,email,issuer,subject,status]);
   await owner.query('INSERT INTO myakta_private.subscriptions '+
     '(account_id,plan,status,starts_at,expires_at) VALUES($1,$2,$3,$4,$5)',
     [id,plan,status,'2026-09-27T14:00:00Z',expiry]);
  }
  await owner.query('INSERT INTO myakta_private.favorites (account_id,section_id) VALUES($1,$2)',[a,'19']);
  await owner.query("INSERT INTO myakta_private.payments "+
   "(payment_id,account_id,plan,category,amount_cents,status) VALUES($1,$2,'Rahmah','Naik Taraf',2500,'Menunggu')",
   [crypto.randomUUID(),a]);
  runtime=new Pool({...cfg,user:'myakta_ci_runtime',password:'TEST_ONLY_RUNTIME_2026',max:8});
  let time=nowAt-1,readCount=0;
  const verifyToken=async tok=>verifyAccessToken({
    token:tok,issuer,audience,resolvePublicKey:async kid=>kid==='staging-key'?rsa.publicKey:null,
    clock:()=>time
  });
  const service=createBackendServices({pool:runtime,verifyToken,
    readContent:async({section})=>{readCount++;return {section,content:'test-only'}},
    clock:()=>time});
  eq((await service.db.health()),true);
  eq((await service.db.findAccountBySubject('subject-a',issuer)).accountId,a);
  eq(await service.db.findAccountBySubject('subject-a','https://wrong.test'),null);
  eq((await service.db.getSubscription(a)).plan,'Rahmah');
  const first=newSessionToken(),second=newSessionToken();
  await service.db.rotateDeviceSession({accountId:a,sessionHash:sessionDigest(first),
    expiresAt:new Date(nowAt+86400000).toISOString()});
  eq((await service.db.checkSingleActiveSession(a,first)).authorized,true);
  eq((await service.db.checkSingleActiveSession(a,second)).authorized,false);
  const headers={authorization:'Bearer '+jwt('subject-a'),cookie:'__Host-myaktasession='+first};
  const request={headers,plan:'Premium',user:{role:'admin'}};
  const before=await service.authorize(request,{section:'18'});
  eq(before.allowed,true);
  eq(before.effectivePlan,'Rahmah');
  const beforeProtected=await service.protectedContent(request,{section:'18'});
  eq(beforeProtected.status,200);eq(readCount,1);
  eq(beforeProtected.headers['Cache-Control'],'private, no-store');

  time=nowAt;
  eq((await service.authorize(request,{section:'18'})).allowed,false);
  eq((await service.authorize(request,{section:'1'})).effectivePlan,'Free');
  eq((await service.authorize(request,{feature:'related'})).allowed,false);
  const denied=await service.protectedContent(request,{section:'18'});
  eq(denied.status,403);
  eq(readCount,1,'Protected DB content not read on a denied request');
  eq((await service.db.getSubscription(a)).plan,'Rahmah',
    'State has not yet reconciled but entitlement is already Free');

  // Multiple connections compete on same account: row lock ensures one audit.
  const results=await Promise.all(Array.from({length:8},()=>service.reconcile(a)));
  eq(results.filter(x=>x.changed===true).length,1);
  eq((await service.db.getSubscription(a)).plan,'Free');
  eq((await service.db.getAuditEvents(a)).length,1);
  eq((await owner.query(
    'SELECT COUNT(*)::int AS n FROM myakta_private.subscription_history WHERE account_id=$1',[a])).rows[0].n,1);
  eq((await owner.query(
    'SELECT COUNT(*)::int AS n FROM myakta_private.payments WHERE account_id=$1',[a])).rows[0].n,1);
  eq((await owner.query(
    'SELECT COUNT(*)::int AS n FROM myakta_private.favorites WHERE account_id=$1',[a])).rows[0].n,1);
  eq((await service.db.getSubscription(b)).status,'Digantung');
  await assert.rejects(service.db.rotateDeviceSession({accountId:b,
    sessionHash:sessionDigest(newSessionToken()),expiresAt:new Date(nowAt+86400000).toISOString()}),
    /ACCOUNT_NOT_ACTIVE/);checks++;
  eq((await service.db.getAuditEvents(a))[0].previous_plan,'Rahmah');

  // Role has no access to payment data or privileged reconciliation FUNCTION.
  await assert.rejects(runtime.query('SELECT * FROM myakta_private.payments'),/permission denied/);
  checks++;
  await assert.rejects(runtime.query('SELECT myakta_private.reconcile_auto_expired($1)',[a]),
    /permission denied/);
  checks++;

  // One-account-one-device: rotate revokes former session in the same DB tx.
  await service.db.rotateDeviceSession({accountId:a,sessionHash:sessionDigest(second),
    expiresAt:new Date(nowAt+86400000).toISOString()});
  eq((await service.db.checkSingleActiveSession(a,first)).authorized,false);
  eq((await service.db.checkSingleActiveSession(a,second)).authorized,true);
  const request2={headers:{authorization:'Bearer '+jwt('subject-a'),
    cookie:'__Host-myaktasession='+second}};
  eq((await service.authorize(request2,{section:'1'})).allowed,true);
  eq((await service.authorize(request,{section:'1'})).allowed,false);
  eq(await service.db.revokeDeviceSession(a,sessionDigest(second)),true);
  eq((await service.db.checkSingleActiveSession(a,second)).authorized,false);
  eq((await service.authorize(request2,{section:'1'})).allowed,false);

  // Admin does not gain rights from forged token/payload.
  const forged={headers:{authorization:'Bearer '+jwt('subject-a',{role:'admin',plan:'Premium'}),
    cookie:'__Host-myaktasession='+second}};
  eq(await service.authenticate(forged),null); // revoked.
  // Audit survives rollback of later untrusted operation.
  await assert.rejects(service.db.transaction(a,async tx=>{
    await tx.insertAuditEventOnce({
     eventId:'AUTO_EXPIRED:'+a+':'+expiry,accountId:a,action:'AUTO_EXPIRED',
     previousPlan:'Rahmah',newPlan:'Free',expiredAt:expiry,processedAt:expiry
    });
  }),/AUDIT_EVENT_DUPLICATE/);
  checks++;
  eq((await service.db.getAuditEvents(a)).length,1);

  // The private runtime role must NOT be allowed to bypass security policies.
  const roles=await owner.query("SELECT rolsuper,rolbypassrls FROM pg_roles "+
    "WHERE rolname='myakta_ci_runtime'");
  eq(roles.rows[0].rolsuper,false);
  eq(roles.rows[0].rolbypassrls,false);
  console.log('PASS Fasa 3B: verified OIDC -> PostgreSQL account/session -> protected entitlement.');
  console.log('PASS Fasa 3B: 8 concurrent renewals -> one AUTO_EXPIRED audit + preserved data.');
  console.log('PASS Fasa 3B: revoked device denied, private payment data and function protected.');
  console.log('PASS '+checks+' cloud-backend PostgreSQL staging checks (NO external cloud deployment).');
 }finally{if(runtime)await runtime.end();await owner.end()}
}
main().catch(e=>{console.error(e);process.exitCode=1});
