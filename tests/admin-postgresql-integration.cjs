'use strict';
// Integration test PostgreSQL ephemeral GitHub Actions only.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {Client}=require('pg');
const cfg={host:process.env.PGHOST||'127.0.0.1',port:Number(process.env.PGPORT||5432),
  user:process.env.PGUSER||'myakta_ci',password:process.env.PGPASSWORD,
  database:process.env.PGDATABASE||'myakta_ci'};
if(!cfg.password)throw Error('TEST_PG_PASSWORD_REQUIRED');

async function main(){
  let checks=0;
  const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++};
  const client=new Client(cfg),other=new Client(cfg);
  await Promise.all([client.connect(),other.connect()]);
  try{
    await client.query(fs.readFileSync(path.join(__dirname,'..','admin-backend-postgresql.sql'),'utf8'));
    const account=crypto.randomUUID(),expiry='2026-10-27T14:00:00Z';
    await client.query('INSERT INTO myakta_private.accounts(account_id,email,auth_issuer,auth_subject) '+
      "VALUES($1,'person@example.test','https://idp.example.test','user-test')",[account]);
    await client.query('INSERT INTO myakta_private.subscriptions(account_id,plan,status,starts_at,expires_at) '+
      "VALUES($1,'Rahmah','Aktif','2026-09-27T14:00:00Z',$2)",[account,expiry]);
    await client.query("INSERT INTO myakta_private.favorites(account_id,section_id) VALUES($1,'19')",[account]);
    await client.query('INSERT INTO myakta_private.reading_history(account_id,section_id,read_at) '+
      "VALUES($1,'7','2026-10-20T14:00:00Z')",[account]);
    await client.query('INSERT INTO myakta_private.payments(payment_id,account_id,plan,category,amount_cents,status) '+
      "VALUES($1,$2,'Rahmah','Pembaharuan',2500,'Menunggu')",[crypto.randomUUID(),account]);

    const before=await client.query(
      'SELECT myakta_private.reconcile_auto_expired($1,$2::timestamptz) AS changed',
      [account,'2026-10-27T13:59:59.999Z']);
    eq(before.rows[0].changed,false);
    const rows=await Promise.all(Array.from({length:6},(_,i)=>
      (i%2===0?client:other).query(
        'SELECT myakta_private.reconcile_auto_expired($1,$2::timestamptz) AS changed',[account,expiry])));
    eq(rows.filter(x=>x.rows[0].changed).length,1,'Only one transaction downgrades');
    const current=await client.query(
      'SELECT plan,status,expires_at,revision FROM myakta_private.subscriptions WHERE account_id=$1',[account]);
    eq(current.rows[0].plan,'Free');
    eq(current.rows[0].status,'Aktif');
    eq(current.rows[0].expires_at,null);
    eq(current.rows[0].revision,'1');
    const audit=await client.query('SELECT * FROM myakta_private.audit_events WHERE account_id=$1',[account]);
    eq(audit.rowCount,1);eq(audit.rows[0].previous_plan,'Rahmah');
    eq(audit.rows[0].action,'AUTO_EXPIRED');
    eq((await client.query('SELECT 1 FROM myakta_private.subscription_history WHERE account_id=$1',[account])).rowCount,1);
    eq((await client.query('SELECT 1 FROM myakta_private.payments WHERE account_id=$1 AND status=$2',[account,'Menunggu'])).rowCount,1);
    eq((await client.query('SELECT 1 FROM myakta_private.favorites WHERE account_id=$1',[account])).rowCount,1);
    eq((await client.query('SELECT 1 FROM myakta_private.reading_history WHERE account_id=$1',[account])).rowCount,1);

    const security=await client.query('SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n '+
      "ON n.oid=c.relnamespace WHERE n.nspname='myakta_private' AND c.relkind='r' AND c.relrowsecurity");
    eq(security.rows[0].n,9);
    await client.query('CREATE ROLE myakta_guest NOLOGIN');
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE myakta_guest');
    await assert.rejects(client.query('SELECT * FROM myakta_private.accounts LIMIT 1'),/permission denied/);
    checks++;await client.query('ROLLBACK');
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE myakta_guest');
    await assert.rejects(client.query('SELECT myakta_private.reconcile_auto_expired($1)',[account]),/permission denied/);
    checks++;await client.query('ROLLBACK');
    await client.query('DROP ROLE myakta_guest');
    console.log('PASS PostgreSQL ephemeral: migration, six concurrent requests and single AUTO_EXPIRED.');
    console.log('PASS PostgreSQL ephemeral: RLS default deny and protected reconciliation.');
    console.log('PASS PostgreSQL ephemeral: payments, history and favorites are not deleted.');
    console.log('PASS '+checks+' PostgreSQL tests (NOT connected to customer production).');
  }finally{await Promise.allSettled([client.end(),other.end()])}
}
main().catch(e=>{console.error(e);process.exitCode=1});
