'use strict';
// Ujian sebenar SQLite setempat, tanpa data pengguna/pembayaran sebenar.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {createDevSQLiteStore}=require('../admin-backend-sqlite.cjs');
const {reconcileExpiredAccount,authorizeEntitlement}=require('../admin-subscription-engine.cjs');

const fixed=Date.parse('2026-10-27T04:00:00Z');
const expiry=new Date(fixed).toISOString();
const token='dev-session-'+crypto.randomBytes(20).toString('hex');
const account={accountId:'U003',email:'pengguna03@example.test',status:'Aktif'};
const sub={accountId:'U003',plan:'Rahmah',status:'Aktif',
  startsAt:new Date(fixed-30*86400000).toISOString(),expiresAt:expiry};
const identity={accountId:'U003',sessionId:token,role:'user',status:'Aktif'};
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'myakta172-f3-test-'));
const filename=path.join(temp,'private.sqlite');

async function run(){
  let checks=0;
  const eq=(a,b,desc)=>{assert.deepEqual(a,b,desc);checks++};
  const store=createDevSQLiteStore({filename,allowTestSeed:true});
  try{
    store.seedForTest(account,sub);
    store.seedSessionForTest(account.accountId,token,new Date(fixed+7*86400000).toISOString());
    store.execForTest(
      "INSERT INTO favorites(account_id,section_id) VALUES('U003','19');"+
      "INSERT INTO reading_history(account_id,section_id,read_at) VALUES('U003','7','2026-10-01T01:00:00Z');"+
      "INSERT INTO highlights(highlight_id,account_id,section_id,value_json) VALUES('H001','U003','19','{}');"+
      "INSERT INTO payments(payment_id,account_id,plan,category,amount_cents,status,receipt_storage_key)"+
      " VALUES('B001','U003','Rahmah','Pembaharuan',2500,'Menunggu','private-only-reference');"
    );
    const before=await store.getEffective('U003',fixed-1);
    eq(before.effectivePlan,'Rahmah');
    const atExpiry=await store.getEffective('U003',fixed);
    eq(atExpiry.effectivePlan,'Free');
    eq((await store.getSubscription('U003')).plan,'Rahmah',
      'Rekonsiliasi DB belum berjalan tetapi pakej efektif sudah Free');

    const trusted={
      authenticate:async()=>identity,
      loadSubscription:id=>store.getSubscription(id),
      checkSingleActiveSession:(id,token)=>store.checkSingleActiveSession(id,token,fixed),
      clock:()=>fixed
    };
    let verdict=await authorizeEntitlement({...trusted,section:'18',request:{plan:'Premium'}});
    eq(verdict.allowed,false);
    eq(verdict.code,'SECTION_NOT_ENTITLED');
    verdict=await authorizeEntitlement({...trusted,section:'1'});
    eq(verdict.allowed,true);
    eq(verdict.effectivePlan,'Free');
    verdict=await authorizeEntitlement({...trusted,feature:'related'});
    eq(verdict.allowed,false);
    verdict=await authorizeEntitlement({...trusted,feature:'history'});
    eq(verdict.allowed,true);
    verdict=await authorizeEntitlement({...trusted,feature:'bookmarks'});
    eq(verdict.allowed,true);

    const tasks=Array.from({length:8},()=>reconcileExpiredAccount({
      accountId:'U003',store,clock:()=>fixed
    }));
    const events=await Promise.all(tasks);
    eq(events.filter(e=>e.changed).length,1,'8 tugas serentak menghasilkan satu penurunan pakej');
    const result=await store.getSubscription('U003');
    eq(result.plan,'Free');
    eq(result.status,'Aktif');
    eq(result.expiresAt,null);
    eq(result.revision,1);
    eq((await store.getAuditEvents('U003')).length,1);
    eq((await store.getPlanHistory('U003')).length,1);
    eq((await store.getAuditEvents('U003'))[0].action,'AUTO_EXPIRED');
    eq((await store.getPlanHistory('U003'))[0].old_plan,'Rahmah');
    eq((await store.readAccount('U003')).email,account.email);
    eq(store.selectForTest("SELECT COUNT(*) n FROM favorites WHERE account_id='U003'")[0].n,1);
    eq(store.selectForTest("SELECT COUNT(*) n FROM reading_history WHERE account_id='U003'")[0].n,1);
    eq(store.selectForTest("SELECT COUNT(*) n FROM highlights WHERE account_id='U003'")[0].n,1);
    eq({...store.selectForTest("SELECT status,amount_cents,receipt_storage_key FROM payments WHERE payment_id='B001'")[0]},
      {status:'Menunggu',amount_cents:2500,receipt_storage_key:'private-only-reference'});
    eq((await store.checkSingleActiveSession('U003',token,fixed)).authorized,true);
    eq((await store.checkSingleActiveSession('U003','other-session-123456',fixed)).authorized,false);
    eq((await store.checkSingleActiveSession('U003',token,fixed+8*86400000)).authorized,false);
    const hashes=store.selectForTest("SELECT session_hash FROM device_sessions");
    eq(hashes[0].session_hash,crypto.createHash('sha256').update(token).digest('hex'));
    assert.notEqual(hashes[0].session_hash,token);checks++;
    assert.throws(()=>store.seedSessionForTest('U003','second-session-12345678',new Date(fixed+8*86400000).toISOString()),
      /UNIQUE/);checks++;

    // Transaction must rollback both event and plan when audit insert fails.
    await assert.rejects(store.transaction('U003',async tx=>{
      await tx.insertAuditEventOnce({
        eventId:'AUTO_EXPIRED:U003:'+expiry,accountId:'U003',action:'AUTO_EXPIRED',
        previousPlan:'Rahmah',newPlan:'Free',expiredAt:expiry,processedAt:expiry
      });
    }),/AUDIT_EVENT_DUPLICATE/);
    checks++;
    eq((await store.getAuditEvents('U003')).length,1);
    await store.close();

    // Fail SQLite persists across process instances on disk, not a mutable array.
    const reopened=createDevSQLiteStore({filename});
    try{
      eq((await reopened.getSubscription('U003')).plan,'Free');
      eq((await reopened.getAuditEvents('U003')).length,1);
      eq((await reopened.getPlanHistory('U003')).length,1);
      eq((await reopened.readAccount('U003')).email,account.email);
      await assert.rejects(reopened.transaction('U003',async()=>{throw Error('TX_ABORT')}),/TX_ABORT/);
      checks++;
      assert.throws(()=>reopened.seedForTest(account,sub),/TEST_SEED_DISABLED/);
      checks++;
    } finally {await reopened.close()}

    // Do not create DB under public GitHub repo served by python http.server.
    assert.throws(()=>createDevSQLiteStore({
      filename:path.join(process.cwd(),'public-data.sqlite')
    }),/DB_MUST_NOT_BE_IN_PUBLIC_REPOSITORY/);
    checks++;
    assert.throws(()=>createDevSQLiteStore({filename:'relative.sqlite'}),/DB_PATH_MUST_BE_ABSOLUTE/);
    checks++;

    console.log('PASS SQLite: langganan Rahmah->Free pada sempadan masa, hak akses setiap request.');
    console.log('PASS SQLite: 8 tugas serentak, satu event audit, sejarah dan data pengguna kekal.');
    console.log('PASS SQLite: DB tahan buka semula, transaksi rollback dan sesi satu peranti berhash.');
    console.log('PASS SQLite: '+checks+' semakan integrasi setempat lulus (BUKAN produksi).');
  }finally{
    await store.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
}
run().catch(e=>{console.error(e);process.exitCode=1});
