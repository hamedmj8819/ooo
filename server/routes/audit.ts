import { Router } from 'express';
import { db } from '../db/database';
import { requirePermission } from '../middleware/auth';

export const auditRouter = Router();

// GET /api/v1/audit-logs (Strictly accessible by super_admin and ceo)
auditRouter.get('/', requirePermission('audit:read'), (req, res) => {
  const {
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    limit = '100',
    offset = '0',
  } = req.query as Record<string, string | undefined>;

  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params: unknown[] = [];

  if (userId) {
    query += ' AND (user_id = ? OR user_name LIKE ?)';
    params.push(userId, `%${userId}%`);
  }

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (entityType) {
    query += ' AND entity_type = ?';
    params.push(entityType);
  }

  if (entityId) {
    query += ' AND entity_id = ?';
    params.push(entityId);
  }

  if (startDate) {
    query += ' AND timestamp >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(limit) || 100, Number(offset) || 0);

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];

  const totalCountQuery = 'SELECT COUNT(*) as total FROM audit_log';
  const total = (db.prepare(totalCountQuery).get() as { total: number })?.total || 0;

  const logs = rows.map((r) => {
    let details: Record<string, unknown> | null = null;
    let oldValue: Record<string, unknown> | null = null;
    let newValue: Record<string, unknown> | null = null;

    try {
      if (r.details) details = JSON.parse(String(r.details));
    } catch {
      details = null;
    }

    try {
      if (r.old_value) oldValue = JSON.parse(String(r.old_value));
    } catch {
      oldValue = null;
    }

    try {
      if (r.new_value) newValue = JSON.parse(String(r.new_value));
    } catch {
      newValue = null;
    }

    return {
      id: Number(r.id),
      timestamp: String(r.timestamp),
      userId: r.user_id ? String(r.user_id) : undefined,
      userName: r.user_name ? String(r.user_name) : undefined,
      userRole: r.user_role ? String(r.user_role) : undefined,
      action: String(r.action),
      entityType: String(r.entity_type),
      entityId: r.entity_id ? String(r.entity_id) : undefined,
      oldValue,
      newValue,
      details,
      ipAddress: r.ip_address ? String(r.ip_address) : undefined,
    };
  });

  res.json({
    logs,
    total,
    limit: Number(limit),
    offset: Number(offset),
  });
});
