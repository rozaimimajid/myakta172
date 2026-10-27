'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createDevSQLiteStore}=require('../admin-backend-sqlite.cjs');
const {
  verifyAccessToken,newSessionToken,sessionCookie,sessionDigest,
  createAuthAdapter
}=require('../admin-auth-foundation.cjs');
const {
  authorizeEntitlement,reconcileExpiredAccount
}=require('../admin-subscription-engine.cjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'myakta-auth-test-'));
const database=path.join(tmp,'private.sqlite');
const fixed=Date.parse('2026-10-27T14:00:00Z');
const issuer='https://idp.example.test';
const aud='myakta172-api';
const subject='oidc-user-test';
const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const bearer=(overrides={})=>{
  const jwt={iss:issuer,aud,sub:subject,iat:Math.floor(fixed/1000)-100,
    exp:Math.floor(fixed/1000)+120,email_verified:true,...overrides};
  const text=b64({alg:'RS256',typ:'JWT',kid:'internal-testing'})+'.'+b64(jwt);
  return text+'.'+crypto.sign('RSA-SHA256',Buffer.from(text),key.privateKey).toString('base64url');
};
async function test(){
 let count=0;
 const equal=(a,b)=>{assert.deepEqual(a,b);count++};
 const session=newSessionToken();
 const store=createDevSQLiteStore({filename:database,allowTestSeed:true});
 try{
  store.seedForTest(
    {accountId:'U003',email:'demo@example.test',status:'Aktif',
     authIssuer:issuer,authSubject:subject},
    {accountId:'U003',plan:'Rahmah',status:'Aktif',
     startsAt:'2026-09-27T14:00:00Z',expiresAt:'2026-10-27T14:00:00Z'}
  );
  store.seedSessionForTest('U003',session,new Date(fixed+3600000).toISOString());
  const verify=t=>verifyAccessToken({token:t,issuer,audience:aud,
    resolvePublicKey:async kid=>kid==='internal-testing'?key.publicKey:null,
    clock:()=>fixed});
  const auth=createAuthAdapter({
    verifyToken:verify,
    findAccountBySubject:(sub,iss)=>store.findAccountBySubject(sub,iss),
    verifyDeviceSession:(accountId,hash,at)=>store.verifySessionHash(accountId,hash,at),
    clock:()=>fixed
  });
  const headers={authorization:'Bearer '+bearer(),
    cookie:sessionCookie(session)};
  const request={headers};
  const principal=await auth.authenticate(request);
  equal(principal.accountId,'U003');
  equal(principal.role,'user');
  equal(principal.status,'Aktif');
  equal(principal.sessionId,session);
  equal((await store.findAccountBySubject(subject,issuer)).accountId,'U003');
  equal(await store.findAccountBySubject(subject,'https://wrong-idp.test'),null);
  equal((await store.verifySessionHash('U003',sessionDigest(session),fixed)).authorized,true);
  equal((await store.verifySessionHash('U003',sessionDigest(newSessionToken()),fixed)).authorized,false);

  // No user-provided role or plan can override DB's verified subscription.
  const check=async(section,req=request)=>authorizeEntitlement({
    request:req,authenticate:auth.authenticate,
    loadSubscription:store.getSubscription,
    checkSingleActiveSession:auth.checkSingleActiveSession,
    section,clock:()=>fixed
  });
  const free=await check('1');
  equal(free.allowed,true);
  equal(free.effectivePlan,'Free');
  equal((await check('18')).code,'SECTION_NOT_ENTITLED');
  equal((await check('56')).allowed,false);
  equal(await auth.authenticate({headers:{...headers,
    authorization:'Bearer '+bearer({sub:'unknown-user'})}}),null);
  equal(await auth.authenticate({headers:{...headers,
    authorization:'Bearer '+bearer({role:'admin',plan:'Premium'})}}).then(x=>x.role),'user');
  equal(await auth.authenticate({headers:{authorization:headers.authorization}}),null);
  equal(await auth.authenticate({headers:{...headers,cookie:'__Host-myaktasession='+newSessionToken()}}),null);
  const downgraded=await reconcileExpiredAccount({accountId:'U003',store,clock:()=>fixed});
  equal(downgraded.changed,true);
  equal((await store.getSubscription('U003')).plan,'Free');
  equal((await store.getAuditEvents('U003')).length,1);

  // Peranti dicabut mesti terus menyekat sesi walaupun token sah.
  store.revokeSessionForTest('U003',session);
  equal(await auth.authenticate(request),null);
  equal((await check('1')).allowed,false);
  const other=newSessionToken();
  store.seedSessionForTest('U003',other,new Date(fixed+3600000).toISOString());
  equal(await auth.authenticate(request),null);
  equal((await store.verifySessionHash('U003',sessionDigest(other),fixed)).authorized,true);
  equal(await auth.authenticate({headers:{authorization:headers.authorization,
    cookie:'__Host-myaktasession='+other}}).then(x=>x.accountId),'U003');
  await store.close();

  // DB stays encrypted-by-transport responsibility of deployment, not in repo.
  const reopened=createDevSQLiteStore({filename:database});
  try{
    equal((await reopened.getSubscription('U003')).plan,'Free');
    equal((await reopened.getAuditEvents('U003')).length,1);
    equal((await reopened.findAccountBySubject(subject,issuer)).accountId,'U003');
  }finally{await reopened.close()}
  console.log('PASS OIDC verified subject -> akaun tersimpan, sesi hashed & satu peranti.');
  console.log('PASS JWT role/plan palsu ditolak; entitlement Rahmah tamat menjadi Free.');
  console.log('PASS revoke/logout peranti, rekod audit kekal dan SQLite boleh dibuka semula.');
  console.log('PASS '+count+' semakan integrasi auth SQLite berasingan (BUKAN production).');
 }finally{
  await store.close();
  fs.rmSync(tmp,{recursive:true,force:true});
 }
}
test().catch(e=>{console.error(e);process.exitCode=1});
