'use strict';
/**
 * MyAKTA172 — core langganan backend Fasa 3.
 * LOCK: AUTO-DOWNGRADE-DESIGN-LOCK.md (27 Okt 2026).
 *
 * Hanya untuk server. JANGAN dipanggil daripada index.html/admin-preview.html
 * atau memuat data perundangan berbayar daripada fail awam. Penyambung storan
 * sebenar mesti menggunakan transaksi DB bersiri, rekod audit unik dan auth.
 */
const policy = require('./admin-package-policy.js');

const deny = (status, code, extra={}) =>
  Object.freeze({allowed:false,status,code,...extra});
const isoTime = value => typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) &&
  Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
const getTime = clock => {
  const t=Number(clock());
  return Number.isFinite(t) && t >= 0 ? t : null;
};
const validId = id => typeof id==='string' && id.trim().length>0;

// Berkuat kuasa pada saat permintaan dibuat, bukan mengikut status paparan.
// Rekod langganan ialah nilai yang DIPERCAYAI daripada DB pelayan.
function effectiveSubscription(subscription, timestamp=Date.now()) {
  const t=Number(timestamp);
  if (!Number.isFinite(t) || t<0) return deny(503,'CLOCK_UNAVAILABLE');
  if (!subscription || !validId(subscription.accountId) ||
      !Object.prototype.hasOwnProperty.call(policy.packages,subscription.plan) ||
      !['Aktif','Digantung','Tamat'].includes(subscription.status))
    return deny(503,'SUBSCRIPTION_INVALID');

  const suspended=subscription.status==='Digantung';
  if(subscription.plan==='Free'){
    if(subscription.status==='Tamat') return deny(503,'SUBSCRIPTION_INVALID');
    return Object.freeze({allowed:!suspended,effectivePlan:'Free',
      code:suspended?'ACCOUNT_SUSPENDED':'FREE',expired:false});
  }
  const expiry=isoTime(subscription.expiresAt);
  if(expiry===null) return deny(503,'EXPIRY_INVALID');
  const started=subscription.startsAt==null ? null : isoTime(subscription.startsAt);
  if(subscription.startsAt!=null && (started===null || started>expiry))
    return deny(503,'START_INVALID');
  const expired=t>=expiry;
  const notStarted=started!==null && t<started;
  const effectivePlan=(expired || notStarted)?'Free':subscription.plan;
  const allowed=!suspended && (expired || notStarted || subscription.status==='Aktif');
  return Object.freeze({
    allowed,effectivePlan,expired,notStarted,
    code:suspended?'ACCOUNT_SUSPENDED':expired?'AUTO_EXPIRED':
      notStarted?'NOT_STARTED':allowed?'ACTIVE':'SUBSCRIPTION_INACTIVE',
    ...(expired?{expiredAt:subscription.expiresAt,previousPlan:subscription.plan}:{})
  });
}

// Authorization server-side: semakan peranti + hak akses dilakukan SETIAP request.
// Tidak mempercayai request.plan, localStorage, token yang mendakwa pelan, atau
// keputusan UI. Pada saat tamat, akses Free masih dibenarkan jika sesi sah.
async function authorizeEntitlement({
  request, authenticate, loadSubscription, checkSingleActiveSession,
  section=null, feature=null, chartSections=null, clock=()=>Date.now()
}={}) {
  if([authenticate,loadSubscription,checkSingleActiveSession].some(fn=>typeof fn!=='function'))
    return deny(503,'BACKEND_NOT_CONNECTED');
  const t=getTime(clock);
  if(t===null)return deny(503,'CLOCK_UNAVAILABLE');
  if(section===null && feature===null && chartSections===null)
    return deny(400,'ENTITLEMENT_NOT_SPECIFIED');
  try {
    const identity=await authenticate(request);
    if(!identity || !validId(identity.accountId) || !validId(identity.sessionId) ||
       identity.role!=='user')return deny(401,'NOT_AUTHENTICATED');
    if(identity.status!=='Aktif')return deny(403,'ACCOUNT_INACTIVE');
    const record=await loadSubscription(identity.accountId);
    if(!record || record.accountId!==identity.accountId)
      return deny(503,'SUBSCRIPTION_UNAVAILABLE');
    const resolved=effectiveSubscription(record,t);
    if(!('effectivePlan' in resolved))return resolved;
    if(!resolved.allowed)return deny(403,resolved.code);
    const session=await checkSingleActiveSession(identity.accountId,identity.sessionId);
    if(!session || session.authorized!==true || session.activeCount!==1)
      return deny(403,'DEVICE_SESSION_INVALID');
    if(section!==null && (!policy.partOf(section) ||
       !policy.canRead(resolved.effectivePlan,section)))
      return deny(403,'SECTION_NOT_ENTITLED');
    if(feature!==null && (!policy.features.includes(feature) ||
       !policy.canUseFeature(resolved.effectivePlan,feature)))
      return deny(403,'FEATURE_NOT_ENTITLED');
    if(chartSections!==null && !policy.canUseChart(resolved.effectivePlan,chartSections))
      return deny(403,'CHART_NOT_ENTITLED');
    return Object.freeze({allowed:true,status:200,code:'ALLOWED',
      effectivePlan:resolved.effectivePlan,expired:resolved.expired,
      accountId:identity.accountId});
  } catch {
    return deny(503,'BACKEND_VERIFICATION_FAILED');
  }
}

