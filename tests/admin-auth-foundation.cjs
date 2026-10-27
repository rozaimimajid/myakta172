'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {
 verifyAccessToken,newSessionToken,sessionDigest,parseSessionCookie,
 sessionCookie,clearSessionCookie,createAuthAdapter,assertAdminMfa
}=require('../admin-auth-foundation.cjs');
const {authorizeEntitlement}=require('../admin-subscription-engine.cjs');
const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const alt=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const fixed=Date.parse('2026-10-27T14:00:00Z');
const t=Math.floor(fixed/1000);
const issuer='https://identity.example.test';
const audience='myakta172-backend';
const kid='TRUSTED_KID_ONLY';
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const claims={iss:issuer,aud:audience,sub:'oidc-user-001',iat:t-1,exp:t+600,email_verified:true};
function signed(payload=claims,{alg='RS256',signer=privateKey,keyId=kid,typ='JWT',extraHeader={}}={}){
 const a=b64({typ,alg,kid:keyId,...extraHeader})+'.'+b64(payload);
 return a+'.'+crypto.sign('RSA-SHA256',Buffer.from(a,'ascii'),signer).toString('base64url');
}
const verify=token=>verifyAccessToken({token,issuer,audience,
  resolvePublicKey:async keyId=>keyId===kid?publicKey:null,clock:()=>fixed});
async function mustReject(promise){
 await assert.rejects(promise);return 1
}
async function main(){
 let checks=0;
 const eq=(a,b,desc)=>{assert.deepEqual(a,b,desc);checks++};
 const token=signed();
 const trusted=await verify(token);
 eq(trusted.subject,'oidc-user-001');
 eq(trusted.emailVerified,true);
 eq(trusted.issuer,issuer);
 eq(trusted.audience,audience);
 checks+=await mustReject(verify('not.a.jwt'));
 checks+=await mustReject(verify(signed(claims,{alg:'none'})));
 checks+=await mustReject(verify(signed(claims,{keyId:'UNKNOWN_KID'})));
 checks+=await mustReject(verify(signed(claims,{signer:alt.privateKey})));
 checks+=await mustReject(verify(signed(claims,{extraHeader:{jku:'https://evil.example/keys'}})));
 checks+=await mustReject(verify(signed({...claims,aud:'wrong-api'})));
 checks+=await mustReject(verify(signed({...claims,iss:'https://untrusted.example'})));
 checks+=await mustReject(verify(signed({...claims,exp:t})));
 checks+=await mustReject(verify(signed({...claims,nbf:t+10})));
 checks+=await mustReject(verify(signed({...claims,iat:t+10})));
 checks+=await mustReject(verify(signed({...claims,sub:''})));
 checks+=await mustReject(verify(signed({...claims,aud:[audience,'other-api']})));
 checks+=await mustReject(verify(signed({...claims,exp:'2099-01-01'})));
 checks+=await mustReject(verify(signed({...claims,role:'admin',plan:'Premium'},
  {signer:alt.privateKey})));
 const session=newSessionToken();
 eq(session.length,43);
 eq(sessionDigest(session).length,64);
 assert.notEqual(session,sessionDigest(session));checks++;
 const cookie=sessionCookie(session);
 eq(cookie.includes('; Secure; SameSite=Strict; Max-Age=86400'),true);
 eq(cookie.includes('; HttpOnly;'),true);
 eq(parseSessionCookie(cookie),session);
 eq(parseSessionCookie(cookie+'; __Host-myaktasession='+session),null);
 eq(parseSessionCookie('session=another'),null);
 eq(clearSessionCookie().includes('Max-Age=0'),true);
 checks+=await mustReject(Promise.resolve().then(()=>sessionCookie(session,{maxAge:999999})));
 checks+=await mustReject(Promise.resolve().then(()=>sessionDigest('short')));

 const goodAccount={accountId:'U003',role:'user',status:'Aktif'};
 const authVerifier=createAuthAdapter({
  verifyToken:verify,
  findAccountBySubject:async(subject,iss)=>subject===claims.sub&&iss===issuer?goodAccount:null,
  verifyDeviceSession:async(accountId,hash,time)=>({
    authorized:accountId==='U003'&&hash===sessionDigest(session)&&time===fixed,activeCount:1
  }),
  clock:()=>fixed
 });
 const headers={authorization:'Bearer '+token,cookie:'__Host-myaktasession='+session};
 const principal=await authVerifier.authenticate({headers});
 eq(principal.accountId,'U003');
 eq(principal.role,'user');
 eq(principal.status,'Aktif');
 eq(principal.sessionId,session);
 eq(principal.mfaVerified,false);
 eq((await authVerifier.authenticate({headers:{cookie:headers.cookie}})),null);
 eq((await authVerifier.authenticate({headers:{...headers,authorization:'Bearer '+signed({...claims,role:'admin',plan:'Premium'},{signer:alt.privateKey})}})),null);
 eq((await authVerifier.authenticate({headers:{...headers,cookie:'bad-session'}})),null);
 eq((await authVerifier.checkSingleActiveSession('U003',session)).authorized,true);
 eq((await authVerifier.checkSingleActiveSession('U003',newSessionToken())).authorized,false);
 eq(assertAdminMfa(principal),false);
 eq(assertAdminMfa({...principal,role:'admin',mfaVerified:false}),false);
 eq(assertAdminMfa({...principal,role:'admin',mfaVerified:true}),true);

 const control=await authorizeEntitlement({
  request:{headers},
  authenticate:authVerifier.authenticate,
  checkSingleActiveSession:authVerifier.checkSingleActiveSession,
  loadSubscription:async()=>({
    accountId:'U003',plan:'Rahmah',status:'Aktif',
    startsAt:'2026-09-27T14:00:00Z',expiresAt:'2026-10-27T14:00:00Z'
  }),
  section:'18',clock:()=>fixed
 });
 eq(control.allowed,false);
 eq(control.code,'SECTION_NOT_ENTITLED'); // expires => Free at exact boundary.
 const free=await authorizeEntitlement({
  request:{headers},
  authenticate:authVerifier.authenticate,
  checkSingleActiveSession:authVerifier.checkSingleActiveSession,
  loadSubscription:async()=>({
    accountId:'U003',plan:'Rahmah',status:'Aktif',
    startsAt:'2026-09-27T14:00:00Z',expiresAt:'2026-10-27T14:00:00Z'
  }),section:'1',clock:()=>fixed
 });
 eq(free.allowed,true);
 eq(free.effectivePlan,'Free');
 console.log('PASS Auth: signature RS256, aud/iss/exp, key allowlist, role daripada DB.');
 console.log('PASS Auth: sesi raw hanya cookie Secure+HttpOnly, DB simpan hash, satu peranti.');
 console.log('PASS Auth: gabungan token verified dan entitlement tamat -> Free.');
 console.log('PASS '+checks+' semakan asas auth Fasa 3 (BUKAN login production).');
}
main().catch(err=>{console.error(err);process.exitCode=1});
