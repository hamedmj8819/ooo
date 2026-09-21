import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { CreateModelSchema, UpdateModelSchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { CompressorModel } from '../../shared/types';

export const modelsRouter = Router();

function mapModelRow(row: Record<string, unknown>): CompressorModel {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    nameEn: String(row.name_en || ''),
    type: row.type as 'screw' | 'lobe' | 'booster',
    capacityM3Min: Number(row.capacity_m3_min || 0),
    workingPressureBar: Number(row.working_pressure_bar || 0),
    motorPowerKw: Number(row.motor_power_kw || 0),
    coolingType: String(row.cooling_type || ''),
    description: String(row.description || ''),
    image: row.image ? String(row.image) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    partsCount: Number(row.parts_count || 0),
    inHouseRatio: Number(row.in_house_ratio || 80),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/models
modelsRouter.get('/', requirePermission('models:read'), (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive
    ? 'SELECT * FROM models ORDER BY code ASC'
    : 'SELECT * FROM models WHERE is_active = 1 ORDER BY code ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapModelRow));
});

// GET /api/v1/models/:id
modelsRouter.get('/:id', requirePermission('models:read'), (req, res, next) => {
  const row = db.prepare('SELECT * FROM models WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'مدل کمپرسور یافت نشد'));
  }
  res.json(mapModelRow(row));
});

// POST /api/v1/models
modelsRouter.post('/', requirePermission('models:create'), validateBody(CreateModelSchema), (req, res, next) => {
  try {
    const data = req.body;
    const existing = db.prepare('SELECT id FROM models WHERE code = ?').get(data.code);
    if (existing) {
      return next(new AppError(400, 'DUPLICATE_CODE', 'کد مدل تکراری است'));
    }

    const id = generateId('MOD');
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO models (id, code, name, name_en, type, capacity_m3_min, working_pressure_bar, motor_power_kw, cooling_type, description, image, image_url, parts_count, in_house_ratio, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insert.run(
      id,
      data.code,
      data.name,
      data.nameEn || '',
      data.type || 'screw',
      data.capacityM3Min || 0,
      data.workingPressureBar || 0,
      data.motorPowerKw || 0,
      data.coolingType || '',
      data.description || '',
      data.image || null,
      data.imageUrl || null,
      data.partsCount || 0,
      data.inHouseRatio || 80,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapModelRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MODEL_CREATED',
      entityType: 'models',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/models/:id
modelsRouter.put('/:id', requirePermission('models:update'), validateBody(UpdateModelSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'مدل یافت نشد'));
    }

    const data = req.body;
    const now = new Date().toISOString();

    const update = db.prepare(`
      UPDATE models SET
        name = COALESCE(?, name),
        name_en = COALESCE(?, name_en),
        type = COALESCE(?, type),
        capacity_m3_min = COALESCE(?, capacity_m3_min),
        working_pressure_bar = COALESCE(?, working_pressure_bar),
        motor_power_kw = COALESCE(?, motor_power_kw),
        cooling_type = COALESCE(?, cooling_type),
        description = COALESCE(?, description),
        image = CASE WHEN ? IS NOT NULL THEN ? ELSE image END,
        image_url = CASE WHEN ? IS NOT NULL THEN ? ELSE image_url END,
        parts_count = COALESCE(?, parts_count),
        in_house_ratio = COALESCE(?, in_house_ratio),
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      data.name ?? null,
      data.nameEn ?? null,
      data.type ?? null,
      data.capacityM3Min ?? null,
      data.workingPressureBar ?? null,
      data.motorPowerKw ?? null,
      data.coolingType ?? null,
      data.description ?? null,
      data.image !== undefined ? data.image : null,
      data.image !== undefined ? data.image : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.partsCount ?? null,
      data.inHouseRatio ?? null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapModelRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MODEL_UPDATED',
      entityType: 'models',
      entityId: id,
      oldValue: mapModelRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/models/:id
modelsRouter.delete('/:id', requirePermission('models:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM models WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'مدل یافت نشد'));
    }

    const now = new Date().toISOString();

    // Check active order usage
    const activeUsage = db
      .prepare("SELECT COUNT(*) as count FROM orders WHERE compressor_model_id = ? AND status NOT IN ('delivered_to_warehouse', 'cancelled')")
      .get(id) as { count: number };

    if (activeUsage.count > 0) {
      db.prepare('UPDATE models SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);
      logAudit(db, {
        userId: req.user?.id,
        userName: req.user?.username,
        userRole: req.user?.role,
        action: 'MODEL_SOFT_DELETED',
        entityType: 'models',
        entityId: id,
        details: { reason: 'ACTIVE_ORDER_USAGE', activeOrders: activeUsage.count },
        ipAddress: req.ip,
      });
      return res.json({
        success: true,
        softDeleted: true,
        message: `این مدل در ${activeUsage.count} سفارش فعال استفاده شده و وضعیت آن به غیرفعال (Soft Delete) تغییر یافت`,
      });
    }

    // If no active orders, soft delete to preserve historical integrity
    db.prepare('UPDATE models SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MODEL_DELETED',
      entityType: 'models',
      entityId: id,
      oldValue: mapModelRow(existing) as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'مدل با موفقیت غیرفعال شد' });
  } catch (error) {
    next(error);
  }
});