// Penyelarasan tersimpan (untuk UI Admin/log) selepas masa tamat. Wajib
// transaksi atomik/bersiri per-akaun dan uniqueness bagi eventId.
// SETIAP permintaan akses masih gunakan effectiveSubscription() di atas,
// bukan bergantung pada bila job latar dijalankan.
async function reconcileExpiredAccount({
  accountId, store, clock=()=>Date.now()
}={}) {
  if(!validId(accountId)) throw Error('ACCOUNT_ID_REQUIRED');
  if(!store || typeof store.transaction!=='function')
    throw Error('ATOMIC_STORE_REQUIRED');
  const t=getTime(clock);
  if(t===null)throw Error('SERVER_CLOCK_UNAVAILABLE');
  return store.transaction(accountId, async tx=>{
    if(!tx || ['getSubscription','saveSubscription','insertAuditEventOnce']
      .some(k=>typeof tx[k]!=='function'))throw Error('ATOMIC_TRANSACTION_REQUIRED');
    const record=await tx.getSubscription(accountId);
    if(!record || record.accountId!==accountId)throw Error('SUBSCRIPTION_UNAVAILABLE');
    const status=effectiveSubscription(record,t);
    if(!('effectivePlan' in status))throw Error(status.code);
    if(!status.expired || record.plan==='Free')
      return Object.freeze({changed:false,effectivePlan:status.effectivePlan});
    const event=Object.freeze({
      eventId:'AUTO_EXPIRED:'+accountId+':'+record.expiresAt,
      accountId,action:'AUTO_EXPIRED',previousPlan:record.plan,
      newPlan:'Free',expiredAt:record.expiresAt,processedAt:new Date(t).toISOString()
    });
    // Jangan padam receipt, bookmarks, history atau rekod pembayaran.
    // Rekod terdahulu dipelihara di dalam sejarah berasingan melalui event unik.
    await tx.insertAuditEventOnce(event);
    await tx.saveSubscription(accountId,{
      ...record,plan:'Free',startsAt:null,expiresAt:null,
      status:record.status==='Digantung'?'Digantung':'Aktif'
    });
    return Object.freeze({changed:true,effectivePlan:'Free',eventId:event.eventId});
  });
}

// Template laluan API kandungan berbayar: semak hak SEBELUM baca sumber.
// readContent wajib mengambil daripada storan protected, bukan fail statik awam.
function createProtectedContentHandler({
  authenticate,loadSubscription,checkSingleActiveSession,readContent,clock
}={}) {
  const headers=Object.freeze({'Cache-Control':'private, no-store'});
  return async function handle(request,{section=null,feature=null,chartSections=null}={}) {
    if(typeof readContent!=='function')
      return {status:503,headers,body:{error:'BACKEND_NOT_CONNECTED'}};
    const verdict=await authorizeEntitlement({
      request,authenticate,loadSubscription,checkSingleActiveSession,
      section,feature,chartSections,clock
    });
    if(!verdict.allowed)return {status:verdict.status,headers,body:{error:verdict.code}};
    try {
      // Servis kandungan mesti membenarkan tepat resource yang diminta sahaja.
      const result=await readContent({
        accountId:verdict.accountId,effectivePlan:verdict.effectivePlan,
        section,feature,chartSections
      });
      if(result===null || result===undefined)
        return {status:404,headers,body:{error:'CONTENT_NOT_FOUND'}};
      return {status:200,headers,body:result};
    } catch {
      return {status:503,headers,body:{error:'CONTENT_UNAVAILABLE'}};
    }
  };
}

// Backend adapter expected:
// store.transaction(accountId, callback) mesti ACID, terkunci/serializable,
// rollback kedua-dua tulisan jika gagal, UNIQUE audit.eventId, tiada akses awam.
// Jangan guna fungsi ini dengan storan JS browser/localStorage.
module.exports=Object.freeze({
  effectiveSubscription,authorizeEntitlement,reconcileExpiredAccount,
  createProtectedContentHandler
});
