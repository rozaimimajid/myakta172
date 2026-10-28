'use strict';
const assert=require('node:assert/strict');
const {
  parseCloudDatabaseConfig,createCloudPool,assertCloudConnection
}=require('../admin-cloud-config.cjs');
function main(){
 let checks=0;
 const eq=(a,b)=>{assert.deepEqual(a,b);checks++};
 const good={DATABASE_URL:'postgresql://myakta_runtime_login:p%40ss123@db.example.test:5432/myakta172'};
 const cfg=parseCloudDatabaseConfig(good);
 eq(cfg.host,'db.example.test');
 eq(cfg.port,5432);
 eq(cfg.user,'myakta_runtime_login');
 eq(cfg.password,'p@ss123');
 eq(cfg.database,'myakta172');
 eq(cfg.ssl.rejectUnauthorized,true);
 eq(cfg.ssl.servername,'db.example.test');
 let forwarded;
 class FakePool{constructor(options){forwarded=options}}
 createCloudPool({env:good,PoolConstructor:FakePool});
 eq(forwarded.ssl.rejectUnauthorized,true);
 eq(forwarded.connectionTimeoutMillis,7000);
 const rejected=[
   {},{DATABASE_URL:'postgresql://postgres:pass@db.example.test/db'},
   {DATABASE_URL:'postgresql://myakta_runtime_login:pass@localhost/db'},
   {DATABASE_URL:'postgresql://myakta_runtime_login:pass@127.0.0.1/db'},
   {DATABASE_URL:'postgresql://myakta_runtime_login:pass@db.example.test/db?sslmode=disable'},
   {DATABASE_URL:'http://myakta_runtime_login:pass@db.example.test/db'},
   {DATABASE_URL:'postgresql://myakta_runtime_login:pass@db.example.test/db',
     NODE_TLS_REJECT_UNAUTHORIZED:'0'},
   {DATABASE_URL:'postgresql://myakta_runtime_login:pass@db.example.test/db',
     DATABASE_CA_PEM:'not-a-certificate'}
 ];
 for(const input of rejected){assert.throws(()=>parseCloudDatabaseConfig(input));checks++}
 return Promise.resolve().then(async()=>{
  const safe={query:async()=>({rows:[{login_role:'myakta_login',schema_owner:'myakta_owner',
    superuser:false,bypass_rls:false,runtime_member:true,tls:true}]})};
  eq((await assertCloudConnection(safe)).ready,true);
  for(const override of [
   {login_role:'myakta_owner',schema_owner:'myakta_owner'},
   {superuser:true},{bypass_rls:true},{runtime_member:false},{tls:false}
  ]){
   const pool={query:async()=>({rows:[{
    login_role:'myakta_login',schema_owner:'myakta_owner',superuser:false,
    bypass_rls:false,runtime_member:true,tls:true,...override
   }]})};
   await assert.rejects(assertCloudConnection(pool),/UNSAFE_DATABASE_ROLE_OR_TRANSPORT/);
   checks++;
  }
  console.log('PASS Cloud config: TLS certificate/hostname verified, cloud-only DSN, role checks.');
  console.log('PASS '+checks+' cloud configuration/security checks (NO cloud credentials).');
 });
}
main().catch(e=>{console.error(e);process.exitCode=1});
