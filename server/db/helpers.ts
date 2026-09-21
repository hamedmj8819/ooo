import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type Database from 'better-sqlite3';

export function generateId(prefix = ''): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid.slice(0, 8)}` : uuid;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function getNextCounter(db: Database.Database, counterName: string, prefix = ''): string {
  const getStmt = db.prepare('SELECT current_value, prefix FROM counters WHERE name = ?');
  const updateStmt = db.prepare(`
    INSERT INTO counters (name, prefix, current_value, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(name) DO UPDATE SET
      current_value = current_value + 1,
      updated_at = excluded.updated_at
  `);

  const now = new Date().toISOString();
  updateStmt.run(counterName, prefix, now);
  const row = getStmt.get(counterName) as { current_value: number; prefix: string } | undefined;
  const val = row ? row.current_value : 1;
  const p = row?.prefix || prefix;
  return `${p}${String(val).padStart(3, '0')}`;
}

export function logAudit(
  db: Database.Database,
  params: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    entityType: string;
    entityId: string;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }
): void {
  const stmt = db.prepare(`
    INSERT INTO audit_log (id, user_id, user_name, user_role, action, entity_type, entity_id, old_value, new_value, details, ip_address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  stmt.run(
    crypto.randomUUID(),
    params.userId || null,
    params.userName || null,
    params.userRole || null,
    params.action,
    params.entityType,
    params.entityId,
    params.oldValue ? JSON.stringify(params.oldValue) : null,
    params.newValue ? JSON.stringify(params.newValue) : null,
    params.details ? JSON.stringify(params.details) : null,
    params.ipAddress || null,
    now,
    now
  );
}
