-- MyAKTA172 Fasa 3: pembangunan SQLite setempat untuk UJIAN SAHAJA.
-- BUKAN skema produksi teragih. Jangan letak fail DB dalam GitHub/GitHub Pages.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  account_id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif','Digantung')),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS subscriptions (
  account_id TEXT PRIMARY KEY REFERENCES accounts(account_id) ON DELETE RESTRICT,
  plan TEXT NOT NULL CHECK (plan IN ('Free','Basic','Rahmah','Premium')),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif','Digantung','Tamat')),
  starts_at TEXT,
  expires_at TEXT,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at TEXT NOT NULL,
  CHECK (plan <> 'Free' OR (starts_at IS NULL AND expires_at IS NULL)),
  CHECK (plan = 'Free' OR expires_at IS NOT NULL)
) STRICT;

CREATE TABLE IF NOT EXISTS audit_events (
  event_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  previous_plan TEXT NOT NULL,
  new_plan TEXT NOT NULL,
  expired_at TEXT NOT NULL,
  processed_at TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS audit_events_by_account ON audit_events(account_id,processed_at);

CREATE TABLE IF NOT EXISTS subscription_history (
  event_id TEXT PRIMARY KEY REFERENCES audit_events(event_id) ON DELETE RESTRICT,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  old_plan TEXT NOT NULL,
  new_plan TEXT NOT NULL,
  previous_expiry TEXT,
  changed_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS device_sessions (
  session_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  device_label TEXT,
  expires_at_ms INTEGER NOT NULL,
  revoked_at TEXT
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS device_sessions_one_active
  ON device_sessions(account_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS device_sessions_lookup ON device_sessions(account_id,revoked_at);

-- Rekod di bawah TIDAK dipadam kerana AUTO_EXPIRED; kesetiaan data boleh diuji.
CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  plan TEXT NOT NULL CHECK (plan IN ('Basic','Rahmah','Premium')),
  category TEXT NOT NULL CHECK (category IN ('Langganan Baharu','Pembaharuan','Naik Taraf')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status TEXT NOT NULL CHECK (status IN ('Menunggu','Diluluskan','Ditolak')),
  receipt_storage_key TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS favorites (
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  PRIMARY KEY(account_id,section_id)
) STRICT;
CREATE TABLE IF NOT EXISTS reading_history (
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  read_at TEXT NOT NULL,
  PRIMARY KEY(account_id,section_id,read_at)
) STRICT;
CREATE TABLE IF NOT EXISTS highlights (
  highlight_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(account_id) ON DELETE RESTRICT,
  section_id TEXT NOT NULL,
  value_json TEXT NOT NULL
) STRICT;
