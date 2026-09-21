import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { CreateFoundrySchema, UpdateFoundrySchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { FoundryPartner } from '../../shared/types';

export const foundriesRouter = Router();

function mapFoundryRow(row: Record<string, unknown>): FoundryPartner {
  let capabilities: string[];
  try {
    capabilities = JSON.parse(String(row.capabilities || '[]'));
  } catch {
    capabilities = [];
  }

  return {
    id: String(row.id),
    name: String(row.name),
    manager: String(row.manager || ''),
    phone: String(row.phone || ''),
    city: String(row.city || ''),
    capabilities,
    qualityRating: Number(row.quality_rating || 5.0),
    activeOrdersCount: Number(row.active_orders_count || 0),
    image: row.image ? String(row.image) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/foundries
foundriesRouter.get('/', requirePermission('foundries:read'), (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive
    ? 'SELECT * FROM foundries ORDER BY name ASC'
    : 'SELECT * FROM foundries WHERE is_active = 1 ORDER BY name ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapFoundryRow));
});

// GET /api/v1/foundries/:id
foundriesRouter.get('/:id', requirePermission('foundries:read'), (req, res, next) => {
  const row = db.prepare('SELECT * FROM foundries WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'تامین‌کننده یافت نشد'));
  }
  res.json(mapFoundryRow(row));
});

// POST /api/v1/foundries
foundriesRouter.post('/', requirePermission('foundries:create'), validateBody(CreateFoundrySchema), (req, res, next) => {
  try {
    const data = req.body;
    const id = generateId('FND');
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO foundries (
        id, name, manager, phone, city, capabilities, quality_rating,
        active_orders_count, image, image_url, logo_url, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insert.run(
      id,
      data.name,
      data.manager || '',
      data.phone || '',
      data.city || '',
      JSON.stringify(data.capabilities || []),
      data.qualityRating || 5.0,
      0,
      data.image || null,
      data.imageUrl || null,
      data.logoUrl || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM foundries WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapFoundryRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'FOUNDRY_CREATED',
      entityType: 'foundries',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/foundries/:id
foundriesRouter.put('/:id', requirePermission('foundries:update'), validateBody(UpdateFoundrySchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM foundries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'تامین‌کننده یافت نشد'));
    }

    const data = req.body;
    const now = new Date().toISOString();

    const update = db.prepare(`
      UPDATE foundries SET
        name = coalesce(?, name),
        manager = coalesce(?, manager),
        phone = coalesce(?, phone),
        city = coalesce(?, city),
        capabilities = CASE WHEN ? IS NOT NULL THEN ? ELSE capabilities END,
        quality_rating = coalesce(?, quality_rating),
        image = CASE WHEN ? IS NOT NULL THEN ? ELSE image END,
        image_url = CASE WHEN ? IS NOT NULL THEN ? ELSE image_url END,
        logo_url = CASE WHEN ? IS NOT NULL THEN ? ELSE logo_url END,
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      data.name ?? null,
      data.manager ?? null,
      data.phone ?? null,
      data.city ?? null,
      data.capabilities ? JSON.stringify(data.capabilities) : null,
      data.capabilities ? JSON.stringify(data.capabilities) : null,
      data.qualityRating ?? null,
      data.image !== undefined ? data.image : null,
      data.image !== undefined ? data.image : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.logoUrl !== undefined ? data.logoUrl : null,
      data.logoUrl !== undefined ? data.logoUrl : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM foundries WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapFoundryRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'FOUNDRY_UPDATED',
      entityType: 'foundries',
      entityId: id,
      oldValue: mapFoundryRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/foundries/:id
foundriesRouter.delete('/:id', requirePermission('foundries:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM foundries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'تامین‌کننده یافت نشد'));
    }

    const now = new Date().toISOString();

    const activeUsage = db.prepare(`
      SELECT COUNT(*) as count FROM quotes q
      JOIN orders o ON q.order_id = o.id
      WHERE q.supplier_name = ? AND q.status = 'accepted' AND o.status NOT IN ('delivered_to_warehouse', 'cancelled')
    `).get(String(existing.name)) as { count: number };

    db.prepare('UPDATE foundries SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'FOUNDRY_SOFT_DELETED',
      entityType: 'foundries',
      entityId: id,
      oldValue: mapFoundryRow(existing) as unknown as Record<string, unknown>,
      details: { activeOrdersCount: activeUsage.count },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      softDeleted: true,
      message: activeUsage.count > 0
        ? `این تامین‌کننده در ${activeUsage.count} سفارش فعال طرف قرارداد است و وضعیت آن به غیرفعال (Soft Delete) تغییر یافت`
        : 'تامین‌کننده با موفقیت غیرفعال شد',
    });
  } catch (error) {
    next(error);
  }
});
