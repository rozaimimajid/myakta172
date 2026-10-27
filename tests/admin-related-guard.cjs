'use strict';
// Ujian polisi + gerbang pelayan Hubungan Antara Seksyen (27 Okt 2026).
const assert=require('node:assert/strict');
const P=require('../admin-package-policy.js');
const {authorizeRelatedRequest,createRelatedHandler}=require('../admin-related-access-guard.cjs');
const fixed=Date.parse('2026-10-27T12:00:00Z');
const goodIdentity={accountId:'U002',sessionId:'SESSION_VERIFIED_BY_BACKEND',role:'user'};
const sub=(plan='Basic',overrides={})=>({accountId:'U002',plan,status:'Aktif',expiresAt:'2026-11-18T12:00:00Z',...overrides});
function dependencies(plan='Basic',overrides={}){
  return {
    authenticate:async()=>goodIdentity,
    loadSubscription:async()=>sub(plan),
    checkSingleActiveSession:async()=>({authorized:true,activeCount:1}),
    clock:()=>fixed,...overrides
  };
}
async function run(){
  for(const [plan,allow] of [['Free',false],['Basic',true],['Rahmah',true],['Premium',true]]){
    assert.equal(P.listedFeature(plan,'related'),allow,'Matriks '+plan);
    assert.equal(P.canUseFeature(plan,'related'),allow,'Audit aktif '+plan);
  }
  assert.equal(P.relatedAuditPassed,true);
  assert.equal(P.relatedPendingAudit,false);
  assert.equal(P.relatedEnforcementIntegrated,false);
  assert.equal(P.relatedAuditRun,40500647354);
  // Tanpa backend: TOLAK. Jangan terima pakej yang dihantar dari JS pelanggan.
  assert.equal((await authorizeRelatedRequest({sourceSection:'1',request:{plan:'Premium'}})).status,503);
  for(const [plan,source,ok] of [
    ['Free','1',false],['Basic','1',true],['Basic','17',true],
    ['Basic','18',false],['Rahmah','18',true],['Rahmah','32',false],
    ['Premium','32',true],['Premium','56',true]
  ]){
    const result=await authorizeRelatedRequest({...dependencies(plan),sourceSection:source,request:{}});
    assert.equal(result.allowed===true,ok,plan+' + '+source);
  }
  // Pautan yang keluar dari bahagian layak ke bahagian terkunci mesti ditapis.
  assert.equal((await authorizeRelatedRequest({...dependencies(),sourceSection:'17',targetSection:'18'})).allowed,false);
  assert.equal((await authorizeRelatedRequest({...dependencies('Rahmah'),sourceSection:'18',targetSection:'32'})).allowed,false);
  assert.equal((await authorizeRelatedRequest({...dependencies('Premium'),sourceSection:'18',targetSection:'32'})).allowed,true);

  const denialCases=[
    dependencies('Basic',{authenticate:async()=>null}),
    dependencies('Basic',{authenticate:async()=>({...goodIdentity,sessionId:''})}),
    dependencies('Basic',{loadSubscription:async()=>null}),
    dependencies('Basic',{loadSubscription:async()=>sub('Basic',{accountId:'U999'})}),
    dependencies('Basic',{loadSubscription:async()=>sub('Basic',{status:'Digantung'})}),
    dependencies('Basic',{loadSubscription:async()=>sub('Basic',{expiresAt:'2026-10-01T00:00:00Z'})}),
    dependencies('Basic',{loadSubscription:async()=>sub('Basic',{expiresAt:'bad'})}),
    dependencies('Basic',{checkSingleActiveSession:async()=>({authorized:false,activeCount:1})}),
    dependencies('Basic',{checkSingleActiveSession:async()=>({authorized:true,activeCount:2})}),
    dependencies('Basic',{authenticate:async()=>{throw Error('auth service down')}})
  ];
  for(const opts of denialCases){
    const r=await authorizeRelatedRequest({...opts,sourceSection:'1'});
    assert.equal(r.allowed,false,'Mesti gagal-tertutup untuk identiti/langganan/sesi tidak sah');
  }
  assert.equal((await authorizeRelatedRequest({...dependencies(),sourceSection:'UNKNOWN'})).status,400);

  let readCalls=0;
  const handler=createRelatedHandler({...dependencies(),readRelatedLinks:async()=>{
    readCalls++;return ['1','18','56','1','XYZ'];
  }});
  const allow=await handler({},'1');
  assert.equal(allow.status,200);
  assert.deepEqual(allow.body.related,['1'],'Hanya destinasi dibenarkan boleh disiarkan');
  assert.equal(readCalls,1);
  const blocked=await handler({},'18');
  assert.equal(blocked.status,403);
  assert.equal(readCalls,1,'JANGAN baca data hubungan apabila tidak dibenarkan');
  const disabled=createRelatedHandler({readRelatedLinks:async()=>['1']});
  assert.equal((await disabled({},'1')).status,503);

  // Bacaan seksyen 56 tidak diubah; rujukan Akta 119 kekal di aplikasi terkunci.
  console.log('PASS kawalan backend Hubungan Seksyen: Free ditolak; Basic/Rahmah/Premium layak;');
  console.log('PASS seksyen tidak layak, tamat tempoh, digantung, sesi palsu/ganda, backend tiada semuanya ditolak;');
  console.log('PASS gerbang pelayan menapis destinasi dan tidak membaca data sebelum diberi kuasa.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
