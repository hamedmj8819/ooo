import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db/database';
import { requireAuth, requirePermission } from '../middleware/auth';
import { cleanupOldNotifications } from '../services/notificationService';
import { sseService } from '../services/sseService';
import type { SystemNotification, UserRole } from '../../shared/types';

export const notificationsRouter = Router();

function mapNotificationRow(row: Record<string, unknown>): SystemNotification {
  let targetRoles: UserRole[];
  try {
    targetRoles = JSON.parse(String(row.target_roles || '[]'));
  } catch {
    targetRoles = [];
  }

  // isRead is derived from recipient read_at column if present, or is_read fallback
  const isRead = row.read_at !== undefined && row.read_at !== null ? true : Boolean(row.is_read);

  return {
    id: String(row.id),
    title: String(row.title),
    message: String(row.message),
    type: (row.type as SystemNotification['type']) || 'info',
    targetRoles,
    isRead,
    linkOrderId: row.link_order_id ? String(row.link_order_id) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// SSE Real-time Endpoint
notificationsRouter.get('/stream', requireAuth, (req, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const clientId = `sse-${userId}-${crypto.randomUUID().slice(0, 8)}`;

  sseService.addClient({
    id: clientId,
    userId,
    userRole,
    res,
    req,
  });
});

// GET /api/v1/notifications
// Accepts query params: page, limit, unreadOnly
notificationsRouter.get('/', requirePermission('notifications:read'), (req, res) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;

  // 1. Run 90-day retention cleanup
  cleanupOldNotifications(db);

  // 2. Ensure current user has recipient records for existing matching notifications
  db.prepare(`
    INSERT OR IGNORE INTO notification_recipients (id, notification_id, user_id, read_at, created_at)
    SELECT 
      'NR-' || n.id || '-' || ?1,
      n.id,
      ?1,
      CASE WHEN n.is_read = 1 THEN n.updated_at ELSE NULL END,
      n.created_at
    FROM notifications n
    WHERE n.target_roles LIKE '%"' || ?2 || '"%' 
       OR n.target_roles LIKE '%"*"%' 
       OR ?2 = 'super_admin'
  `).run(userId, userRole);

  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';

  let countSql = `
    SELECT COUNT(*) as count 
    FROM notification_recipients nr
    JOIN notifications n ON nr.notification_id = n.id
    WHERE nr.user_id = ?
  `;
  if (unreadOnly) {
    countSql += ' AND nr.read_at IS NULL';
  }

  const totalRow = db.prepare(countSql).get(userId) as { count: number };
  const total = totalRow ? totalRow.count : 0;

  let querySql = `
    SELECT n.*, nr.read_at
    FROM notification_recipients nr
    JOIN notifications n ON nr.notification_id = n.id
    WHERE nr.user_id = ?
  `;
  if (unreadOnly) {
    querySql += ' AND nr.read_at IS NULL';
  }
  querySql += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';

  const rows = db.prepare(querySql).all(userId, limit, offset) as Record<string, unknown>[];
  const items = rows.map(mapNotificationRow);

  const unreadCountRow = db.prepare(`
    SELECT COUNT(*) as count 
    FROM notification_recipients nr
    WHERE nr.user_id = ? AND nr.read_at IS NULL
  `).get(userId) as { count: number };

  const unreadCount = unreadCountRow ? unreadCountRow.count : 0;

  // Support both array response for backward compatibility and paginated structure
  if (req.query.paginated === 'true') {
    return res.json({
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  // Default response (array of notifications with isRead property)
  res.json(items);
});

// POST /api/v1/notifications/:id/read
notificationsRouter.post('/:id/read', requirePermission('notifications:mark_read'), (req, res) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE notification_recipients 
    SET read_at = ? 
    WHERE notification_id = ? AND user_id = ?
  `).run(now, id, userId);

  // Also update master table if all recipients have read
  db.prepare('UPDATE notifications SET is_read = 1, updated_at = ? WHERE id = ?').run(now, id);

  res.json({ success: true });
});

// POST /api/v1/notifications/read-all
notificationsRouter.post('/read-all', requirePermission('notifications:mark_read'), (req, res) => {
  const userId = req.user!.id;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE notification_recipients 
    SET read_at = ? 
    WHERE user_id = ? AND read_at IS NULL
  `).run(now, userId);

  res.json({ success: true });
});
