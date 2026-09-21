import { Router } from 'express';
import { db } from '../db/database';
import { seedDatabase } from '../db/seed';
import { logAudit } from '../db/helpers';
import { requirePermission } from '../middleware/auth';

export const backupRouter = Router();

// GET /api/v1/backup/export
backupRouter.get('/export', requirePermission('backup:manage'), (req, res) => {
  const exportData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: req.user?.username,
    users: db.prepare('SELECT id, username, full_name, role, department, personnel_code, phone, is_active, created_at, updated_at FROM users').all(),
    models: db.prepare('SELECT * FROM models').all(),
    parts: db.prepare('SELECT * FROM parts').all(),
    partStages: db.prepare('SELECT * FROM part_stages').all(),
    machines: db.prepare('SELECT * FROM machines').all(),
    operators: db.prepare('SELECT * FROM operators').all(),
    foundries: db.prepare('SELECT * FROM foundries').all(),
    orders: db.prepare('SELECT * FROM orders').all(),
    orderStages: db.prepare('SELECT * FROM order_stages').all(),
    quotes: db.prepare('SELECT * FROM quotes').all(),
    engineeringDocs: db.prepare('SELECT * FROM engineering_docs').all(),
    qcReports: db.prepare('SELECT * FROM qc_reports').all(),
    warehouseItems: db.prepare('SELECT * FROM warehouse_items').all(),
    stockMovements: db.prepare('SELECT * FROM stock_movements').all(),
    notifications: db.prepare('SELECT * FROM notifications').all(),
  };

  logAudit(db, {
    userId: req.user?.id,
    userName: req.user?.username,
    userRole: req.user?.role,
    action: 'BACKUP_EXPORTED',
    entityType: 'system',
    entityId: 'backup_export',
    ipAddress: req.ip,
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="mes_backup_${Date.now()}.json"`);
  res.json(exportData);
});

// POST /api/v1/backup/reset
backupRouter.post('/reset', requirePermission('backup:manage'), (req, res) => {
  const tx = db.transaction(() => {
    // Note: audit_log table is strictly APPEND-ONLY and NEVER deleted, adhering to compliance
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM stock_movements').run();
    db.prepare('DELETE FROM warehouse_items').run();
    db.prepare('DELETE FROM qc_reports').run();
    db.prepare('DELETE FROM engineering_docs').run();
    db.prepare('DELETE FROM quotes').run();
    db.prepare('DELETE FROM order_stages').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM foundries').run();
    db.prepare('DELETE FROM operators').run();
    db.prepare('DELETE FROM machines').run();
    db.prepare('DELETE FROM part_stages').run();
    db.prepare('DELETE FROM parts').run();
    db.prepare('DELETE FROM models').run();
    db.prepare('DELETE FROM notifications').run();
    db.prepare('DELETE FROM users').run();

    seedDatabase(db);
  });

  tx();

  logAudit(db, {
    userId: req.user?.id,
    userName: req.user?.username,
    userRole: req.user?.role,
    action: 'SYSTEM_RESET_TO_DEFAULTS',
    entityType: 'system',
    entityId: 'database_reset',
    ipAddress: req.ip,
  });

  res.json({ success: true, message: 'پایگاه‌داده با موفقیت بازنشانی شد و گزارش‌های امنیتی Audit Log حفظ گردید' });
});
