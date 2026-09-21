import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import { validateBody } from '../middleware/validate';
import {
  CreateMachineSchema,
  UpdateMachineSchema,
  ReportBreakdownSchema,
  ResolveBreakdownSchema,
  CreateMaintenancePlanSchema,
  UpdateMaintenancePlanSchema,
} from '../../shared/schemas';
import { AppError } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/auth';
import { createNotification } from '../services/notificationService';
import { sseService } from '../services/sseService';
import type {
  MachineTool,
  MachineCategory,
  MachineStatus,
  DowntimeEvent,
  MaintenancePlan,
} from '../../shared/types';

export const machinesRouter = Router();

export function mapMachineRow(row: Record<string, unknown>): MachineTool {
  const machineId = String(row.id);

  // 1. Calculate real operational metrics from downtime_events
  const downtime30d = db
    .prepare(`
      SELECT 
        COALESCE(SUM(duration_minutes), 0) as total_duration,
        COUNT(*) as count_events
      FROM downtime_events 
      WHERE machine_id = ? 
        AND start_time >= datetime('now', '-30 days')
    `)
    .get(machineId) as { total_duration: number; count_events: number } | undefined;

  const totalDowntimeMinutes30Days = Number(downtime30d?.total_duration || 0);
  const downtimeCount30Days = Number(downtime30d?.count_events || 0);

  // Calculate MTTR (Mean Time To Repair in minutes)
  const mttrRow = db
    .prepare(`
      SELECT AVG(duration_minutes) as avg_duration 
      FROM downtime_events 
      WHERE machine_id = ? AND duration_minutes IS NOT NULL
    `)
    .get(machineId) as { avg_duration: number | null } | undefined;

  const mttrMinutes = mttrRow?.avg_duration !== null && mttrRow?.avg_duration !== undefined
    ? Math.round(Number(mttrRow.avg_duration))
    : undefined;

  // Calculate MTBF (Mean Time Between Failures in operating hours)
  // Assuming 30 days * 16 hours/day operating time minus downtime
  const totalOperatingHours30d = Math.max(0, (30 * 16 * 60 - totalDowntimeMinutes30Days) / 60);
  const mtbfHours = downtimeCount30Days > 0
    ? Math.round((totalOperatingHours30d / downtimeCount30Days) * 10) / 10
    : 720; // Default high availability if zero failures in 30 days

  // 2. Next Maintenance Date
  const nextPmRow = db
    .prepare(`
      SELECT scheduled_date 
      FROM maintenance_plans 
      WHERE machine_id = ? AND status = 'scheduled'
      ORDER BY scheduled_date ASC 
      LIMIT 1
    `)
    .get(machineId) as { scheduled_date: string } | undefined;

  // 3. Active Downtime ID (if currently broken)
  const activeDowntimeRow = db
    .prepare(`
      SELECT id 
      FROM downtime_events 
      WHERE machine_id = ? AND end_time IS NULL 
      ORDER BY start_time DESC 
      LIMIT 1
    `)
    .get(machineId) as { id: string } | undefined;

  // Availability percentage: (Operating hours / Total planned hours) * 100
  const availabilityPercent = Math.min(100, Math.max(0, Math.round(((480 * 60 - totalDowntimeMinutes30Days) / (480 * 60)) * 100)));

  return {
    id: machineId,
    name: String(row.name),
    code: String(row.code),
    type: (row.type || 'internal') as 'internal' | 'outsourced',
    category: row.category as MachineCategory,
    status: row.status as MachineStatus,
    currentWorkOrderId: row.current_work_order_id ? String(row.current_work_order_id) : undefined,
    currentPartName: row.current_part_name ? String(row.current_part_name) : undefined,
    currentStageName: row.current_stage_name ? String(row.current_stage_name) : undefined,
    currentOperatorId: row.current_operator_id ? String(row.current_operator_id) : undefined,
    currentOperatorName: row.current_operator_name ? String(row.current_operator_name) : undefined,
    breakdownReason: row.breakdown_reason ? String(row.breakdown_reason) : undefined,
    breakdownReportedAt: row.breakdown_reported_at ? String(row.breakdown_reported_at) : undefined,
    location: String(row.location || 'سالن ماشین‌کاری'),
    specifications: String(row.specifications || ''),
    lastMaintenanceDate: String(row.last_maintenance_date || row.created_at),
    healthPercent: availabilityPercent,
    totalDowntimeMinutes30Days,
    downtimeCount30Days,
    mttrMinutes,
    mtbfHours,
    nextMaintenanceDate: nextPmRow?.scheduled_date,
    activeDowntimeId: activeDowntimeRow?.id,
    image: row.image ? String(row.image) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapDowntimeRow(row: Record<string, unknown>): DowntimeEvent {
  return {
    id: String(row.id),
    machineId: String(row.machine_id),
    machineName: row.machine_name ? String(row.machine_name) : undefined,
    machineCode: row.machine_code ? String(row.machine_code) : undefined,
    orderId: row.order_id ? String(row.order_id) : undefined,
    stageNumber: row.stage_number !== null && row.stage_number !== undefined ? Number(row.stage_number) : undefined,
    startTime: String(row.start_time),
    endTime: row.end_time ? String(row.end_time) : undefined,
    durationMinutes: row.duration_minutes !== null && row.duration_minutes !== undefined ? Number(row.duration_minutes) : undefined,
    reason: String(row.reason),
    category: row.category as DowntimeEvent['category'],
    reportedBy: String(row.reported_by),
    reportedById: row.reported_by_id ? String(row.reported_by_id) : undefined,
    resolvedBy: row.resolved_by ? String(row.resolved_by) : undefined,
    resolvedById: row.resolved_by_id ? String(row.resolved_by_id) : undefined,
    repairNotes: row.repair_notes ? String(row.repair_notes) : undefined,
    sparePartsUsed: row.spare_parts_used ? String(row.spare_parts_used) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapMaintenanceRow(row: Record<string, unknown>): MaintenancePlan {
  let checklist: string[] = [];
  if (row.checklist) {
    try {
      checklist = JSON.parse(String(row.checklist));
    } catch {
      checklist = [];
    }
  }

  return {
    id: String(row.id),
    machineId: String(row.machine_id),
    machineName: row.machine_name ? String(row.machine_name) : undefined,
    machineCode: row.machine_code ? String(row.machine_code) : undefined,
    title: String(row.title),
    type: row.type as MaintenancePlan['type'],
    scheduledDate: String(row.scheduled_date),
    completedDate: row.completed_date ? String(row.completed_date) : undefined,
    status: row.status as MaintenancePlan['status'],
    checklist,
    technicianName: row.technician_name ? String(row.technician_name) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// GET /api/v1/machines
machinesRouter.get('/', requirePermission('machines:read'), (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const query = includeInactive
    ? 'SELECT * FROM machines ORDER BY code ASC'
    : 'SELECT * FROM machines WHERE is_active = 1 ORDER BY code ASC';
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapMachineRow));
});

// GET /api/v1/machines/all-maintenance-plans
machinesRouter.get('/all-maintenance-plans', requirePermission('machines:read'), (req, res) => {
  const query = `
    SELECT mp.*, m.name as machine_name, m.code as machine_code 
    FROM maintenance_plans mp
    JOIN machines m ON mp.machine_id = m.id
    ORDER BY mp.scheduled_date ASC
  `;
  const rows = db.prepare(query).all() as Record<string, unknown>[];
  res.json(rows.map(mapMaintenanceRow));
});

// GET /api/v1/machines/:id
machinesRouter.get('/:id', requirePermission('machines:read'), (req, res, next) => {
  const row = db.prepare('SELECT * FROM machines WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
  }
  res.json(mapMachineRow(row));
});

// POST /api/v1/machines
machinesRouter.post('/', requirePermission('machines:create'), validateBody(CreateMachineSchema), (req, res, next) => {
  try {
    const data = req.body;
    const existing = db.prepare('SELECT id FROM machines WHERE code = ?').get(data.code);
    if (existing) {
      return next(new AppError(400, 'DUPLICATE_CODE', 'کد دستگاه تکراری است'));
    }

    const id = generateId('MC');
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO machines (
        id, name, code, type, category, status, location, specifications,
        last_maintenance_date, health_percent, image, image_url, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insert.run(
      id,
      data.name,
      data.code,
      data.type || 'internal',
      data.category,
      data.status || 'idle',
      data.location || 'سالن ماشین‌کاری',
      data.specifications || '',
      data.lastMaintenanceDate || now,
      data.healthPercent || 100,
      data.image || null,
      data.imageUrl || null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapMachineRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MACHINE_CREATED',
      entityType: 'machines',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/machines/:id
machinesRouter.put('/:id', requirePermission('machines:update'), validateBody(UpdateMachineSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
    }

    const data = req.body;
    const now = new Date().toISOString();

    if (data.code && data.code !== existing.code) {
      const dup = db.prepare('SELECT id FROM machines WHERE code = ? AND id != ?').get(data.code, id);
      if (dup) {
        return next(new AppError(400, 'DUPLICATE_CODE', 'کد دستگاه تکراری است'));
      }
    }

    const update = db.prepare(`
      UPDATE machines SET
        name = coalesce(?, name),
        code = coalesce(?, code),
        type = coalesce(?, type),
        category = coalesce(?, category),
        status = coalesce(?, status),
        location = coalesce(?, location),
        specifications = coalesce(?, specifications),
        last_maintenance_date = coalesce(?, last_maintenance_date),
        health_percent = coalesce(?, health_percent),
        image = CASE WHEN ? IS NOT NULL THEN ? ELSE image END,
        image_url = CASE WHEN ? IS NOT NULL THEN ? ELSE image_url END,
        updated_at = ?
      WHERE id = ?
    `);

    update.run(
      data.name ?? null,
      data.code ?? null,
      data.type ?? null,
      data.category ?? null,
      data.status ?? null,
      data.location ?? null,
      data.specifications ?? null,
      data.lastMaintenanceDate ?? null,
      data.healthPercent ?? null,
      data.image !== undefined ? data.image : null,
      data.image !== undefined ? data.image : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      data.imageUrl !== undefined ? data.imageUrl : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapMachineRow(updated);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MACHINE_UPDATED',
      entityType: 'machines',
      entityId: id,
      oldValue: mapMachineRow(existing) as unknown as Record<string, unknown>,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/machines/:id/breakdown and /report-breakdown
const handleReportBreakdown = (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { reason, category, reportedBy } = req.body;
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
    }

    // 1. Check if machine is already broken
    if (existing.status === 'breakdown') {
      return next(new AppError(409, 'MACHINE_ALREADY_BROKEN', 'دستگاه در حال حاضر در وضعیت خرابی قرار دارد و گزارش مجدد امکان‌پذیر نیست'));
    }

    const now = new Date().toISOString();
    const downtimeId = generateId('DT');
    const reporterName = req.user?.fullName || reportedBy || 'اپراتور / سرپرست تولید';
    const reporterId = req.user?.id || null;

    let affectedOrderId: string | null = null;
    let affectedStageNum: number | null = null;

    const tx = db.transaction(() => {
      // 2. Find any active stage on this machine and pause it
      const activeStage = db
        .prepare(`
          SELECT * FROM order_stages 
          WHERE machine_tool_id = ? AND status IN ('in_progress', 'assigned')
          LIMIT 1
        `)
        .get(id) as Record<string, unknown> | undefined;

      if (activeStage) {
        affectedOrderId = String(activeStage.order_id);
        affectedStageNum = Number(activeStage.stage_number);
        const pauseReasonText = `خرابی دستگاه ${existing.name} (${existing.code}): ${reason}`;

        db.prepare(`
          UPDATE order_stages SET
            status = 'paused',
            paused_at = ?,
            pause_reason = ?,
            updated_at = ?
          WHERE order_id = ? AND stage_number = ?
        `).run(now, pauseReasonText, now, affectedOrderId, affectedStageNum);

        // Record stage event
        const eventId = generateId('SE');
        db.prepare(`
          INSERT INTO stage_events (
            id, order_id, stage_number, event_type, timestamp,
            machine_id, machine_name, operator_id, operator_name, reason, details, created_at
          ) VALUES (?, ?, ?, 'paused', ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          eventId,
          affectedOrderId,
          affectedStageNum,
          now,
          id,
          existing.name,
          activeStage.operator_id ? String(activeStage.operator_id) : null,
          activeStage.operator_name ? String(activeStage.operator_name) : null,
          pauseReasonText,
          JSON.stringify({ breakdownCategory: category, downtimeId }),
          now
        );
      }

      // 3. Record downtime event
      db.prepare(`
        INSERT INTO downtime_events (
          id, machine_id, order_id, stage_number, start_time,
          reason, category, reported_by, reported_by_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        downtimeId,
        id,
        affectedOrderId,
        affectedStageNum,
        now,
        reason,
        category || 'mechanical',
        reporterName,
        reporterId,
        now,
        now
      );

      // 4. Update machine to breakdown status
      db.prepare(`
        UPDATE machines SET
          status = 'breakdown',
          breakdown_reason = ?,
          breakdown_reported_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(reason, now, now, id);

      // 5. Release operator to idle if they were working on this machine
      if (existing.current_operator_id) {
        db.prepare(`
          UPDATE operators SET
            status = 'idle',
            updated_at = ?
          WHERE id = ?
        `).run(now, existing.current_operator_id);
      }

      // 6. Create in-transaction notification
      createNotification(db, {
        title: `اعلام خرابی دستگاه ${existing.name}`,
        message: `دستگاه ${existing.code} به علت "${reason}" متوقف گردید.`,
        type: 'alert',
        targetRoles: ['production', 'planning'],
        linkOrderId: activeStage ? String(activeStage.order_id) : undefined,
      });
    });

    tx();

    sseService.broadcastMachineUpdate(id, 'breakdown');

    const updatedMachine = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapMachineRow(updatedMachine);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MACHINE_BREAKDOWN_REPORTED',
      entityType: 'machines',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json(mapped);
  } catch (error) {
    next(error);
  }
};

machinesRouter.post('/:id/breakdown', requirePermission('machines:breakdown'), validateBody(ReportBreakdownSchema), handleReportBreakdown);
machinesRouter.post('/:id/report-breakdown', requirePermission('machines:breakdown'), validateBody(ReportBreakdownSchema), handleReportBreakdown);

// POST /api/v1/machines/:id/resolve-breakdown
machinesRouter.post('/:id/resolve-breakdown', requirePermission('machines:breakdown'), validateBody(ResolveBreakdownSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { repairNotes, resolvedBy, sparePartsUsed } = req.body;
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
    }

    if (existing.status !== 'breakdown') {
      return next(new AppError(400, 'MACHINE_NOT_BROKEN', 'دستگاه در وضعیت خرابی قرار ندارد'));
    }

    const now = new Date().toISOString();
    const resolverName = req.user?.fullName || resolvedBy || 'واحد نگهداری و تعمیرات';
    const resolverId = req.user?.id || null;

    const tx = db.transaction(() => {
      // 1. Find active downtime event
      const activeDowntime = db
        .prepare(`
          SELECT * FROM downtime_events 
          WHERE machine_id = ? AND end_time IS NULL 
          ORDER BY start_time DESC 
          LIMIT 1
        `)
        .get(id) as Record<string, unknown> | undefined;

      let durationMinutes = 0;
      if (activeDowntime) {
        const startTimeMs = new Date(String(activeDowntime.start_time)).getTime();
        const endTimeMs = new Date(now).getTime();
        durationMinutes = Math.max(1, Math.round((endTimeMs - startTimeMs) / 60000));

        db.prepare(`
          UPDATE downtime_events SET
            end_time = ?,
            duration_minutes = ?,
            resolved_by = ?,
            resolved_by_id = ?,
            repair_notes = ?,
            spare_parts_used = ?,
            updated_at = ?
          WHERE id = ?
        `).run(now, durationMinutes, resolverName, resolverId, repairNotes, sparePartsUsed || null, now, activeDowntime.id);
      }

      // 2. Reset machine to idle and clear current assignments
      db.prepare(`
        UPDATE machines SET
          status = 'idle',
          breakdown_reason = NULL,
          breakdown_reported_at = NULL,
          current_work_order_id = NULL,
          current_part_name = NULL,
          current_stage_name = NULL,
          current_operator_id = NULL,
          current_operator_name = NULL,
          last_maintenance_date = ?,
          updated_at = ?
        WHERE id = ?
      `).run(now, now, id);

      // 3. Notification inside transaction
      createNotification(db, {
        title: `رفع خرابی و راه‌اندازی مجدد دستگاه ${existing.name}`,
        message: `دستگاه ${existing.code} پس از ${durationMinutes} دقیقه تعمیرات با موفقیت راه‌اندازی و آزاد (idle) گردید.`,
        type: 'success',
        targetRoles: ['production', 'planning'],
      });
    });

    tx();

    sseService.broadcastMachineUpdate(id, 'idle');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MACHINE_REPAIR_RESOLVED',
      entityType: 'machines',
      entityId: id,
      details: { repairNotes, sparePartsUsed, resolverName },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapMachineRow(updated));
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/machines/:id/downtimes
machinesRouter.get('/:id/downtimes', requirePermission('machines:read'), (req, res) => {
  const id = String(req.params.id);
  const rows = db
    .prepare(`
      SELECT de.*, m.name as machine_name, m.code as machine_code
      FROM downtime_events de
      JOIN machines m ON de.machine_id = m.id
      WHERE de.machine_id = ?
      ORDER BY de.start_time DESC
    `)
    .all(id) as Record<string, unknown>[];

  res.json(rows.map(mapDowntimeRow));
});

// GET /api/v1/machines/:id/maintenance-plans
machinesRouter.get('/:id/maintenance-plans', requirePermission('machines:read'), (req, res) => {
  const id = String(req.params.id);
  const rows = db
    .prepare(`
      SELECT mp.*, m.name as machine_name, m.code as machine_code
      FROM maintenance_plans mp
      JOIN machines m ON mp.machine_id = m.id
      WHERE mp.machine_id = ?
      ORDER BY mp.scheduled_date ASC
    `)
    .all(id) as Record<string, unknown>[];

  res.json(rows.map(mapMaintenanceRow));
});

// POST /api/v1/machines/:id/maintenance-plans
machinesRouter.post('/:id/maintenance-plans', requirePermission('machines:update'), validateBody(CreateMaintenancePlanSchema), (req, res, next) => {
  try {
    const machineId = String(req.params.id);
    const data = req.body;
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId);
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
    }

    const planId = generateId('PM');
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO maintenance_plans (
        id, machine_id, title, type, scheduled_date, status,
        checklist, technician_name, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?, ?, ?, ?)
    `).run(
      planId,
      machineId,
      data.title,
      data.type || 'monthly',
      data.scheduledDate,
      JSON.stringify(data.checklist || []),
      data.technicianName || null,
      data.notes || null,
      now,
      now
    );

    const created = db.prepare(`
      SELECT mp.*, m.name as machine_name, m.code as machine_code
      FROM maintenance_plans mp
      JOIN machines m ON mp.machine_id = m.id
      WHERE mp.id = ?
    `).get(planId) as Record<string, unknown>;

    res.status(201).json(mapMaintenanceRow(created));
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/machines/:id/maintenance-plans/:planId
machinesRouter.put('/:id/maintenance-plans/:planId', requirePermission('machines:update'), validateBody(UpdateMaintenancePlanSchema), (req, res, next) => {
  try {
    const planId = String(req.params.planId);
    const data = req.body;
    const existing = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(planId) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'برنامه نگهداری یافت نشد'));
    }

    const now = new Date().toISOString();
    const isCompleting = data.status === 'completed' && existing.status !== 'completed';

    db.prepare(`
      UPDATE maintenance_plans SET
        title = coalesce(?, title),
        type = coalesce(?, type),
        scheduled_date = coalesce(?, scheduled_date),
        completed_date = CASE WHEN ? = 'completed' THEN ? ELSE completed_date END,
        status = coalesce(?, status),
        checklist = CASE WHEN ? IS NOT NULL THEN ? ELSE checklist END,
        technician_name = coalesce(?, technician_name),
        notes = coalesce(?, notes),
        updated_at = ?
      WHERE id = ?
    `).run(
      data.title ?? null,
      data.type ?? null,
      data.scheduledDate ?? null,
      data.status ?? null,
      now,
      data.status ?? null,
      data.checklist ? JSON.stringify(data.checklist) : null,
      data.checklist ? JSON.stringify(data.checklist) : null,
      data.technicianName ?? null,
      data.notes ?? null,
      now,
      planId
    );

    if (isCompleting) {
      db.prepare('UPDATE machines SET last_maintenance_date = ?, updated_at = ? WHERE id = ?').run(now, now, existing.machine_id);
    }

    const updated = db.prepare(`
      SELECT mp.*, m.name as machine_name, m.code as machine_code
      FROM maintenance_plans mp
      JOIN machines m ON mp.machine_id = m.id
      WHERE mp.id = ?
    `).get(planId) as Record<string, unknown>;

    res.json(mapMaintenanceRow(updated));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/machines/:id/maintenance-plans/:planId
machinesRouter.delete('/:id/maintenance-plans/:planId', requirePermission('machines:update'), (req, res, next) => {
  try {
    const planId = String(req.params.planId);
    const existing = db.prepare('SELECT id FROM maintenance_plans WHERE id = ?').get(planId);
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'برنامه نگهداری یافت نشد'));
    }

    db.prepare('DELETE FROM maintenance_plans WHERE id = ?').run(planId);
    res.json({ success: true, message: 'برنامه نگهداری با موفقیت حذف شد' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/machines/:id
machinesRouter.delete('/:id', requirePermission('machines:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM machines WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'دستگاه یافت نشد'));
    }

    const now = new Date().toISOString();

    // Check active stage usage
    const activeUsage = db.prepare(`
      SELECT COUNT(*) as count FROM order_stages os
      JOIN orders o ON os.order_id = o.id
      WHERE os.machine_tool_id = ? AND o.status NOT IN ('completed', 'semi_finished_stored', 'cancelled') AND os.status NOT IN ('completed')
    `).get(id) as { count: number };

    db.prepare('UPDATE machines SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MACHINE_SOFT_DELETED',
      entityType: 'machines',
      entityId: id,
      oldValue: mapMachineRow(existing) as unknown as Record<string, unknown>,
      details: { activeStages: activeUsage.count },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      softDeleted: true,
      message: activeUsage.count > 0
        ? `این دستگاه در ${activeUsage.count} مرحله از سفارشات فعال در حال استفاده است و وضعیت آن به غیرفعال (Soft Delete) تغییر یافت`
        : 'دستگاه با موفقیت غیرفعال شد',
    });
  } catch (error) {
    next(error);
  }
});
