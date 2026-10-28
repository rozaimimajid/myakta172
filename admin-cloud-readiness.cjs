'use strict';
// Safe read-only production connection check. Requires DATABASE_URL server-side.
const {createCloudPool,assertCloudConnection}=require('./admin-cloud-config.cjs');
const {createPostgresRepository}=require('./admin-cloud-postgres.cjs');
async function main(){
 const pool=createCloudPool();
 try{
  await assertCloudConnection(pool);
  const store=createPostgresRepository({pool});
  if(!await store.health())throw Error('BACKEND_DB_HEALTH_FAILED');
  console.log('CLOUD_BACKEND_READINESS_OK: TLS verified, least-privilege role, DB reachable.');
 }finally{await pool.end()}
}
main().catch(e=>{
 // NEVER print connection strings, passwords or full driver error messages.
 const code=typeof e.code==='string'&&/^[A-Z0-9_]{3,64}$/.test(e.code)?
   e.code:'CLOUD_BACKEND_CHECK_FAILED';
 console.error(code);
 process.exitCode=1;
});
