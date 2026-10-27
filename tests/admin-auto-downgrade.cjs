'use strict';
const assert=require('node:assert/strict');
const P=require('../admin-package-policy.js');
const {
  effectiveSubscription,authorizeEntitlement,reconcileExpiredAccount,
  createProtectedContentHandler
}=require('../admin-subscription-engine.cjs');

const expiry='2026-10-27T12:00:00+08:00';
const end=Date.parse(expiry);
const before=end-1;
const after=end+1;
const base=(plan='Rahmah',overrides={})=>({
  accountId:'U003',plan,status:'Aktif',
  startsAt:'2026-09-27T04:00:00Z',expiresAt:expiry,...overrides
});
const identity={accountId:'U003',sessionId:'ONE_VERIFIED_SESSION',role:'user',status:'Aktif'};
const authDeps=(record=base(),time=before,overrides={})=>({
  request:{plan:'Premium',user:{role:'admin'}}, // dakwaan palsu tidak diambil kira
  authenticate:async()=>identity,
  loadSubscription:async()=>record,
  checkSingleActiveSession:async()=>({authorized:true,activeCount:1}),
  clock:()=>time,...overrides
});

// In-memory TEST ONLY; implementasi production MESTI mempunyai transaksi DB ACID,
// locked/serializable mengikut accountId dan UNIQUE(eventId).
function atomicFixture(subscription) {
  let record=structuredClone(subscription);
  let events=new Map();
  let tail=Promise.resolve();
  const preserved={email:'user@example.test',bookmarks:['19'],
    readingHistory:['7'],payments:['B021'],receipts:['receipt-021'],
    highlights:['mark-1']};
  return {
    preserved,
    snapshot:()=>structuredClone(record),
    events:()=>[...events.values()].map(e=>({...e})),
    async transaction(accountId,action) {
      const oldTail=tail;
      let release;
      tail=new Promise(res=>{release=res});
      await oldTail;
      let candidate=structuredClone(record);
      const pending=new Map(events);
      try{
        const result=await action({
          getSubscription:async id=>id===accountId?structuredClone(candidate):null,
          saveSubscription:async(id,s)=>{
            assert.equal(id,accountId);
            candidate=structuredClone(s);
          },
          insertAuditEventOnce:async e=>{
            if(!pending.has(e.eventId))pending.set(e.eventId,{...e});
          }
        });
        // ACID emulation: commit only after entire callback succeeds
        record=candidate;events=pending;
        return result;
      } finally {release()}
    }
  };
}

