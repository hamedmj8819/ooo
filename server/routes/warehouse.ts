import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { CreateWarehouseItemSchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { WarehouseItem, StockMovement } from '../../shared/types';

export const warehouseRouter = Router();

function mapWarehouseRow(row: Record<string, unknown>): WarehouseItem {
  return {
    id: String(row.id),
    partNumber: String(row.part_number),
    name: String(row.name),
    type: (row.type as WarehouseItem['type']) || 'raw_material',
    quantity: Number(row.quantity || 0),
    unit: String(row.unit || 'عدد'),
    shelfLocation: String(row.shelf_location || 'A-01'),
    minThreshold: Number(row.min_threshold || 0),
    lastUpdated: String(row.last_updated || row.created_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/warehouse
warehouseRouter.get('/', requirePermission('warehouse:read'), (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive
    ? 'SELECT * FROM warehouse_items ORDER BY name ASC'
    : 'SELECT * FROM warehouse_items WHERE is_active = 1 ORDER BY name ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapWarehouseRow));
});

// GET /api/v1/warehouse/movements
warehouseRouter.get('/movements', requirePermission('warehouse:read'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 100').all() as Record<string, unknown>[];
  const movements: StockMovement[] = rows.map((r) => ({
    id: String(r.id),
    itemId: String(r.item_id),
    orderId: r.order_id ? String(r.order_id) : undefined,
    movementType: (r.movement_type as StockMovement['movementType']) || 'in',
    quantity: Number(r.quantity),
    referenceNumber: r.reference_number ? String(r.reference_number) : undefined,
    notes: r.notes ? String(r.notes) : undefined,
    performedBy: String(r.performed_by),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
  res.json(movements);
});

// POST /api/v1/warehouse
warehouseRouter.post('/', requirePermission('warehouse:adjust'), validateBody(CreateWarehouseItemSchema), (req, res, next) => {
  try {
    const data = req.body;
    const id = generateId('WH');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO warehouse_items (
        id, part_number, name, type, quantity, unit,
        shelf_location, min_threshold, last_updated, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id,
      data.partNumber,
      data.name,
      data.type,
      data.quantity || 0,
      data.unit || 'عدد',
      data.shelfLocation || 'A-01',
      data.minThreshold || 0,
      now,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM warehouse_items WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapWarehouseRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'WAREHOUSE_ITEM_CREATED',
      entityType: 'warehouse_items',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/warehouse/:id/adjust
warehouseRouter.post('/:id/adjust', requirePermission('warehouse:adjust'), (req, res, next) => {
  try {
    const { id } = req.params;
    const { delta, reason, performedBy } = req.body;
    const existing = db.prepare('SELECT * FROM warehouse_items WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'کالای انبار یافت نشد'));
    }

    const currentQty = Number(existing.quantity || 0);
    const newQty = Math.max(0, currentQty + Number(delta || 0));
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE warehouse_items SET
          quantity = ?,
          last_updated = ?,
          updated_at = ?
        WHERE id = ?
      `).run(newQty, now, now, id);

      db.prepare(`
        INSERT INTO stock_movements (
          id, item_id, movement_type, quantity, notes, performed_by, created_at, updated_at
        ) VALUES (?, ?, 'adjustment', ?, ?, ?, ?, ?)
      `).run(
        generateId('MOV'),
        id,
        delta,
        reason || 'تعدیل دستی موجودی توسط انباردار',
        req.user?.fullName || performedBy || 'انباردار',
        now,
        now
      );
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'WAREHOUSE_STOCK_ADJUSTED',
      entityType: 'warehouse_items',
      entityId: String(id),
      details: { previousQty: currentQty, newQty, delta, reason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM warehouse_items WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapWarehouseRow(updated));
  } catch (error) {
    next(error);
  }
});
