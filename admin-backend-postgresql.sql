-- MyAKTA172 Fasa 3: PostgreSQL staging schema (BELUM DIJALANKAN pada production)
-- Jangan terbitkan jadual ini melalui REST awam tanpa lapisan auth/authorizer.
-- Jangan letakkan kandungan Akta premium dalam DB/pemprosesan awam.
BEGIN;
CREATE SCHEMA IF NOT EXISTS myakta_private;
REVOKE ALL ON SCHEMA myakta_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS myakta_private.accounts (
  account_id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  auth_issuer TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif','Digantung')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_subject_unique UNIQUE(auth_issuer, auth_subject)
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_ci
  ON myakta_private.accounts(lower(email));

CREATE TABLE IF NOT EXISTS myakta_private.subscriptions (
  account_id UUID PRIMARY KEY REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  plan TEXT NOT NULL CHECK (plan IN ('Free','Basic','Rahmah','Premium')),
  status TEXT NOT NULL CHECK (status IN ('Aktif','Digantung','Tamat')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revision BIGINT NOT NULL DEFAULT 0 CHECK (revision>=0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ( (plan='Free' AND starts_at IS NULL AND expires_at IS NULL)
      OR (plan<>'Free' AND expires_at IS NOT NULL AND
           (starts_at IS NULL OR starts_at<expires_at)) )
);
CREATE INDEX IF NOT EXISTS subscriptions_expiring
  ON myakta_private.subscriptions(expires_at) WHERE plan<>'Free';

CREATE TABLE IF NOT EXISTS myakta_private.device_sessions (
  session_hash BYTEA PRIMARY KEY CHECK (octet_length(session_hash)=32),
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  device_label TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS one_nonrevoked_device_per_account
  ON myakta_private.device_sessions(account_id) WHERE revoked_at IS NULL;
-- Semasa login peranti baharu, revoke sesi lama dalam transaksi dengan
-- SELECT account ... FOR UPDATE, kemudian masukkan sesi baharu.
-- "expired" sahaja TIDAK membatalkan partial UNIQUE index; revoke dahulu.

CREATE TABLE IF NOT EXISTS myakta_private.audit_events (
  event_id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  previous_plan TEXT NOT NULL,
  new_plan TEXT NOT NULL,
  expired_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_by_account_time
  ON myakta_private.audit_events(account_id, processed_at DESC);

CREATE TABLE IF NOT EXISTS myakta_private.subscription_history (
  event_id TEXT PRIMARY KEY REFERENCES myakta_private.audit_events(event_id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  old_plan TEXT NOT NULL,
  new_plan TEXT NOT NULL,
  previous_expiry TIMESTAMPTZ,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS myakta_private.payments (
  payment_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  plan TEXT NOT NULL CHECK (plan IN ('Basic','Rahmah','Premium')),
  category TEXT NOT NULL CHECK (category IN ('Langganan Baharu','Pembaharuan','Naik Taraf')),
  amount_cents BIGINT NOT NULL CHECK (amount_cents>=0),
  status TEXT NOT NULL CHECK (status IN ('Menunggu','Diluluskan','Ditolak')),
  receipt_storage_key TEXT,
  reviewed_by UUID REFERENCES myakta_private.accounts(account_id),
  reviewed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS myakta_private.favorites (
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  PRIMARY KEY(account_id, section_id)
);
CREATE TABLE IF NOT EXISTS myakta_private.reading_history (
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  read_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(account_id, section_id, read_at)
);
CREATE TABLE IF NOT EXISTS myakta_private.highlights (
  highlight_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES myakta_private.accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  value_json JSONB NOT NULL
);

-- Default-deny direct table access untuk token/anon jika provider
-- menerbitkan API automatik. Fungsi backend berperanan khas diperlukan.
ALTER TABLE myakta_private.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE myakta_private.highlights ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA myakta_private FROM PUBLIC;
-- Tidak ada polisi permissive/grant pengguna pada migrasi ini.
-- Akses backend mestilah menggunakan role servis terkawal dengan
-- grant paling minimum dan transaksi beridentiti verified.

-- Rekonsiliasi transaksi pada PostgreSQL (fungsi TIDAK diberi GRANT awam).
-- Caller perlu identiti backend yang telah disahkan / scheduler dalaman.
CREATE OR REPLACE FUNCTION myakta_private.reconcile_auto_expired(
  p_account UUID, p_asof TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, myakta_private
AS $fn$
DECLARE
  r myakta_private.subscriptions%ROWTYPE;
  v_event TEXT;
BEGIN
  IF p_account IS NULL OR p_asof IS NULL THEN
    RAISE EXCEPTION 'RECONCILE_INVALID_ARGS';
  END IF;
  SELECT * INTO r FROM myakta_private.subscriptions
    WHERE account_id=p_account FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND'; END IF;
  IF r.plan='Free' OR r.expires_at IS NULL OR r.expires_at>p_asof THEN
    RETURN FALSE;
  END IF;
  v_event='AUTO_EXPIRED:'||p_account::text||':'||
    to_char(r.expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  INSERT INTO myakta_private.audit_events
    (event_id,account_id,action,previous_plan,new_plan,expired_at,processed_at)
    VALUES(v_event,p_account,'AUTO_EXPIRED',r.plan,'Free',r.expires_at,p_asof);
  INSERT INTO myakta_private.subscription_history
    (event_id,account_id,old_plan,new_plan,previous_expiry,changed_at)
    VALUES(v_event,p_account,r.plan,'Free',r.expires_at,p_asof);
  UPDATE myakta_private.subscriptions
    SET plan='Free',starts_at=NULL,expires_at=NULL,
      status=CASE WHEN r.status='Digantung' THEN 'Digantung' ELSE 'Aktif' END,
      revision=revision+1,updated_at=p_asof
    WHERE account_id=p_account;
  RETURN TRUE;
END
$fn$;
REVOKE ALL ON FUNCTION myakta_private.reconcile_auto_expired(UUID,TIMESTAMPTZ)
  FROM PUBLIC;

COMMIT;
