import { Router } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import { CreatePartSchema, UpdatePartSchema } from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import type { PartDefinition, ManufacturingStageDefinition } from '../../shared/types';

export const partsRouter = Router();

function getPartStages(partId: string): ManufacturingStageDefinition[] {
  const rows = db
    .prepare('SELECT * FROM part_stages WHERE part_id = ? ORDER BY stage_number ASC')
    .all(partId) as Record<string, unknown>[];

  return rows.map((r) => {
    let qcCheckpoints: string[];
    try {
      qcCheckpoints = JSON.parse(String(r.qc_checkpoints || '[]'));
    } catch {
      qcCheckpoints = [];
    }

    return {
      id: String(r.id),
      stageNumber: Number(r.stage_number),
      name: String(r.name),
      description: String(r.description || ''),
      defaultMachineCategoryId: String(r.default_machine_category_id || 'cnc_lathe'),
      estimatedMinutes: Number(r.estimated_minutes || 60),
      requiredDrawingType: String(r.required_drawing_type || '2D Drawing + STEP'),
      isOutsourced: Boolean(r.is_outsourced),
      qcCheckpoints,
      pdfDrawingFileName: r.pdf_drawing_file_name ? String(r.pdf_drawing_file_name) : undefined,
      stepFileName: r.step_file_name ? String(r.step_file_name) : undefined,
      updatedAt: String(r.updated_at),
    };
  });
}

