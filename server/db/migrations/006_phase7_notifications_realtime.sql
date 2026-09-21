-- Phase 7: Real-time and Targeted Notifications Migration

-- 1. Create notification_recipients table for per-user notification tracking
CREATE TABLE IF NOT EXISTS notification_recipients (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_recipients_user ON notification_recipients(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- 2. Populate recipients for existing notifications and active users
INSERT OR IGNORE INTO notification_recipients (id, notification_id, user_id, read_at, created_at)
SELECT 
  'NR-' || n.id || '-' || u.id,
  n.id,
  u.id,
  CASE WHEN n.is_read = 1 THEN n.updated_at ELSE NULL END,
  n.created_at
FROM notifications n
CROSS JOIN users u
WHERE u.is_active = 1
  AND (
    n.target_roles LIKE '%"' || u.role || '"%' 
    OR n.target_roles LIKE '%"*"%' 
    OR u.role = 'super_admin'
  );
