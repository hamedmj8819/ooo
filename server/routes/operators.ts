import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { CreateOperatorSchema, UpdateOperatorSchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { OperatorProfile } from '../../shared/types';

export const operatorsRouter = Router();

function mapOperatorRow(row: Record<string, unknown>): OperatorProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    personnelCode: String(row.personnel_code),
    specialty: String(row.specialty),
    assignedMachineId: row.assigned_machine_id ? String(row.assigned_machine_id) : undefined,
    currentWorkOrderId: row.current_work_order_id ? String(row.current_work_order_id) : undefined,
    currentStageName: row.current_stage_name ? String(row.current_stage_name) : undefined,
    shift: (row.shift || 'morning') as 'morning' | 'evening' | 'night',
    totalPartsProducedToday: Number(row.total_parts_produced_today || 0),
    status: (row.status || 'idle') as 'working' | 'idle' | 'on_break',
    image: row.image ? String(row.image) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/operators
operatorsRouter.get('/', requirePermission('operators:read'), (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive
    ? 'SELECT * FROM operators ORDER BY name ASC'
    : 'SELECT * FROM operators WHERE is_active = 1 ORDER BY name ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapOperatorRow));
});

// GET /api/v1/operators/:id
operatorsRouter.get('/:id', requirePermission('operators:read'), (req, res, next) => {
  const row = db.prepare('SELECT * FROM operators WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'اپراتور یافت نشد'));
  }
  res.json(mapOperatorRow(row));
});

// POST /api/v1/operators
operatorsRouter.post('/', requirePermission('operators:create'), validateBody(CreateOperatorSchema), (req, res, next) => {
  try {
    const data = req.body;
    const existing = db.prepare('SELECT id FROM operators WHERE personnel_code = ?').get(data.personnelCode);
    if (existing) {
      return next(new AppError(400, 'DUPLICATE_CODE', 'کد پرسنلی تکراری است'));
    }

    const id = generateId('OP');
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO operators (
        id, name, personnel_code, specialty, assigned_machine_id, shift,
        total_parts_produced_today, status, image, image_url, avatar_url, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insert.run(
      id,
      data.name,
      data.personnelCode,
      data.specialty,
      data.assignedMachineId || null,
      data.shift || 'morning',
      data.totalPartsProducedToday || 0,
      data.status || 'idle',
      data.image || null,
      data.imageUrl || null,
      data.avatarUrl || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM operators WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapOperatorRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'OPERATOR_CREATED',
      entityType: 'operators',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/operators/:id
operatorsRouter.put('/:id', requirePermission('operators:update'), validateBody(UpdateOperatorSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM operators WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'اپراتور یافت نشد'));
    }

    const data = req.body;
    const now = new Date().toISOString();

    const update = db.prepare(`
      UPDATE operators SET
        name = coalesce(?, name),
        personnel_code = coalesce(?, personnel_code),
        specialty = coalesce(?, specialty),
        assigned_machine_id = coalesce(?, assigned_machine_id),
        shift = coalesce(?, shift),
        total_parts_produced_today = coalesce(?, total_parts_produced_today),
        status = coalesce(?, status),
        image = CASE WHEN ? IS NOT NULL THEN ? ELSE image END,
        image_url = CASE WHEN ? IS NOT NULL THEN ? ELSE image_url END,
        avatar_url = CASE WHEN ? IS NOT NULL THEN ? ELSE avatar_url END,
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      data.name ?? null,
      data.personnelCode ?? null,
      data.specialty ?? null,
      data.assignedMachineId ?? null,
      data.shift ?? null,
      data.totalPartsProducedToday ?? null,
      data.status ?? null,
      data.image !== undefined ? data.image : null,
      data.image !== undefined ? data.image : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.avatarUrl !== undefined ? data.avatarUrl : null,
      data.avatarUrl !== undefined ? data.avatarUrl : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM operators WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapOperatorRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'OPERATOR_UPDATED',
      entityType: 'operators',
      entityId: id,
      oldValue: mapOperatorRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/operators/:id
operatorsRouter.delete('/:id', requirePermission('operators:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM operators WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'اپراتور یافت نشد'));
    }

    const now = new Date().toISOString();

    // Check if assigned in active order stages
    const activeStages = db.prepare(`
      SELECT COUNT(*) as count FROM order_stages os
      JOIN orders o ON os.order_id = o.id
      WHERE os.operator_id = ? AND o.status NOT IN ('delivered_to_warehouse', 'cancelled') AND os.status = 'in_progress'
    `).get(id) as { count: number };

    db.prepare('UPDATE operators SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'OPERATOR_SOFT_DELETED',
      entityType: 'operators',
      entityId: id,
      oldValue: mapOperatorRow(existing) as unknown as Record<string, unknown>,
      details: { activeStagesCount: activeStages.count },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      softDeleted: true,
      message: activeStages.count > 0
        ? `این اپراتور در ${activeStages.count} مرحله در حال اجرا تخصیص دارد و وضعیت وی به غیرفعال (Soft Delete) تغییر یافت`
        : 'اپراتور با موفقیت غیرفعال شد',
    });
  } catch (error) {
    next(error);
  }
});
