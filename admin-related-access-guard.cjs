'use strict';
// Dasar kawalan Hubungan Seksyen untuk penggunaan pada PELAYAN sahaja.
// TIDAK dipautkan kepada index.html; penyerahan identiti & data langganan mesti
// datang daripada backend yang memperakui token, DB dan sesi, BUKAN nilai JS pengguna.
// Tanpa penyedia server-side yang boleh dipercayai: semua permintaan DITOLAK.
const policy = require('./admin-package-policy.js');

const deny = (status, code) => Object.freeze({allowed:false,status,code});
const canonical = id => typeof id === 'string' && /^[0-9]{1,2}[A-H]?$/.test(id.trim().toUpperCase())
  ? id.trim().toUpperCase() : null;

async function authorizeRelatedRequest({
  request, sourceSection, targetSection=null,
  authenticate, loadSubscription, checkSingleActiveSession,
  clock=()=>Date.now()
}={}) {
  if (!policy.relatedAuditPassed || policy.relatedPendingAudit) return deny(503,'FEATURE_NOT_AUDITED');
  if ([authenticate,loadSubscription,checkSingleActiveSession].some(f=>typeof f!=='function'))
    return deny(503,'BACKEND_NOT_CONNECTED');
  const source=canonical(sourceSection);
  const target=targetSection===null?null:canonical(targetSection);
  if (!source || !policy.partOf(source) ||
     (targetSection!==null && (!target || !policy.partOf(target)))) return deny(400,'INVALID_SECTION');
  try {
    // authenticate() MUST verify the login token at the server, never blindly trust request.user.
    const identity=await authenticate(request);
    if (!identity || typeof identity.accountId!=='string' || !identity.accountId.trim() ||
        typeof identity.sessionId!=='string' || !identity.sessionId.trim() ||
        identity.role!=='user') return deny(401,'NOT_AUTHENTICATED');

    const sub=await loadSubscription(identity.accountId);
    if (!sub || sub.accountId!==identity.accountId ||
        !policy.canUseFeature(sub.plan,'related')) return deny(403,'PACKAGE_NOT_ELIGIBLE');
    if (sub.status!=='Aktif') return deny(403,'SUBSCRIPTION_INACTIVE');
    const t=Number(clock());
    if (!Number.isFinite(t)) return deny(503,'SERVER_CLOCK_INVALID');
    if (sub.plan!=='Free' && (!sub.expiresAt || !Number.isFinite(Date.parse(sub.expiresAt)) ||
         Date.parse(sub.expiresAt)<=t)) return deny(403,'SUBSCRIPTION_EXPIRED');
    if (!policy.canRead(sub.plan,source) ||
        (target && !policy.canRead(sub.plan,target))) return deny(403,'SECTION_NOT_ENTITLED');

    // checkSingleActiveSession verifies session ownership and revocation in protected DB.
    const session=await checkSingleActiveSession(identity.accountId,identity.sessionId);
    if (!session || session.authorized!==true || session.activeCount!==1)
      return deny(403,'DEVICE_SESSION_INVALID');
    return Object.freeze({allowed:true,status:200,code:'ALLOWED',plan:sub.plan,sourceSection:source,
      ...(target?{targetSection:target}:{})});
  } catch {
    return deny(503,'BACKEND_VERIFICATION_FAILED'); // gagal-tertutup, jangan bocor ralat dalaman
  }
}

// Gerbang respons sebenar: muat kandungan hubungan HANYA selepas kebenaran server.
// readRelatedLinks(source) hendaklah membaca sumber TERLINDUNG, bukan JS awam/PWA cache.
// Semua ID destinasi ditapis semula supaya pakej Basic/Rahmah tidak bocor bahagian Premium.
function createRelatedHandler({authenticate,loadSubscription,checkSingleActiveSession,readRelatedLinks,clock}={}) {
  return async function handleRelated(request,sourceSection) {
    if (typeof readRelatedLinks!=='function') return {status:503,body:{error:'BACKEND_NOT_CONNECTED'}};
    const verdict=await authorizeRelatedRequest({request,sourceSection,authenticate,
      loadSubscription,checkSingleActiveSession,clock});
    if (!verdict.allowed) return {status:verdict.status,body:{error:verdict.code}};
    try {
      const links=await readRelatedLinks(verdict.sourceSection);
      if (!Array.isArray(links)) return {status:503,body:{error:'RELATED_DATA_UNAVAILABLE'}};
      const permitted=[...new Set(links.map(canonical).filter(id=>id && policy.canRead(verdict.plan,id)))];
      return {status:200,body:{section:verdict.sourceSection,related:permitted}};
    } catch {
      return {status:503,body:{error:'RELATED_DATA_UNAVAILABLE'}};
    }
  };
}

module.exports=Object.freeze({authorizeRelatedRequest,createRelatedHandler});
