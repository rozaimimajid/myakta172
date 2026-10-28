-- Fasa 3B: role PostgreSQL khas untuk backend peribadi (staging).
-- Jalankan SELEPAS admin-backend-postgresql.sql sebagai pemilik skema DBA.
-- TIDAK membina akaun LOGIN atau mengandungi kata laluan.
-- Pengendali awan mewujudkan LOGIN rahsia di luar repo dan GRANT
-- myakta_backend_runtime TO <nama_role_login> melalui saluran peribadi.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='myakta_backend_runtime') THEN
    CREATE ROLE myakta_backend_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA myakta_private TO myakta_backend_runtime;
GRANT SELECT ON myakta_private.accounts,
  myakta_private.subscriptions,myakta_private.device_sessions,
  myakta_private.audit_events,myakta_private.subscription_history
  TO myakta_backend_runtime;
GRANT UPDATE(plan,status,starts_at,expires_at,revision,updated_at)
  ON myakta_private.subscriptions TO myakta_backend_runtime;
GRANT INSERT,UPDATE ON myakta_private.device_sessions TO myakta_backend_runtime;
GRANT INSERT ON myakta_private.audit_events,myakta_private.subscription_history
  TO myakta_backend_runtime;
-- Tiada GRANT akses pembayaran, resit atau kandungan premium melalui lapisan 3B.

DROP POLICY IF EXISTS backend_accounts_read ON myakta_private.accounts;
CREATE POLICY backend_accounts_read ON myakta_private.accounts FOR SELECT
  TO myakta_backend_runtime USING (true);
DROP POLICY IF EXISTS backend_subscriptions_read ON myakta_private.subscriptions;
CREATE POLICY backend_subscriptions_read ON myakta_private.subscriptions FOR SELECT
  TO myakta_backend_runtime USING (true);
DROP POLICY IF EXISTS backend_subscriptions_update ON myakta_private.subscriptions;
CREATE POLICY backend_subscriptions_update ON myakta_private.subscriptions FOR UPDATE
  TO myakta_backend_runtime USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS backend_sessions_read ON myakta_private.device_sessions;
CREATE POLICY backend_sessions_read ON myakta_private.device_sessions FOR SELECT
  TO myakta_backend_runtime USING (true);
DROP POLICY IF EXISTS backend_sessions_insert ON myakta_private.device_sessions;
CREATE POLICY backend_sessions_insert ON myakta_private.device_sessions FOR INSERT
  TO myakta_backend_runtime WITH CHECK (true);
DROP POLICY IF EXISTS backend_sessions_update ON myakta_private.device_sessions;
CREATE POLICY backend_sessions_update ON myakta_private.device_sessions FOR UPDATE
  TO myakta_backend_runtime USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS backend_audit_read ON myakta_private.audit_events;
CREATE POLICY backend_audit_read ON myakta_private.audit_events FOR SELECT
  TO myakta_backend_runtime USING (true);
DROP POLICY IF EXISTS backend_audit_insert ON myakta_private.audit_events;
CREATE POLICY backend_audit_insert ON myakta_private.audit_events FOR INSERT
  TO myakta_backend_runtime WITH CHECK (true);
DROP POLICY IF EXISTS backend_history_read ON myakta_private.subscription_history;
CREATE POLICY backend_history_read ON myakta_private.subscription_history FOR SELECT
  TO myakta_backend_runtime USING (true);
DROP POLICY IF EXISTS backend_history_insert ON myakta_private.subscription_history;
CREATE POLICY backend_history_insert ON myakta_private.subscription_history FOR INSERT
  TO myakta_backend_runtime WITH CHECK (true);

-- RLS pada data pembayaran, bookmarks, sejarah, highlight tetap default-deny.
-- Fungsi SECURITY DEFINER reconciler masih tiada GRANT EXECUTE untuk role ini.
REVOKE ALL ON FUNCTION myakta_private.reconcile_auto_expired(UUID,TIMESTAMPTZ)
  FROM myakta_backend_runtime;
COMMIT;
