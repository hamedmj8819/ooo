-- 002_security_and_rbac.sql
-- Security enhancements: Sessions, Password Management, RBAC, Soft Deletes, and Audit Tracing

-- 1. Create Sessions table for server-side stateful cookie auth
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 2. Add columns to users table
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN operator_id TEXT;

-- 3. Add columns to audit_log table
ALTER TABLE audit_log ADD COLUMN old_value TEXT;
ALTER TABLE audit_log ADD COLUMN new_value TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- 4. Add soft-delete flag (is_active) to entities
ALTER TABLE machines ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE parts ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE foundries ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE operators ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE models ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE warehouse_items ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- 5. Real user tracking foreign IDs across orders, quotes, stages, and QC
ALTER TABLE orders ADD COLUMN created_by_user_id TEXT;
ALTER TABLE quotes ADD COLUMN created_by_user_id TEXT;
ALTER TABLE quotes ADD COLUMN decided_by_user_id TEXT;
ALTER TABLE engineering_docs ADD COLUMN uploaded_by_user_id TEXT;
ALTER TABLE qc_reports ADD COLUMN inspector_user_id TEXT;
ALTER TABLE qc_reports ADD COLUMN approved_by_user_id TEXT;
ALTER TABLE order_stages ADD COLUMN assigned_by_user_id TEXT;
ALTER TABLE order_stages ADD COLUMN finished_by_operator_id TEXT;