function mapPartRow(row: Record<string, unknown>): PartDefinition {
  const stages = getPartStages(String(row.id));

  return {
    id: String(row.id),
    partNumber: String(row.part_number),
    name: String(row.name),
    nameEn: String(row.name_en || ''),
    machineModelId: String(row.machine_model_id),
    category: (row.category as 'manufactured' | 'imported' | 'bought_out' | 'casting') || 'manufactured',
    material: String(row.material || ''),
    rawWeightKg: Number(row.raw_weight_kg || 0),
    finishedWeightKg: Number(row.finished_weight_kg || 0),
    stockQty: Number(row.stock_qty || 0),
    minStockAlert: Number(row.min_stock_alert || 0),
    defaultDrawingName: row.default_drawing_name ? String(row.default_drawing_name) : undefined,
    defaultStepFileName: row.default_step_file_name ? String(row.default_step_file_name) : undefined,
    supplierName: row.supplier_name ? String(row.supplier_name) : undefined,
    notes: String(row.notes || ''),
    image: row.image ? String(row.image) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    defaultStages: stages,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/parts
partsRouter.get('/', requirePermission('parts:read'), (req, res) => {
  const modelId = req.query.modelId as string | undefined;
  const includeInactive = req.query.includeInactive === 'true';

  let query = includeInactive ? 'SELECT * FROM parts WHERE 1=1' : 'SELECT * FROM parts WHERE is_active = 1';
  const params: unknown[] = [];

  if (modelId) {
    query += ' AND machine_model_id = ?';
    params.push(modelId);
  }

  query += ' ORDER BY part_number ASC';

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  res.json(rows.map(mapPartRow));
});

// GET /api/v1/parts/:id
partsRouter.get('/:id', requirePermission('parts:read'), (req, res, next) => {
  const row = db.prepare('SELECT * FROM parts WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'قطعه یافت نشد'));
  }
  res.json(mapPartRow(row));
});

// POST /api/v1/parts
partsRouter.post('/', requirePermission('parts:create'), validateBody(CreatePartSchema), (req, res, next) => {
  try {
    const data = req.body;
    const existing = db.prepare('SELECT id FROM parts WHERE part_number = ?').get(data.partNumber);
    if (existing) {
      return next(new AppError(400, 'DUPLICATE_PART_NUMBER', 'شماره فنی قطعه تکراری است'));
    }

    const id = generateId('PART');
    const now = new Date().toISOString();

    const insertPartTx = db.transaction(() => {
      const insertPart = db.prepare(`
        INSERT INTO parts (
          id, part_number, name, name_en, machine_model_id, category, material,
          raw_weight_kg, finished_weight_kg, stock_qty, min_stock_alert,
          default_drawing_name, default_step_file_name, supplier_name, notes,
          image, image_url, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);

      insertPart.run(
        id,
        data.partNumber,
        data.name,
        data.nameEn || '',
        data.machineModelId,
        data.category || 'manufactured',
        data.material || '',
        data.rawWeightKg || 0,
        data.finishedWeightKg || 0,
        data.stockQty || 0,
        data.minStockAlert || 0,
        data.defaultDrawingName || null,
        data.defaultStepFileName || null,
        data.supplierName || null,
        data.notes || '',
        data.image || null,
        data.imageUrl || null,
        now,
        now
      );

      if (Array.isArray(data.defaultStages) && data.defaultStages.length > 0) {
        const insertStage = db.prepare(`
          INSERT INTO part_stages (
            id, part_id, stage_number, name, description,
            default_machine_category_id, estimated_minutes, required_drawing_type,
            is_outsourced, qc_checkpoints, pdf_drawing_file_name, step_file_name,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const stage of data.defaultStages) {
          const stageId = generateId('PSTG');
          insertStage.run(
            stageId,
            id,
            stage.stageNumber,
            stage.name,
            stage.description || '',
            stage.defaultMachineCategoryId || 'cnc_lathe',
            stage.estimatedMinutes || 60,
            stage.requiredDrawingType || '2D Drawing + STEP',
            stage.isOutsourced ? 1 : 0,
            JSON.stringify(stage.qcCheckpoints || []),
            stage.pdfDrawingFileName || null,
            stage.stepFileName || null,
            now,
            now
          );
        }
      }
    });

    insertPartTx();

    const created = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapPartRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'PART_CREATED',
      entityType: 'parts',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/parts/:id
partsRouter.put('/:id', requirePermission('parts:update'), validateBody(UpdatePartSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'قطعه یافت نشد'));
    }

    const data = req.body;
    const now = new Date().toISOString();

    const updatePartTx = db.transaction(() => {
      const updatePart = db.prepare(`
        UPDATE parts SET
          name = coalesce(?, name),
          name_en = coalesce(?, name_en),
          machine_model_id = coalesce(?, machine_model_id),
          category = coalesce(?, category),
          material = coalesce(?, material),
          raw_weight_kg = coalesce(?, raw_weight_kg),
          finished_weight_kg = coalesce(?, finished_weight_kg),
          stock_qty = coalesce(?, stock_qty),
          min_stock_alert = coalesce(?, min_stock_alert),
          default_drawing_name = CASE WHEN ? IS NOT NULL THEN ? ELSE default_drawing_name END,
          default_step_file_name = CASE WHEN ? IS NOT NULL THEN ? ELSE default_step_file_name END,
          supplier_name = CASE WHEN ? IS NOT NULL THEN ? ELSE supplier_name END,
          notes = coalesce(?, notes),
          image = CASE WHEN ? IS NOT NULL THEN ? ELSE image END,
          image_url = CASE WHEN ? IS NOT NULL THEN ? ELSE image_url END,
          updated_at = ?
        WHERE id = ?
      `);

      updatePart.run(
        data.name ?? null,
        data.nameEn ?? null,
        data.machineModelId ?? null,
        data.category ?? null,
        data.material ?? null,
        data.rawWeightKg ?? null,
        data.finishedWeightKg ?? null,
        data.stockQty ?? null,
        data.minStockAlert ?? null,
        data.defaultDrawingName !== undefined ? data.defaultDrawingName : null,
        data.defaultDrawingName !== undefined ? data.defaultDrawingName : null,
        data.defaultStepFileName !== undefined ? data.defaultStepFileName : null,
        data.defaultStepFileName !== undefined ? data.defaultStepFileName : null,
        data.supplierName !== undefined ? data.supplierName : null,
        data.supplierName !== undefined ? data.supplierName : null,
        data.notes ?? null,
        data.image !== undefined ? data.image : null,
        data.image !== undefined ? data.image : null,
        data.imageUrl !== undefined ? data.imageUrl : null,
        data.imageUrl !== undefined ? data.imageUrl : null,
        now,
        id
      );

      if (Array.isArray(data.defaultStages)) {
        db.prepare('DELETE FROM part_stages WHERE part_id = ?').run(id);

        const insertStage = db.prepare(`
          INSERT INTO part_stages (
            id, part_id, stage_number, name, description,
            default_machine_category_id, estimated_minutes, required_drawing_type,
            is_outsourced, qc_checkpoints, pdf_drawing_file_name, step_file_name,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const stage of data.defaultStages) {
          const stageId = generateId('PSTG');
          insertStage.run(
            stageId,
            id,
            stage.stageNumber,
            stage.name,
            stage.description || '',
            stage.defaultMachineCategoryId || 'cnc_lathe',
            stage.estimatedMinutes || 60,
            stage.requiredDrawingType || '2D Drawing + STEP',
            stage.isOutsourced ? 1 : 0,
            JSON.stringify(stage.qcCheckpoints || []),
            stage.pdfDrawingFileName || null,
            stage.stepFileName || null,
            now,
            now
          );
        }
      }
    });

    updatePartTx();

    const updated = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapPartRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'PART_UPDATED',
      entityType: 'parts',
      entityId: id,
      oldValue: mapPartRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/parts/:id/master-drawings
partsRouter.put('/:id/master-drawings', requirePermission('parts:drawings'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { defaultDrawingName, defaultStepFileName } = req.body;
    const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'قطعه یافت نشد'));
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE parts SET
        default_drawing_name = ?,
        default_step_file_name = ?,
        updated_at = ?
      WHERE id = ?
    `).run(defaultDrawingName || null, defaultStepFileName || null, now, id);

    const updated = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapPartRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'PART_MASTER_DRAWINGS_UPDATED',
      entityType: 'parts',
      entityId: id,
      oldValue: { defaultDrawingName: existing.default_drawing_name, defaultStepFileName: existing.default_step_file_name },
      newValue: { defaultDrawingName, defaultStepFileName },
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/parts/:id/stages/:stageNumber/drawings
partsRouter.put('/:id/stages/:stageNumber/drawings', requirePermission('parts:drawings'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { pdfDrawingFileName, stepFileName } = req.body;

    const existingPart = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existingPart) {
      return next(new AppError(404, 'NOT_FOUND', 'قطعه یافت نشد'));
    }

    const now = new Date().toISOString();
    const update = db.prepare(`
      UPDATE part_stages SET
        pdf_drawing_file_name = coalesce(?, pdf_drawing_file_name),
        step_file_name = coalesce(?, step_file_name),
        updated_at = ?
      WHERE part_id = ? AND stage_number = ?
    `);

    update.run(pdfDrawingFileName ?? null, stepFileName ?? null, now, id, stageNumber);

    const part = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapPartRow(part);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'PART_STAGE_DRAWINGS_UPDATED',
      entityType: 'parts',
      entityId: `${id}-stage-${stageNumber}`,
      details: { stageNumber, pdfDrawingFileName, stepFileName },
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/parts/:id
partsRouter.delete('/:id', requirePermission('parts:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM parts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'قطعه یافت نشد'));
    }

    const now = new Date().toISOString();

    // Check if used in active orders
    const activeOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE part_id = ? AND status NOT IN ('delivered_to_warehouse', 'cancelled')
    `).get(id) as { count: number };

    // Soft delete to guarantee referential integrity and historical record retention
    db.prepare('UPDATE parts SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'PART_SOFT_DELETED',
      entityType: 'parts',
      entityId: id,
      oldValue: mapPartRow(existing) as unknown as Record<string, unknown>,
      details: { activeOrdersCount: activeOrders.count },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      softDeleted: true,
      message: activeOrders.count > 0
        ? `این قطعه در ${activeOrders.count} سفارش فعال استفاده شده و وضعیت آن به غیرفعال (Soft Delete) تغییر یافت`
        : 'قطعه با موفقیت غیرفعال شد',
    });
  } catch (error) {
    next(error);
  }
});
