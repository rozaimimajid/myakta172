'use strict';
/**
 * MyAKTA172 — asas pengesahan backend Fasa 3 (BELUM DIINTEGRASIKAN).
 * Validasi ACCESS TOKEN OIDC yang ditandatangani penerbit dipercayai.
 * Token daripada pengguna TIDAK boleh menentukan pakej, status atau peranan.
 * Kunci awam mesti dibekalkan oleh konfigurasi pelayan tersahih, bukan URL token.
 */
const crypto=require('node:crypto');
const MAX_TOKEN_LENGTH=8192;

function fail(code) {const e=new Error(code);e.code=code;return e}
function safeBase64url(segment){
  if(typeof segment!=='string'||!segment||!/^[A-Za-z0-9_-]+$/.test(segment))
    throw fail('INVALID_TOKEN_ENCODING');
  const buffer=Buffer.from(segment,'base64url');
  if(buffer.toString('base64url')!==segment)throw fail('NONCANONICAL_TOKEN_ENCODING');
  return buffer;
}
function objectPart(part) {
  try {
    const value=JSON.parse(safeBase64url(part).toString('utf8'));
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('NOT_OBJECT');
    return value;
  }catch {throw fail('INVALID_TOKEN_FORMAT')}
}
function strictTime(value){
  return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
}
const textId = v=>typeof v==='string'&&v.length>0&&v.length<=256;

async function verifyAccessToken({token,issuer,audience,resolvePublicKey,clock=()=>Date.now()}={}) {
  if(typeof token!=='string'||token.length>MAX_TOKEN_LENGTH||token.length<30)
    throw fail('INVALID_ACCESS_TOKEN');
  if(!textId(issuer)||!textId(audience)||typeof resolvePublicKey!=='function')
    throw fail('VERIFIER_UNCONFIGURED');
  const pieces=token.split('.');
  if(pieces.length!==3)throw fail('INVALID_TOKEN_FORMAT');
  const [head,payload,signature]=pieces;
  const header=objectPart(head);
  const claims=objectPart(payload);
  if(header.alg!=='RS256'||header.typ!=='JWT'||!textId(header.kid)||
      header.jku!==undefined||header.jwk!==undefined||header.x5u!==undefined)
    throw fail('UNSUPPORTED_TOKEN_HEADER');
  const key=await resolvePublicKey(header.kid);
  if(!key)throw fail('UNKNOWN_SIGNING_KEY');
  const publicKey=key instanceof crypto.KeyObject && key.type==='public' ? key : crypto.createPublicKey(key);
  if(publicKey.asymmetricKeyType!=='rsa')throw fail('INVALID_SIGNING_KEY');
  if(!crypto.verify('RSA-SHA256',Buffer.from(head+'.'+payload,'ascii'),
      publicKey,safeBase64url(signature)))throw fail('INVALID_TOKEN_SIGNATURE');
  const nowValue=Number(clock());
  if(!Number.isFinite(nowValue)||nowValue<0)throw fail('SERVER_CLOCK_INVALID');
  const now=Math.floor(nowValue/1000);
  if(claims.iss!==issuer ||
      !(claims.aud===audience||(Array.isArray(claims.aud)&&claims.aud.includes(audience)))||
      !textId(claims.sub)||!strictTime(claims.exp)||claims.exp<=now ||
      !strictTime(claims.iat)||claims.iat>now ||
      (claims.nbf!==undefined&&(!strictTime(claims.nbf)||claims.nbf>now)) ||
      (Array.isArray(claims.aud)&&claims.aud.length>1&&claims.azp!==audience))
    throw fail('INVALID_TOKEN_CLAIMS');
  // MFA is required for Admin operations by the deployment layer, not by this verifier.
  return Object.freeze({subject:claims.sub,issuer:claims.iss,audience,
    expiresAt:claims.exp,issuedAt:claims.iat,
    emailVerified:claims.email_verified===true,
    mfaVerified:Array.isArray(claims.amr)&&claims.amr.includes('mfa')});
}

function newSessionToken(){
  // 256-bit bearer secret. ONLY a SHA-256 digest may be persisted by server.
  return crypto.randomBytes(32).toString('base64url');
}
function sessionDigest(token){
  if(typeof token!=='string'||token.length<40||token.length>128||
      !/^[A-Za-z0-9_-]+$/.test(token))throw fail('INVALID_SESSION_TOKEN');
  return crypto.createHash('sha256').update(token,'utf8').digest('hex');
}
function parseSessionCookie(header,name='__Host-myaktasession'){
  if(typeof header!=='string'||header.length>4096)return null;
  const found=header.split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));
  if(found.length!==1)return null;
  const raw=found[0].slice(name.length+1);
  return /^[A-Za-z0-9_-]{40,128}$/.test(raw)?raw:null;
}
function sessionCookie(token,{maxAge=86400}={}){
  sessionDigest(token);
  if(!Number.isSafeInteger(maxAge)||maxAge<1||maxAge>86400)throw fail('COOKIE_MAX_AGE');
  return '__Host-myaktasession='+token+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+maxAge;
}
const clearSessionCookie=()=> '__Host-myaktasession=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

/**
 * authenticate(request) contract compatible with authorizeEntitlement().
 * A server must supply independently validated OIDC ACCESS tokens (aud=API),
 * account lookup by trusted provider subject, and session DB validator.
 * request.headers must be trusted raw headers received on a HTTPS server.
 */
function createAuthAdapter({verifyToken,findAccountBySubject,verifyDeviceSession,clock=()=>Date.now()}={}) {
  if([verifyToken,findAccountBySubject,verifyDeviceSession].some(x=>typeof x!=='function'))
    throw fail('AUTH_BACKEND_NOT_CONFIGURED');
  async function authenticate(request){
    if(!request||!request.headers)return null;
    const auth=request.headers.authorization;
    if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_.-]{30,8192}$/.test(auth))return null;
    const cookie=parseSessionCookie(request.headers.cookie);
    if(!cookie)return null;
    try{
      const claims=await verifyToken(auth.slice(7));
      const account=await findAccountBySubject(claims.subject,claims.issuer);
      if(!account||!textId(account.accountId)||account.status!=='Aktif'||
        !['user','admin'].includes(account.role))return null;
      const valid=await verifyDeviceSession(account.accountId,sessionDigest(cookie),Number(clock()));
      if(!valid||valid.authorized!==true||valid.activeCount!==1)return null;
      return Object.freeze({accountId:account.accountId,
        sessionId:cookie,role:account.role,status:account.status,
        mfaVerified:claims.mfaVerified===true});
    }catch{return null}
  }
  async function checkSingleActiveSession(accountId,token){
    try {
      const result=await verifyDeviceSession(accountId,sessionDigest(token),Number(clock()));
      return result?.authorized===true&&result.activeCount===1 ?
        {authorized:true,activeCount:1}:{authorized:false,activeCount:result?.activeCount||0};
    }catch {return {authorized:false,activeCount:0}}
  }
  return Object.freeze({authenticate,checkSingleActiveSession});
}
function assertAdminMfa(identity){
  return !!(identity&&identity.status==='Aktif'&&identity.role==='admin'&&identity.mfaVerified===true);
}
module.exports=Object.freeze({
  verifyAccessToken,newSessionToken,sessionDigest,parseSessionCookie,
  sessionCookie,clearSessionCookie,createAuthAdapter,assertAdminMfa
});
