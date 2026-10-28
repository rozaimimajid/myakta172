'use strict';
/**
 * MyAKTA172 Fasa 3B — glue for a private PostgreSQL cloud backend.
 * Deliberately exposes NO public routes: Fasa 3C must supply OIDC IdP,
 * HTTPS reverse proxy, CSRF controls, login/session issuing and rate limits.
 * Protected premium resources must be stored outside GitHub Pages/PWA.
 */
const {createCloudPool,assertCloudConnection}=require('./admin-cloud-config.cjs');
const {createPostgresRepository}=require('./admin-cloud-postgres.cjs');
const {createAuthAdapter}=require('./admin-auth-foundation.cjs');
const {
  authorizeEntitlement,reconcileExpiredAccount,createProtectedContentHandler
}=require('./admin-subscription-engine.cjs');
function createBackendServices({pool,verifyToken,readContent,clock=()=>Date.now()}={}){
  if(!pool||typeof verifyToken!=='function')throw Error('CLOUD_BACKEND_NOT_CONFIGURED');
  const db=createPostgresRepository({pool,clock});
  const auth=createAuthAdapter({
    verifyToken,
    findAccountBySubject:(subject,issuer)=>db.findAccountBySubject(subject,issuer),
    verifyDeviceSession:(id,hash,at)=>db.verifySessionHash(id,hash,at),
    clock
  });
  const authorize=(request,{section=null,feature=null,chartSections=null}={})=>
    authorizeEntitlement({
      request,authenticate:auth.authenticate,loadSubscription:db.getSubscription,
      checkSingleActiveSession:auth.checkSingleActiveSession,
      section,feature,chartSections,clock
    });
  const protectedContent=createProtectedContentHandler({
    authenticate:auth.authenticate,loadSubscription:db.getSubscription,
    checkSingleActiveSession:auth.checkSingleActiveSession,readContent,clock
  });
  const reconcile=accountId=>reconcileExpiredAccount({accountId,store:db,clock});
  return Object.freeze({db,authenticate:auth.authenticate,authorize,protectedContent,reconcile});
}
async function connectCloudBackend({env=process.env,verifyToken,readContent,clock=()=>Date.now()}={}){
  if(typeof verifyToken!=='function')throw Error('OIDC_VERIFIER_REQUIRED');
  const pool=createCloudPool({env});
  try{
    await assertCloudConnection(pool);
    return Object.freeze({
      ...createBackendServices({pool,verifyToken,readContent,clock}),
      close:()=>pool.end()
    });
  }catch(e){await pool.end();throw e}
}
module.exports=Object.freeze({createBackendServices,connectCloudBackend});
