'use strict';
/**
 * Fasa 3B — konfigurasi sambungan PostgreSQL awan.
 * Secrets only via HTTPS hosting secret manager / server env, NEVER browser JS.
 * Production must use a dedicated login that inherits myakta_backend_runtime,
 * not a database owner, superuser or RLS bypass role.
 */
const net=require('node:net');
function fail(code){const e=new Error(code);e.code=code;return e}
function parseCloudDatabaseConfig(env=process.env){
  if(env.NODE_TLS_REJECT_UNAUTHORIZED==='0')throw fail('UNSAFE_TLS_OVERRIDE');
  const raw=env.DATABASE_URL;
  if(typeof raw!=='string'||!raw||raw.length>4096)throw fail('CLOUD_DATABASE_NOT_CONFIGURED');
  let url;
  try{url=new URL(raw)}catch{throw fail('INVALID_DATABASE_URL')}
  if(!['postgresql:','postgres:'].includes(url.protocol)||url.search||url.hash||
     !url.username||!url.password||!url.pathname||url.pathname==='/'||
     !url.hostname||net.isIP(url.hostname)||
     ['localhost','local','postgres','database'].includes(url.hostname.toLowerCase())||
     url.hostname.toLowerCase().endsWith('.localhost')||
     url.hostname.toLowerCase().endsWith('.local'))
     throw fail('INVALID_CLOUD_DATABASE_URL');
  const port=url.port?Number(url.port):5432;
  if(!Number.isSafeInteger(port)||port<1||port>65535)throw fail('INVALID_CLOUD_DATABASE_PORT');
  const username=decodeURIComponent(url.username);
  const password=decodeURIComponent(url.password);
  const database=decodeURIComponent(url.pathname.slice(1));
  if(!username||!password||!database||database.includes('/'))
    throw fail('INVALID_DATABASE_CREDENTIAL_FORMAT');
  if(['postgres','root','admin','supabase_admin'].includes(username.toLowerCase()))
    throw fail('PRIVILEGED_DB_LOGIN_FORBIDDEN');
  // CA PEM can be provided via server secret manager; OS trust used otherwise.
  const ca=env.DATABASE_CA_PEM;
  if(ca!==undefined&&(typeof ca!=='string'||!ca.includes('-----BEGIN CERTIFICATE-----')))
    throw fail('INVALID_DATABASE_CA');
  return Object.freeze({host:url.hostname,port,user:username,password,database,
    ssl:Object.freeze({rejectUnauthorized:true,servername:url.hostname,
      ...(ca?{ca}:{})}),
    max:5,connectionTimeoutMillis:7000,idleTimeoutMillis:10000,
    statement_timeout:10000,query_timeout:12000});
}
function createCloudPool({env=process.env,PoolConstructor}={}){
  const cfg=parseCloudDatabaseConfig(env);
  const Pool=PoolConstructor||require('pg').Pool;
  return new Pool(cfg);
}
async function assertCloudConnection(pool) {
  if(!pool||typeof pool.query!=='function')throw fail('DATABASE_POOL_REQUIRED');
  // Explicitly check the *current* runtime role, its RLS flags, schema
  // ownership, and that the TLS transport reached PostgreSQL.
  const q=await pool.query(
    "SELECT current_user AS login_role, r.rolsuper AS superuser, "+
    "r.rolbypassrls AS bypass_rls, "+
    "(n.nspowner::regrole)::text AS schema_owner, "+
    "pg_has_role(current_user,'myakta_backend_runtime','member') AS runtime_member, "+
    "COALESCE((SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()),false) AS tls "+
    "FROM pg_roles r CROSS JOIN pg_namespace n "+
    "WHERE r.rolname=current_user AND n.nspname='myakta_private'");
  const a=q.rows[0];
  if(!a||a.superuser!==false||a.bypass_rls!==false||
     a.schema_owner===a.login_role||a.runtime_member!==true||
     a.tls!==true)throw fail('UNSAFE_DATABASE_ROLE_OR_TRANSPORT');
  // No privileged table operations are needed for this status check.
  return Object.freeze({ready:true,tls:true,roleVerified:true});
}
module.exports=Object.freeze({
  parseCloudDatabaseConfig,createCloudPool,assertCloudConnection
});
