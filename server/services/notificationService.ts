import type Database from 'better-sqlite3';
import crypto from 'crypto';
import type { UserRole } from '../../shared/types';
import { sseService } from './sseService';

export interface CreateNotificationInput {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'alert' | 'error' | 'success';
  targetRoles: (UserRole | '*')[];
  targetUserIds?: string[];
  linkOrderId?: string;
  stageNumber?: number;
}

export function createNotification(
  db: Database.Database,
  input: CreateNotificationInput
) {
  const now = new Date().toISOString();
  const notifId = 'NOTIF-' + crypto.randomUUID();
  const type = input.type || 'info';
  const targetRolesJson = JSON.stringify(input.targetRoles);

  // 1. Insert master notification
  db.prepare(`
    INSERT INTO notifications (id, title, message, type, target_roles, is_read, link_order_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(
    notifId,
    input.title,
    input.message,
    type,
    targetRolesJson,
    input.linkOrderId || null,
    now,
    now
  );

  // 2. Resolve recipient user IDs
  const activeUsers = db.prepare('SELECT id, role FROM users WHERE is_active = 1').all() as { id: string; role: string }[];

  const recipientUserIdsSet = new Set<string>();

  if (input.targetUserIds && input.targetUserIds.length > 0) {
    input.targetUserIds.forEach((uid) => recipientUserIdsSet.add(uid));
  }

  const targetRolesSet = new Set(input.targetRoles);

  for (const u of activeUsers) {
    if (
      targetRolesSet.has('*') ||
      targetRolesSet.has(u.role as UserRole) ||
      u.role === 'super_admin'
    ) {
      recipientUserIdsSet.add(u.id);
    }
  }

  const recipientUserIds = Array.from(recipientUserIdsSet);

  // 3. Insert into notification_recipients
  const insertRecipientStmt = db.prepare(`
    INSERT OR IGNORE INTO notification_recipients (id, notification_id, user_id, read_at, created_at)
    VALUES (?, ?, ?, NULL, ?)
  `);

  for (const userId of recipientUserIds) {
    const recipientId = `NR-${notifId.slice(-8)}-${userId.slice(-6)}-${crypto.randomBytes(3).toString('hex')}`;
    insertRecipientStmt.run(recipientId, notifId, userId, now);
  }

  // 4. Return notification object
  const notificationObj = {
    id: notifId,
    title: input.title,
    message: input.message,
    type,
    targetRoles: input.targetRoles,
    isRead: false,
    linkOrderId: input.linkOrderId,
    createdAt: now,
    updatedAt: now,
  };

  // 5. Broadcast via SSE to recipient users
  sseService.broadcastNotification(notificationObj, recipientUserIds);

  return notificationObj;
}

export function cleanupOldNotifications(db: Database.Database) {
  try {
    // Delete notifications older than 90 days (CASCADE will delete recipients)
    db.prepare(`
      DELETE FROM notifications 
      WHERE datetime(created_at) < datetime('now', '-90 days')
    `).run();
  } catch (err) {
    console.error('Error cleaning up old notifications:', err);
  }
}