async function main(){
  let checks=0;
  function eq(actual,expected,info){assert.deepEqual(actual,expected,info);checks++}
  // Matematik 30 hari dan penilaian hak dalam milisaat tepat
  const period=P.period30Days('2026-10-01T00:00:00Z');
  eq(Date.parse(period.end)-Date.parse(period.start),30*86400000);
  eq(effectiveSubscription(base(),before).effectivePlan,'Rahmah');
  eq(effectiveSubscription(base(),end).effectivePlan,'Free');
  eq(effectiveSubscription(base(),end).code,'AUTO_EXPIRED');
  eq(effectiveSubscription(base(),after).effectivePlan,'Free');
  eq(effectiveSubscription(base('Basic'),end).effectivePlan,'Free');
  eq(effectiveSubscription(base('Premium'),end).effectivePlan,'Free');
  eq(effectiveSubscription(base('Free',{startsAt:null,expiresAt:null}),after).effectivePlan,'Free');
  eq(effectiveSubscription(base('Rahmah',{startsAt:'2026-10-28T00:00:00Z',expiresAt:'2026-11-30T00:00:00Z'}),end).effectivePlan,'Free');
  eq(effectiveSubscription(base('Rahmah',{status:'Digantung'}),end).allowed,false);
  eq(effectiveSubscription(base('Rahmah',{expiresAt:null}),end).allowed,false);
  eq(effectiveSubscription(base('Rahmah',{expiresAt:'27/10/2026'}),end).code,'EXPIRY_INVALID');
  eq(effectiveSubscription(base('Rahmah',{expiresAt:'2026-10-27T12:00:00'}),end).code,'EXPIRY_INVALID');
  eq(effectiveSubscription(base('Rahmah',{startsAt:'not-date'}),before).code,'START_INVALID');
  eq(effectiveSubscription({...base(),plan:'Enterprise'},before).code,'SUBSCRIPTION_INVALID');
  eq(effectiveSubscription(base(),NaN).code,'CLOCK_UNAVAILABLE');
  eq(effectiveSubscription(base('Rahmah',{expiresAt:'2026-10-27T04:00:00Z'}),end).effectivePlan,'Free');

  // Kekalkan entitlement efektif Free walaupun DB masih merekod pakej Rahmah
  // (pekerja latar belum dijalankan).
  let r=await authorizeEntitlement({...authDeps(base(),before),section:'18'});
  eq(r.allowed,true);eq(r.effectivePlan,'Rahmah');
  r=await authorizeEntitlement({...authDeps(base(),end),section:'18'});
  eq(r.allowed,false);eq(r.code,'SECTION_NOT_ENTITLED');
  r=await authorizeEntitlement({...authDeps(base(),end),section:'1'});
  eq(r.allowed,true);eq(r.effectivePlan,'Free');
  r=await authorizeEntitlement({...authDeps(base(),end),feature:'related'});
  eq(r.code,'FEATURE_NOT_ENTITLED');
  r=await authorizeEntitlement({...authDeps(base(),end),feature:'bookmarks'});
  eq(r.allowed,true);
  r=await authorizeEntitlement({...authDeps(base(),end),feature:'history'});
  eq(r.allowed,true);
  r=await authorizeEntitlement({...authDeps(base(),end),feature:'highlight'});
  eq(r.allowed,false);
  r=await authorizeEntitlement({...authDeps(base(),end),chartSections:['18']});
  eq(r.code,'CHART_NOT_ENTITLED');
  r=await authorizeEntitlement({...authDeps(base(),before),chartSections:['18']});
  eq(r.allowed,true);
  r=await authorizeEntitlement({...authDeps(base(),end),section:'56'});
  eq(r.allowed,false);
  r=await authorizeEntitlement({...authDeps(base('Premium'),before),section:'56'});
  eq(r.allowed,true);

  // Penggantungan, satu peranti, identiti dan rangkaian gagal-tertutup.
  const rejects=[
    authDeps(base(),end,{authenticate:async()=>null}),
    authDeps(base(),end,{authenticate:async()=>({...identity,status:'Digantung'})}),
    authDeps(base(),end,{authenticate:async()=>({...identity,sessionId:''})}),
    authDeps(base(),end,{loadSubscription:async()=>null}),
    authDeps(base(),end,{loadSubscription:async()=>base('Premium',{accountId:'OTHER'})}),
    authDeps(base(),end,{checkSingleActiveSession:async()=>({authorized:true,activeCount:2})}),
    authDeps(base(),end,{checkSingleActiveSession:async()=>({authorized:false,activeCount:1})}),
    authDeps(base('Rahmah',{status:'Digantung'}),end),
    authDeps(base(),end,{loadSubscription:async()=>{throw Error('DB unavailable')}}),
    authDeps(base(),end,{clock:()=>NaN})
  ];
  for(const deps of rejects){
    const verdict=await authorizeEntitlement({...deps,section:'1'});
    eq(verdict.allowed,false,'Jangan benarkan akses apabila auth/DB/sesi digantung atau tidak sah');
  }
  r=await authorizeEntitlement({section:'1'});
  eq(r.code,'BACKEND_NOT_CONNECTED');
  r=await authorizeEntitlement(authDeps(base(),before));
  eq(r.code,'ENTITLEMENT_NOT_SPECIFIED');

  // Gerbang API: JANGAN baca kandungan berkunci sebelum pengguna disahkan.
  let readCount=0;
  const protectedBefore=createProtectedContentHandler({
    ...authDeps(base(),before),
    readContent:async resource=>{readCount++;return {section:resource.section,text:'TEST_ONLY'};}
  });
  const protectedExpired=createProtectedContentHandler({
    ...authDeps(base(),end),
    readContent:async resource=>{readCount++;return {section:resource.section,text:'TEST_ONLY'};}
  });
  eq((await protectedBefore({}, {section:'18'})).status,200);
  eq(readCount,1);
  eq((await protectedExpired({}, {section:'18'})).status,403);
  eq(readCount,1);
  const freeContent=await protectedExpired({}, {section:'1'});
  eq(freeContent.status,200);
  eq(freeContent.headers['Cache-Control'],'private, no-store');
  eq(readCount,2);
  const unavailable=createProtectedContentHandler({...authDeps(base(),before)});
  eq((await unavailable({}, {section:'1'})).status,503);

  // Rekonsiliasi atomik mengubah hanya langganan; data kekal dan audit idempotent
  const store=atomicFixture(base('Rahmah',{pendingPayment:'Menunggu',receiptId:'B002'}));
  const initial=store.snapshot();
  const results=await Promise.all(Array.from({length:5},()=>reconcileExpiredAccount({
    accountId:'U003',store,clock:()=>end
  })));
  eq(results.filter(x=>x.changed).length,1);
  eq(store.snapshot().plan,'Free');
  eq(store.snapshot().expiresAt,null);
  eq(store.snapshot().status,'Aktif');
  eq(store.snapshot().pendingPayment,'Menunggu'); // pending TIDAK memperbaharui
  eq(store.snapshot().receiptId,initial.receiptId);
  eq(store.events().length,1);
  eq(store.events()[0].action,'AUTO_EXPIRED');
  eq(store.events()[0].previousPlan,'Rahmah');
  eq(store.events()[0].expiredAt,expiry);
  eq(store.preserved.bookmarks,['19']);
  eq(store.preserved.readingHistory,['7']);
  eq(store.preserved.payments,['B021']);
  eq(store.preserved.receipts,['receipt-021']);
  eq(store.preserved.highlights,['mark-1']);
  eq((await reconcileExpiredAccount({accountId:'U003',store,clock:()=>after})).changed,false);

  // Sebelum tamat tidak boleh turun; akaun digantung tidak terbuka kerana downgrade.
  const activeStore=atomicFixture(base());
  eq((await reconcileExpiredAccount({accountId:'U003',store:activeStore,clock:()=>before})).changed,false);
  eq(activeStore.snapshot().plan,'Rahmah');
  const suspendedStore=atomicFixture(base('Rahmah',{status:'Digantung'}));
  eq((await reconcileExpiredAccount({accountId:'U003',store:suspendedStore,clock:()=>end})).changed,true);
  eq(suspendedStore.snapshot().status,'Digantung');
  r=await authorizeEntitlement({...authDeps(suspendedStore.snapshot(),end),section:'1'});
  eq(r.allowed,false);

  // Kelayakan berbayar hanya boleh pulih selepas transaksi bayaran DILULUSKAN
  // pada backend (aliran pembayaran itu bukan sebahagian daripada modul ini).
  const afterApproval=base('Rahmah',{
    startsAt:new Date(end).toISOString(),
    expiresAt:new Date(end+30*86400000).toISOString(),
    status:'Aktif'
  });
  eq(effectiveSubscription(afterApproval,end+1).effectivePlan,'Rahmah');
  eq(effectiveSubscription(afterApproval,end+30*86400000).effectivePlan,'Free');
  // Perlindungan transaksi diperlukan walaupun event sebelum save gagal.
  const failStore=atomicFixture(base());
  const brokenStore={
    ...failStore,transaction:async(id,fn)=>failStore.transaction(id,async tx=>
      fn({...tx,saveSubscription:async()=>{throw Error('WRITE_FAIL')}}))
  };
  await assert.rejects(reconcileExpiredAccount({accountId:'U003',store:brokenStore,clock:()=>end}),/WRITE_FAIL/);
  checks++;
  eq(failStore.events().length,0);
  eq(failStore.snapshot().plan,'Rahmah');
  await assert.rejects(reconcileExpiredAccount({accountId:'U003',clock:()=>end}),/ATOMIC_STORE_REQUIRED/);
  checks++;

  console.log('PASS Fasa 3: auto-downgrade Basic/Rahmah/Premium kepada Free tepat masa tamat.');
  console.log('PASS hak akses semasa per-request, akaun digantung, sesi tunggal dan bayar menunggu.');
  console.log('PASS audit unik, idempotensi, transaksi atomik, rollback, data pengguna dipelihara.');
  console.log('PASS '+checks+' semakan terpilih enjin langganan backend (bukan integrasi produksi).');
}
main().catch(e=>{console.error(e);process.exitCode=1});
