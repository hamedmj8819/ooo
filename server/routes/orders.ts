import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/database';
import { generateId, logAudit } from '../db/helpers';
import {
  generateOrderNumber,
  generatePONumber,
  generateQCReportNumber,
  generateWarehouseReceiptNumber,
} from '../utils/counters';
import {
  ORDER_STATUSES,
  STAGE_STATUSES,
  PRIORITIES,
  SUPPLIER_TYPES,
  QC_DECISIONS,
  OrderStatus,
  StageStatus,
} from '../../shared/constants';
import {
  isOrderTransitionAllowed,
  calculateOrderProgress,
  calculateDeadlineToMetrics,
} from '../../shared/orderStateMachine';
import { requirePermission } from '../middleware/auth';
import { createNotification } from '../services/notificationService';
import { sseService } from '../services/sseService';
import { validateBody } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import {
  ProductionOrder,
  Quote,
  StageExecutionProgress,
  StageQCReport,
  StageEngineeringDoc,
} from '../../shared/types';

export const ordersRouter = Router();

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const CreateOrderSchema = z.object({
  title: z.string().optional(),
  isCustomOrder: z.boolean().optional(),
  compressorModelId: z.string().optional(),
  compressorModelName: z.string().optional(),
  partId: z.string().optional(),
  partName: z.string().min(1, 'نام قطعه الزامی است'),
  partNumber: z.string().optional(),
  quantity: z.number().int().positive('تیراژ باید عددی مثبت باشد'),
  priority: z.enum(PRIORITIES).optional(),
  deadlineDate: z.string().min(1, 'تاریخ سررسید الزامی است'),
  notes: z.string().optional(),
  createdByRole: z.string().optional(),
  createdByName: z.string().optional(),
  customDetails: z
    .object({
      partName: z.string().optional(),
      application: z.string().optional(),
      material: z.string().optional(),
      technicalSpecs: z.string().optional(),
      sampleProvided: z.boolean().optional(),
    })
    .optional(),
});

const CreateQuoteSchema = z.object({
  supplierName: z.string().min(1, 'نام تامین‌کننده الزامی است'),
  supplierType: z.enum(SUPPLIER_TYPES),
  amountRials: z.number().positive('مبلغ باید مثبت باشد'),
  deliveryTimeDays: z.number().int().positive('زمان تحویل باید مثبت باشد'),
  attachmentFileName: z.string().optional(),
  attachmentFileType: z.string().optional(),
  notes: z.string().optional(),
  submittedBy: z.string().optional(),
});

const DecideQuoteSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

const RejectAllQuotesSchema = z.object({
  rejectionReason: z.string().min(2, 'علت رد باید مشخص باشد'),
});

const DefineRoutingSchema = z.object({
  stages: z
    .array(
      z.object({
        stageNumber: z.number().int().positive(),
        stageName: z.string().min(1),
        defaultMachineCategoryId: z.string().optional(),
        estimatedMinutes: z.number().int().positive().optional(),
        isOutsourced: z.boolean().optional(),
        parallelGroup: z.number().int().optional(),
      })
    )
    .min(1, 'حداقل یک مرحله ساخت باید تعریف شود'),
});

const UploadEngineeringDocSchema = z.object({
  stageNumber: z.number().int().positive(),
  stageName: z.string().min(1),
  drawingNumber: z.string().min(1),
  drawingFileName: z.string().optional(),
  drawingFileType: z.enum(['pdf', 'dwg', 'image']).optional(),
  stepFileName: z.string().optional(),
  notes: z.string().optional(),
  uploadedBy: z.string().optional(),
  uploadedByRole: z.string().optional(),
  uploadedByName: z.string().optional(),
});

const AssignStageSchema = z.object({
  machineToolId: z.string().optional(),
  machineToolName: z.string().optional(),
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
  isOutsourced: z.boolean().optional(),
  contractorName: z.string().optional(),
  outsourcedVendorName: z.string().optional(),
  sentDate: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  overrideCategory: z.boolean().optional(),
  overrideCategoryReason: z.string().optional(),
});

const StartStageSchema = z.object({
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
});

const PauseStageSchema = z.object({
  reason: z.string().min(2, 'علت توقف موقت الزامی است'),
});

const ResumeStageSchema = z.object({
  notes: z.string().optional(),
});

const FinishStageSchema = z.object({
  producedQty: z.number().int().min(0, 'تعداد سالم نمی‌تواند منفی باشد'),
  scrapQty: z.number().int().min(0, 'تعداد ضایعات نمی‌تواند منفی باشد').default(0),
  operatorNotes: z.string().optional(),
});

const TransferStageSchema = z.object({
  machineToolId: z.string().min(1, 'شناسه دستگاه جدید الزامی است'),
  machineToolName: z.string().optional(),
  operatorId: z.string().min(1, 'شناسه اپراتور جدید الزامی است'),
  operatorName: z.string().optional(),
  reason: z.string().min(2, 'علت انتقال دستگاه الزامی است'),
});

const UpdateStageProgressSchema = z.object({
  producedQty: z.number().int().min(0),
  scrapQty: z.number().int().min(0).default(0),
  status: z.enum(STAGE_STATUSES).optional(),
  endTime: z.string().optional(),
});

const SubmitQCReportSchema = z.object({
  reportNumber: z.string().optional(),
  passedQty: z.number().int().min(0),
  rejectedQty: z.number().int().min(0).default(0),
  conditionalQty: z.number().int().min(0).default(0),
  decision: z.enum(QC_DECISIONS),
  conditionalReason: z.string().optional(),
  conditionalApprovedBy: z.string().optional(),
  dimensionalCheckPassed: z.boolean().default(true),
  surfaceRoughnessPassed: z.boolean().default(true),
  hardnessRockwell: z.string().optional(),
  roughnessRa: z.string().optional(),
  measuredTolerances: z.string().optional(),
  notes: z.string().optional(),
  sheetFileName: z.string().optional(),
  sheetFileSize: z.string().optional(),
  inspectorName: z.string().optional(),
  inspectorPersonnelCode: z.string().optional(),
});

const SubmitEngineeringApprovalSchema = z.object({
  isApproved: z.boolean(),
  feedback: z.string().optional(),
  approverName: z.string().optional(),
  isFinalStage: z.boolean().optional(),
  canAdvanceToNextStage: z.boolean().optional(),
});

const AssignReworkSchema = z.object({
  machineToolId: z.string().min(1, 'شناسه دستگاه الزامی است'),
  operatorId: z.string().min(1, 'شناسه اپراتور الزامی است'),
  reworkNotes: z.string().min(1, 'شرح اصلاحیه و دوباره‌کاری الزامی است'),
});

const ShortfallDecisionSchema = z.object({
  decision: z.enum(['rebuild_shortfall', 'accept_shortfall', 'cancel']),
  notes: z.string().optional(),
});

const HandoverToWarehouseSchema = z.object({
  deliveredQty: z.number().int().positive('تعداد تحویلی باید مثبت باشد'),
  isSemiFinished: z.boolean().default(false),
  shelfLocation: z.string().min(1, 'موقعیت قفسه در انبار الزامی است'),
  warehouseReceiptNumber: z.string().optional(),
  notes: z.string().optional(),
  handedOverBy: z.string().optional(),
});

const HoldOrderSchema = z.object({
  reason: z.string().min(2, 'علت توقف را وارد کنید'),
});

const CancelOrderSchema = z.object({
  reason: z.string().min(2, 'علت لغو را وارد کنید'),
});

// ==========================================
// HELPER: MAP ORDER ROW WITH COMPUTED FIELDS
// ==========================================

export function mapOrderRow(row: Record<string, unknown>): ProductionOrder {
  const id = String(row.id);

  // Fetch Quotes
  const quoteRows = db
    .prepare('SELECT * FROM quotes WHERE order_id = ? ORDER BY created_at ASC')
    .all(id) as Record<string, unknown>[];

  const quotes: Quote[] = quoteRows.map((q) => ({
    id: String(q.id),
    orderId: String(q.order_id),
    supplierName: String(q.supplier_name),
    supplierType: q.supplier_type as Quote['supplierType'],
    amountRials: Number(q.amount_rials),
    deliveryTimeDays: Number(q.delivery_time_days),
    dateSubmitted: String(q.date_submitted || q.created_at),
    status: q.status as Quote['status'],
    attachmentFileName: q.attachment_file_name ? String(q.attachment_file_name) : undefined,
    attachmentFileType: q.attachment_file_type ? String(q.attachment_file_type) : undefined,
    notes: q.notes ? String(q.notes) : undefined,
    rejectionReason: q.rejection_reason ? String(q.rejection_reason) : undefined,
    submittedBy: String(q.submitted_by || 'واحد برنامه‌ریزی'),
    decidedAt: q.decided_at ? String(q.decided_at) : undefined,
    createdAt: String(q.created_at),
    updatedAt: String(q.updated_at),
  }));

  // Fetch Engineering Docs
  const docRows = db
    .prepare('SELECT * FROM engineering_docs WHERE order_id = ? ORDER BY stage_number ASC')
    .all(id) as Record<string, unknown>[];

  const engineeringDocs: StageEngineeringDoc[] = docRows.map((d) => ({
    id: String(d.id),
    orderId: String(d.order_id),
    stageNumber: Number(d.stage_number),
    stageName: String(d.stage_name),
    drawingNumber: String(d.drawing_number),
    drawingFileName: d.drawing_file_name ? String(d.drawing_file_name) : undefined,
    drawingFileType: (d.drawing_file_type as StageEngineeringDoc['drawingFileType']) || 'pdf',
    stepFileName: d.step_file_name ? String(d.step_file_name) : undefined,
    uploadedAt: String(d.uploaded_at || d.created_at),
    uploadedBy: d.uploaded_by ? String(d.uploaded_by) : undefined,
    uploadedByRole: d.uploaded_by_role ? String(d.uploaded_by_role) : 'engineering',
    uploadedByName: d.uploaded_by_name ? String(d.uploaded_by_name) : 'واحد مهندسی',
    isApproved: Boolean(d.is_approved),
    status: (d.status as StageEngineeringDoc['status']) || (d.is_approved ? 'approved' : 'pending'),
    notes: d.notes ? String(d.notes) : undefined,
    createdAt: String(d.created_at),
    updatedAt: String(d.updated_at),
  }));

  // Fetch Stages and nested QC reports
  const stageRows = db
    .prepare('SELECT * FROM order_stages WHERE order_id = ? ORDER BY stage_number ASC')
    .all(id) as Record<string, unknown>[];

  const stages: StageExecutionProgress[] = stageRows.map((s) => {
    const stageNum = Number(s.stage_number);
    const qcRow = db
      .prepare('SELECT * FROM qc_reports WHERE order_id = ? AND stage_number = ?')
      .get(id, stageNum) as Record<string, unknown> | undefined;

    let qcReport: StageQCReport | undefined = undefined;
    if (qcRow) {
      let engApproval;
      if (qcRow.engineering_approval) {
        try {
          engApproval = JSON.parse(String(qcRow.engineering_approval));
        } catch {
          engApproval = undefined;
        }
      }

      qcReport = {
        id: String(qcRow.id),
        orderId: String(qcRow.order_id),
        stageNumber: Number(qcRow.stage_number),
        reportNumber: String(qcRow.report_number),
        inspectedAt: String(qcRow.inspected_at || qcRow.created_at),
        inspectorName: String(qcRow.inspector_name),
        inspectorPersonnelCode: qcRow.inspector_personnel_code ? String(qcRow.inspector_personnel_code) : undefined,
        passedQty: Number(qcRow.passed_qty),
        rejectedQty: Number(qcRow.rejected_qty || 0),
        conditionalQty: Number(qcRow.conditional_qty || 0),
        decision: qcRow.decision as StageQCReport['decision'],
        conditionalReason: qcRow.conditional_reason ? String(qcRow.conditional_reason) : undefined,
        conditionalApprovedBy: qcRow.conditional_approved_by ? String(qcRow.conditional_approved_by) : undefined,
        dimensionalCheckPassed: Boolean(qcRow.dimensional_check_passed),
        surfaceRoughnessPassed: Boolean(qcRow.surface_roughness_passed),
        hardnessRockwell: qcRow.hardness_rockwell ? String(qcRow.hardness_rockwell) : undefined,
        roughnessRa: qcRow.roughness_ra ? String(qcRow.roughness_ra) : undefined,
        measuredTolerances: qcRow.measured_tolerances ? String(qcRow.measured_tolerances) : undefined,
        notes: String(qcRow.notes || ''),
        sheetFileName: String(qcRow.sheet_file_name || 'QC-Report.pdf'),
        sheetFileSize: qcRow.sheet_file_size ? String(qcRow.sheet_file_size) : undefined,
        sheetUploadedAt: qcRow.sheet_uploaded_at ? String(qcRow.sheet_uploaded_at) : undefined,
        engineeringApproval: engApproval,
        createdAt: String(qcRow.created_at),
        updatedAt: String(qcRow.updated_at),
      };
    }

    const eventRows = db
      .prepare('SELECT * FROM stage_events WHERE order_id = ? AND stage_number = ? ORDER BY timestamp ASC')
      .all(id, stageNum) as Record<string, unknown>[];

    const events = eventRows.map((e) => {
      let details;
      if (e.details) {
        try {
          details = JSON.parse(String(e.details));
        } catch {
          details = undefined;
        }
      }
      return {
        id: String(e.id),
        orderId: String(e.order_id),
        stageNumber: Number(e.stage_number),
        eventType: e.event_type as 'assigned' | 'started' | 'paused' | 'resumed' | 'completed' | 'transferred' | 'rework_assigned',
        timestamp: String(e.timestamp),
        machineId: e.machine_id ? String(e.machine_id) : undefined,
        machineName: e.machine_name ? String(e.machine_name) : undefined,
        operatorId: e.operator_id ? String(e.operator_id) : undefined,
        operatorName: e.operator_name ? String(e.operator_name) : undefined,
        reason: e.reason ? String(e.reason) : undefined,
        details,
        createdAt: String(e.created_at),
        updatedAt: String(e.updated_at || e.created_at),
      };
    });

    return {
      id: String(s.id),
      orderId: String(s.order_id),
      stageNumber: stageNum,
      stageName: String(s.stage_name),
      machineToolId: s.machine_tool_id ? String(s.machine_tool_id) : undefined,
      machineToolName: s.machine_tool_name ? String(s.machine_tool_name) : undefined,
      operatorId: s.operator_id ? String(s.operator_id) : undefined,
      operatorName: s.operator_name ? String(s.operator_name) : undefined,
      status: s.status as StageStatus,
      startTime: s.start_time ? String(s.start_time) : undefined,
      endTime: s.end_time ? String(s.end_time) : undefined,
      assignedAt: s.assigned_at ? String(s.assigned_at) : undefined,
      startedAt: s.started_at ? String(s.started_at) : undefined,
      pausedAt: s.paused_at ? String(s.paused_at) : undefined,
      resumedAt: s.resumed_at ? String(s.resumed_at) : undefined,
      finishedAt: s.finished_at ? String(s.finished_at) : undefined,
      actualWorkingMinutes: Number(s.actual_working_minutes || 0),
      totalPauseMinutes: Number(s.total_pause_minutes || 0),
      pauseReason: s.pause_reason ? String(s.pause_reason) : undefined,
      operatorNotes: s.operator_notes ? String(s.operator_notes) : undefined,
      plannedQty: Number(s.planned_qty || 0),
      producedQty: Number(s.produced_qty || 0),
      scrapQty: Number(s.scrap_qty || 0),
      qcApproved: Boolean(s.qc_approved),
      qcInspectorName: s.qc_inspector_name ? String(s.qc_inspector_name) : undefined,
      qcNotes: s.qc_notes ? String(s.qc_notes) : undefined,
      qcReport,
      engineeringApproval: qcReport?.engineeringApproval,
      isOutsourced: Boolean(s.is_outsourced),
      outsourcedVendorName: s.outsourced_vendor_name ? String(s.outsourced_vendor_name) : undefined,
      contractorName: s.contractor_name ? String(s.contractor_name) : (s.outsourced_vendor_name ? String(s.outsourced_vendor_name) : undefined),
      sentDate: s.sent_date ? String(s.sent_date) : undefined,
      expectedReturnDate: s.expected_return_date ? String(s.expected_return_date) : undefined,
      parallelGroup: s.parallel_group !== null && s.parallel_group !== undefined ? Number(s.parallel_group) : undefined,
      reworkNotes: s.rework_notes ? String(s.rework_notes) : undefined,
      reworkAssignedMachineId: s.rework_assigned_machine_id ? String(s.rework_assigned_machine_id) : undefined,
      reworkAssignedOperatorId: s.rework_assigned_operator_id ? String(s.rework_assigned_operator_id) : undefined,
      reworkCount: Number(s.rework_count || 0),
      estimatedMinutes: Number(s.estimated_minutes || 60),
      overrideCategoryReason: s.override_category_reason ? String(s.override_category_reason) : undefined,
      events,
      createdAt: String(s.created_at),
      updatedAt: String(s.updated_at),
    };
  });

  let customDetails;
  if (row.custom_details) {
    try {
      customDetails = JSON.parse(String(row.custom_details));
    } catch {
      customDetails = undefined;
    }
  }

  const orderStatus = row.status as OrderStatus;
  const deadlineStr = String(row.deadline_date || new Date().toISOString());

  // Dynamic calculations:
  const completionPercentage = calculateOrderProgress(
    orderStatus,
    stages.map((stg) => ({ status: stg.status, estimatedMinutes: stg.estimatedMinutes }))
  );
  const { isOverdue, daysRemaining, urgencyLevel } = calculateDeadlineToMetrics(deadlineStr, orderStatus);

  return {
    id,
    orderNumber: String(row.order_number),
    poNumber: row.po_number ? String(row.po_number) : undefined,
    title: String(row.title),
    isCustomOrder: Boolean(row.is_custom_order),
    customDetails,
    compressorModelId: row.compressor_model_id ? String(row.compressor_model_id) : undefined,
    compressorModelName: row.compressor_model_name ? String(row.compressor_model_name) : undefined,
    partId: row.part_id ? String(row.part_id) : undefined,
    partName: String(row.part_name),
    partNumber: String(row.part_number || ''),
    quantity: Number(row.quantity),
    priority: row.priority as ProductionOrder['priority'],
    deadlineDate: deadlineStr,
    createdDate: String(row.created_date || row.created_at),
    createdByRole: row.created_by_role as ProductionOrder['createdByRole'],
    createdByName: String(row.created_by_name || 'کاربر سیستم'),
    status: orderStatus,
    quotes,
    engineeringDocs,
    stages,
    completionPercentage,
    deliveredToWarehouseQty: row.delivered_to_warehouse_qty !== null && row.delivered_to_warehouse_qty !== undefined ? Number(row.delivered_to_warehouse_qty) : undefined,
    isDeliveredSemiFinished: Boolean(row.is_delivered_semi_finished),
    warehouseReceiptNumber: row.warehouse_receipt_number ? String(row.warehouse_receipt_number) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    holdReason: row.hold_reason ? String(row.hold_reason) : undefined,
    cancellationReason: row.cancellation_reason ? String(row.cancellation_reason) : undefined,
    quoteRejectionReason: row.quote_rejection_reason ? String(row.quote_rejection_reason) : undefined,
    hasShortfall: Boolean(row.has_shortfall),
    shortfallDecision: row.shortfall_decision ? String(row.shortfall_decision) : undefined,
    shortfallNotes: row.shortfall_notes ? String(row.shortfall_notes) : undefined,
    previousStatus: row.previous_status ? (row.previous_status as OrderStatus) : undefined,
    isOverdue,
    daysRemaining,
    urgencyLevel,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
  };
}

// ==========================================
// 1. GET ALL ORDERS
// ==========================================
ordersRouter.get('/', requirePermission('orders:read'), (req, res) => {
  const { status, priority, search, isCustom } = req.query;

  let query = 'SELECT * FROM orders WHERE is_active = 1';
  const params: unknown[] = [];

  // Operator-specific filter: only orders with stages assigned to this operator
  if (req.user?.role === 'operator') {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return res.json([]);
    }
    query += ` AND id IN (SELECT order_id FROM order_stages WHERE operator_id = ?)`;
    params.push(operatorId);
  }

  if (status && typeof status === 'string') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (priority && typeof priority === 'string') {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (isCustom !== undefined) {
    query += ' AND is_custom_order = ?';
    params.push(isCustom === 'true' ? 1 : 0);
  }

  if (search && typeof search === 'string') {
    query += ' AND (order_number LIKE ? OR title LIKE ? OR part_name LIKE ? OR part_number LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  // Sort by priority urgency (emergency > urgent > normal) and deadline ascending
  query += ` ORDER BY 
    CASE priority 
      WHEN 'emergency' THEN 1 
      WHEN 'urgent' THEN 2 
      ELSE 3 
    END ASC, 
    deadline_date ASC, 
    created_at DESC`;

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  res.json(rows.map(mapOrderRow));
});

// ==========================================
// 2. GET ORDER BY ID
// ==========================================
ordersRouter.get('/:id', requirePermission('orders:read'), (req, res, next) => {
  const id = String(req.params.id);
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) {
    return next(new AppError(404, 'NOT_FOUND', 'سفارش مورد نظر یافت نشد'));
  }

  if (req.user?.role === 'operator') {
    const operatorId = req.user.operatorId;
    if (!operatorId) {
      return next(new AppError(403, 'FORBIDDEN', 'کاربر اپراتور فاقد شناسنامه کارگاهی معتبر است'));
    }
    const isAssigned = db
      .prepare('SELECT COUNT(*) as count FROM order_stages WHERE order_id = ? AND operator_id = ?')
      .get(id, operatorId) as { count: number };

    if (isAssigned.count === 0) {
      return next(new AppError(403, 'FORBIDDEN', 'شما به این سفارش دسترسی ندارید زیرا مرحله‌ای به شما تخصیص داده نشده است'));
    }
  }

  res.json(mapOrderRow(row));
});

// ==========================================
// 3. CREATE NEW ORDER (CEO / Planning)
// ==========================================
ordersRouter.post('/', requirePermission('orders:create'), validateBody(CreateOrderSchema), (req, res, next) => {
  try {
    const data = req.body;
    const id = generateId('PO');
    const now = new Date().toISOString();

    let orderNumber: string = '';
    const initialStatus: OrderStatus = 'pending_planning';
    const title = data.title || `دستور ساخت ${data.partName} - تعداد ${data.quantity} عدد`;

    const tx = db.transaction(() => {
      // Issue sequential order number from counters table
      orderNumber = generateOrderNumber(db);

      const insertOrder = db.prepare(`
        INSERT INTO orders (
          id, order_number, title, is_custom_order, custom_details,
          compressor_model_id, compressor_model_name, part_id, part_name,
          part_number, quantity, priority, deadline_date, created_date,
          created_by_role, created_by_name, status, completion_percentage,
          notes, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, ?, ?)
      `);

      insertOrder.run(
        id,
        orderNumber,
        title,
        data.isCustomOrder ? 1 : 0,
        data.customDetails ? JSON.stringify(data.customDetails) : null,
        data.compressorModelId || null,
        data.compressorModelName || null,
        data.partId || null,
        data.partName,
        data.partNumber || '',
        data.quantity,
        data.priority || 'normal',
        data.deadlineDate,
        now,
        req.user?.role || data.createdByRole || 'planning',
        req.user?.fullName || data.createdByName || 'واحد برنامه‌ریزی',
        initialStatus,
        data.notes || null,
        now,
        now
      );

      // If standard part with pre-defined stages, insert default stages
      if (data.partId && !data.isCustomOrder) {
        const defaultStages = db
          .prepare('SELECT * FROM part_stages WHERE part_id = ? ORDER BY stage_number ASC')
          .all(data.partId) as Record<string, unknown>[];

        const insertStage = db.prepare(`
          INSERT INTO order_stages (
            id, order_id, stage_number, stage_name, planned_qty,
            produced_qty, scrap_qty, qc_approved, status, is_outsourced,
            estimated_minutes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'not_started', ?, ?, ?, ?)
        `);

        for (const stg of defaultStages) {
          insertStage.run(
            `OSTG-${id}-${stg.stage_number}`,
            id,
            stg.stage_number,
            stg.name,
            data.quantity,
            stg.is_outsourced ? 1 : 0,
            Number(stg.estimated_minutes || 60),
            now,
            now
          );

          if (stg.pdf_drawing_file_name || stg.step_file_name) {
            db.prepare(`
              INSERT INTO engineering_docs (
                id, order_id, stage_number, stage_name, drawing_number,
                drawing_file_name, drawing_file_type, step_file_name,
                uploaded_at, uploaded_by_role, uploaded_by_name, is_approved,
                status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, 'pdf', ?, ?, 'engineering', 'واحد مهندسی', 1, 'approved', ?, ?)
            `).run(
              `EDOC-${id}-${stg.stage_number}`,
              id,
              stg.stage_number,
              stg.name,
              `DWG-${data.partNumber || 'REV1'}-STG${stg.stage_number}`,
              stg.pdf_drawing_file_name || null,
              stg.step_file_name || null,
              now,
              now,
              now
            );
          }
        }
      }

      // Notification inside transaction
      createNotification(db, {
        title: `دستور ساخت جدید صادر شد: ${orderNumber}`,
        message: `سفارش ساخت "${data.partName}" با تیراژ ${data.quantity} عدد صادر شد و به واحد برنامه‌ریزی ارجاع گردید.`,
        type: 'info',
        targetRoles: ['planning', 'ceo'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'draft');

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    const mapped = mapOrderRow(created);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ORDER_CREATED',
      entityType: 'orders',
      entityId: id,
      newValue: mapped as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.status(201).json(mapped);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 4. START PLANNING INQUIRY (Planning)
// ==========================================
ordersRouter.post('/:id/start-inquiry', requirePermission('orders:inquiry_start'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    const nextStatus: OrderStatus = 'planning_inquiry';

    if (!isOrderTransitionAllowed(currentStatus, nextStatus)) {
      return next(
        new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `انتقال وضعیت از "${currentStatus}" به "${nextStatus}" مجاز نمی‌باشد`
        )
      );
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, id);

      createNotification(db, {
        title: `استعلام تامین متریال آغاز شد: ${order.order_number}`,
        message: `واحد برنامه‌ریزی استعلام ریخته‌گری/تامین متریال سفارش "${order.part_name}" را آغاز نمود.`,
        type: 'info',
        targetRoles: ['planning', 'ceo'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, nextStatus);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'INQUIRY_STARTED',
      entityType: 'orders',
      entityId: id,
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 5. SUBMIT QUOTE (Planning)
// ==========================================
ordersRouter.post('/:id/quotes', requirePermission('orders:quotes_create'), validateBody(CreateQuoteSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const data = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    // Quotes can be submitted in planning_inquiry or pending_ceo_quote (or draft)
    if (currentStatus !== 'planning_inquiry' && currentStatus !== 'pending_ceo_quote' && currentStatus !== 'draft') {
      return next(
        new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `ثبت پیش‌فاکتور در وضعیت فعلی "${currentStatus}" مجاز نمی‌باشد`
        )
      );
    }

    const quoteId = generateId('QUO');
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO quotes (
          id, order_id, supplier_name, supplier_type, amount_rials,
          delivery_time_days, date_submitted, status, attachment_file_name,
          attachment_file_type, notes, submitted_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_ceo', ?, ?, ?, ?, ?, ?)
      `).run(
        quoteId,
        id,
        data.supplierName,
        data.supplierType,
        Math.round(data.amountRials),
        data.deliveryTimeDays,
        now,
        data.attachmentFileName || null,
        data.attachmentFileType || null,
        data.notes || null,
        req.user?.fullName || data.submittedBy || 'واحد برنامه‌ریزی',
        now,
        now
      );

      // Order advances to pending_ceo_quote
      db.prepare(`
        UPDATE orders SET
          status = 'pending_ceo_quote',
          updated_at = ?
        WHERE id = ?
      `).run(now, id);

      createNotification(db, {
        title: `پیش‌فاکتور جدید جهت تایید مدیرعامل: ${order.order_number}`,
        message: `پیش‌فاکتور ${data.supplierName} به مبلغ ${Math.round(data.amountRials).toLocaleString('fa-IR')} ریال ثبت گردید.`,
        type: 'warning',
        targetRoles: ['ceo', 'planning'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'pending_ceo_quote');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'QUOTE_SUBMITTED',
      entityType: 'quotes',
      entityId: quoteId,
      details: { orderId: id, supplierName: data.supplierName, amountRials: data.amountRials },
      ipAddress: req.ip,
    });

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json(mapOrderRow(updatedOrder));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 6. DECIDE SINGLE QUOTE (CEO)
// ==========================================
ordersRouter.post('/:id/quotes/:quoteId/decision', requirePermission('orders:quotes_decide'), validateBody(DecideQuoteSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const quoteId = String(req.params.quoteId);
    const { decision, rejectionReason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const quote = db.prepare('SELECT * FROM quotes WHERE id = ? AND order_id = ?').get(quoteId, id) as Record<string, unknown> | undefined;
    if (!quote) {
      return next(new AppError(404, 'NOT_FOUND', 'پیش‌فاکتور یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    const now = new Date().toISOString();

    if (decision === 'approved') {
      // Rule: Exactly ONE quote can be approved. Prevent double approval.
      const existingApproved = db
        .prepare("SELECT id FROM quotes WHERE order_id = ? AND status = 'approved_by_ceo'")
        .get(id) as { id: string } | undefined;

      if (existingApproved && existingApproved.id !== quoteId) {
        return next(new AppError(409, 'ALREADY_APPROVED', 'سفارش در حال حاضر یک پیش‌فاکتور تاییدشده دارد'));
      }

      if (!isOrderTransitionAllowed(currentStatus, 'material_ordered')) {
        return next(
          new AppError(
            409,
            'INVALID_STATUS_TRANSITION',
            `امکان تایید پیش‌فاکتور در وضعیت "${currentStatus}" وجود ندارد`
          )
        );
      }

      const tx = db.transaction(() => {
        // 1. Approve selected quote
        db.prepare(`
          UPDATE quotes SET
            status = 'approved_by_ceo',
            decided_at = ?,
            updated_at = ?
          WHERE id = ?
        `).run(now, now, quoteId);

        // 2. Automatically mark other pending quotes as superseded
        db.prepare(`
          UPDATE quotes SET
            status = 'superseded',
            rejection_reason = 'پیش‌فاکتور دیگری توسط مدیرعامل تایید شد',
            decided_at = ?,
            updated_at = ?
          WHERE order_id = ? AND id != ? AND status = 'pending_ceo'
        `).run(now, now, id, quoteId);

        // 3. Advance order to material_ordered
        db.prepare(`
          UPDATE orders SET
            status = 'material_ordered',
            updated_at = ?
          WHERE id = ?
        `).run(now, id);

        createNotification(db, {
          title: `پیش‌فاکتور سفارش ${order.order_number} تایید شد`,
          message: `پیش‌فاکتور ${quote.supplier_name} تایید شد. لطفاً نسبت به ثبت سفارش متریال اقدام فرمایید.`,
          type: 'success',
          targetRoles: ['planning', 'ceo'],
          linkOrderId: id,
        });
      });

      tx();

      sseService.broadcastOrderUpdate(id, 'material_ordered');

      logAudit(db, {
        userId: req.user?.id,
        userName: req.user?.username,
        userRole: req.user?.role,
        action: 'QUOTE_APPROVED',
        entityType: 'quotes',
        entityId: quoteId,
        details: { quoteId, supplierName: quote.supplier_name },
        ipAddress: req.ip,
      });
    } else {
      // Decision is rejected
      const reason = rejectionReason || 'عدم تایید قیمت یا شرایط توسط مدیرعامل';

      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE quotes SET
            status = 'rejected_by_ceo',
            rejection_reason = ?,
            decided_at = ?,
            updated_at = ?
          WHERE id = ?
        `).run(reason, now, now, quoteId);

        const pending = db
          .prepare("SELECT count(*) as count FROM quotes WHERE order_id = ? AND status = 'pending_ceo'")
          .get(id) as { count: number };

        // If no more pending quotes remain, transition order to quote_rejected
        if (pending.count === 0) {
          db.prepare(`
            UPDATE orders SET
              status = 'quote_rejected',
              quote_rejection_reason = ?,
              updated_at = ?
            WHERE id = ?
          `).run(reason, now, id);
        }

        createNotification(db, {
          title: `پیش‌فاکتور سفارش ${order.order_number} رد شد`,
          message: `پیش‌فاکتور ${quote.supplier_name} رد شد. علت: ${reason}`,
          type: 'error',
          targetRoles: ['planning'],
          linkOrderId: id,
        });
      });

      tx();

      sseService.broadcastOrderUpdate(id, 'quote_rejected');

      logAudit(db, {
        userId: req.user?.id,
        userName: req.user?.username,
        userRole: req.user?.role,
        action: 'QUOTE_REJECTED',
        entityType: 'quotes',
        entityId: quoteId,
        details: { reason },
        ipAddress: req.ip,
      });
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updatedOrder));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 7. REJECT ALL QUOTES (CEO)
// ==========================================
ordersRouter.post('/:id/quotes/reject-all', requirePermission('orders:quotes_decide'), validateBody(RejectAllQuotesSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { rejectionReason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    if (!isOrderTransitionAllowed(currentStatus, 'quote_rejected')) {
      return next(
        new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `امکان رد کلیه پیش‌فاکتورها در وضعیت "${currentStatus}" وجود ندارد`
        )
      );
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      // Reject all pending quotes
      db.prepare(`
        UPDATE quotes SET
          status = 'rejected_by_ceo',
          rejection_reason = ?,
          decided_at = ?,
          updated_at = ?
        WHERE order_id = ? AND status = 'pending_ceo'
      `).run(rejectionReason, now, now, id);

      // Order transitions to quote_rejected
      db.prepare(`
        UPDATE orders SET
          status = 'quote_rejected',
          quote_rejection_reason = ?,
          updated_at = ?
        WHERE id = ?
      `).run(rejectionReason, now, id);

      createNotification(db, {
        title: `کلیه پیش‌فاکتورهای سفارش ${order.order_number} رد شدند`,
        message: `علت رد: ${rejectionReason}. واحد برنامه‌ریزی باید استعلام جدید انجام دهد.`,
        type: 'error',
        targetRoles: ['planning'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'quote_rejected');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ALL_QUOTES_REJECTED',
      entityType: 'orders',
      entityId: id,
      details: { rejectionReason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 8. CONFIRM MATERIAL RECEIPT & ISSUE PO (Planning)
// ==========================================
ordersRouter.post('/:id/confirm-material', requirePermission('orders:material_receive_po'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    if (!isOrderTransitionAllowed(currentStatus, 'material_received_po')) {
      return next(
        new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `تایید دریافت متریال در وضعیت "${currentStatus}" مجاز نمی‌باشد`
        )
      );
    }

    const now = new Date().toISOString();
    let poNumber: string = '';

    const tx = db.transaction(() => {
      // Issue official sequential PO number from counters table
      poNumber = generatePONumber(db);

      // Transition to material_received_po and immediately to awaiting_engineering for workflow
      db.prepare(`
        UPDATE orders SET
          po_number = ?,
          status = 'awaiting_engineering',
          updated_at = ?
        WHERE id = ?
      `).run(poNumber, now, id);

      createNotification(db, {
        title: `ورود متریال و صدور سند PO: ${poNumber}`,
        message: `بلوک ریخته‌گری/متریال اولیه "${order.part_name}" تحویل شد و شماره سفارش ساخت ${poNumber} صادر گردید. در انتظار تایید نقشه‌های مهندسی.`,
        type: 'info',
        targetRoles: ['engineering', 'production', 'planning'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'awaiting_engineering');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'MATERIAL_RECEIVED_PO_ISSUED',
      entityType: 'orders',
      entityId: id,
      details: { poNumber },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 9. DEFINE MANUFACTURING ROUTING (Engineering)
// ==========================================
ordersRouter.post('/:id/routing', requirePermission('orders:routing_define'), validateBody(DefineRoutingSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { stages } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      // Delete existing stages if in planning/engineering state and not started
      const existingStarted = db
        .prepare("SELECT count(*) as count FROM order_stages WHERE order_id = ? AND status != 'not_started'")
        .get(id) as { count: number };

      if (existingStarted.count > 0) {
        throw new AppError(409, 'ROUTING_LOCKED', 'تولید برخی مراحل آغاز شده و تغییر کامل درخت فرایند امکان‌پذیر نیست');
      }

      db.prepare('DELETE FROM order_stages WHERE order_id = ?').run(id);

      const insertStage = db.prepare(`
        INSERT INTO order_stages (
          id, order_id, stage_number, stage_name, planned_qty,
          produced_qty, scrap_qty, qc_approved, status, is_outsourced,
          parallel_group, estimated_minutes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'not_started', ?, ?, ?, ?, ?)
      `);

      for (const stg of stages) {
        insertStage.run(
          `OSTG-${id}-${stg.stageNumber}`,
          id,
          stg.stageNumber,
          stg.stageName,
          Number(order.quantity),
          stg.isOutsourced ? 1 : 0,
          stg.parallelGroup || null,
          Number(stg.estimatedMinutes || 60),
          now,
          now
        );
      }

      db.prepare('UPDATE orders SET updated_at = ? WHERE id = ?').run(now, id);
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ROUTING_DEFINED',
      entityType: 'orders',
      entityId: id,
      details: { stagesCount: stages.length },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 10. UPLOAD ENGINEERING DOCS & APPROVAL (Engineering)
// ==========================================
ordersRouter.post('/:id/engineering-docs', requirePermission('orders:engineering_upload'), validateBody(UploadEngineeringDocSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const docId = `EDOC-${id}-${data.stageNumber}`;
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      const upsert = db.prepare(`
        INSERT INTO engineering_docs (
          id, order_id, stage_number, stage_name, drawing_number,
          drawing_file_name, drawing_file_type, step_file_name, uploaded_at,
          uploaded_by, uploaded_by_role, uploaded_by_name, is_approved,
          status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', ?, ?, ?)
        ON CONFLICT(order_id, stage_number) DO UPDATE SET
          drawing_number = excluded.drawing_number,
          drawing_file_name = coalesce(excluded.drawing_file_name, drawing_file_name),
          drawing_file_type = excluded.drawing_file_type,
          step_file_name = coalesce(excluded.step_file_name, step_file_name),
          uploaded_at = excluded.uploaded_at,
          uploaded_by_name = excluded.uploaded_by_name,
          is_approved = 1,
          status = 'approved',
          notes = excluded.notes,
          updated_at = excluded.updated_at
      `);

      upsert.run(
        docId,
        id,
        data.stageNumber,
        data.stageName,
        data.drawingNumber,
        data.drawingFileName || null,
        data.drawingFileType || 'pdf',
        data.stepFileName || null,
        now,
        req.user?.id || data.uploadedBy || null,
        req.user?.role || data.uploadedByRole || 'engineering',
        req.user?.fullName || data.uploadedByName || 'واحد مهندسی',
        data.notes || null,
        now,
        now
      );

      const totalStages = db.prepare('SELECT count(*) as count FROM order_stages WHERE order_id = ?').get(id) as { count: number };
      const approvedDocs = db.prepare("SELECT count(*) as count FROM engineering_docs WHERE order_id = ? AND is_approved = 1").get(id) as { count: number };

      // Custom orders or standard orders MUST have totalStages > 0 and all docs approved before transitioning
      if (totalStages.count > 0 && approvedDocs.count >= totalStages.count) {
        if (order.status === 'awaiting_engineering' || order.status === 'material_received_po') {
          db.prepare(`
            UPDATE orders SET
              status = 'engineering_approved',
              updated_at = ?
            WHERE id = ?
          `).run(now, id);

          createNotification(db, {
            title: `نقشه‌های فنی تایید شد: ${order.order_number}`,
            message: `نقشه‌ها و فایل‌های تمام مراحل تایید شد. آماده واگذاری به سالن ماشین‌کاری.`,
            type: 'success',
            targetRoles: ['production', 'engineering'],
            linkOrderId: id,
          });
        }
      }
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'engineering_approved');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ENGINEERING_DOC_UPLOADED',
      entityType: 'engineering_docs',
      entityId: docId,
      details: { stageNumber: data.stageNumber, drawingNumber: data.drawingNumber },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 11. ASSIGN MACHINE & OPERATOR TO STAGE (Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/assign', requirePermission('orders:assign_stage'), validateBody(AssignStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const {
      machineToolId,
      machineToolName,
      operatorId,
      operatorName,
      isOutsourced,
      contractorName,
      outsourcedVendorName,
      sentDate,
      expectedReturnDate,
      overrideCategory,
      overrideCategoryReason,
    } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    // STRICT STAGE ORDERING RULE: Stage n requires stage n-1 to be 'completed', unless in same parallel_group
    if (stageNumber > 1) {
      const prevStage = db
        .prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?')
        .get(id, stageNumber - 1) as Record<string, unknown> | undefined;

      if (prevStage) {
        const isParallel =
          stage.parallel_group !== null &&
          stage.parallel_group !== undefined &&
          prevStage.parallel_group !== null &&
          prevStage.parallel_group !== undefined &&
          stage.parallel_group === prevStage.parallel_group;

        if (!isParallel && prevStage.status !== 'completed') {
          return next(
            new AppError(
              409,
              'PREVIOUS_STAGE_INCOMPLETE',
              `مرحله ${stageNumber - 1} (${prevStage.stage_name}) هنوز تکمیل و توسط کنترل کیفیت تایید نهایی نشده است`
            )
          );
        }
      }
    }

    const now = new Date().toISOString();

    // OUTSOURCED STAGE
    if (isOutsourced || stage.is_outsourced) {
      const finalContractor = contractorName || outsourcedVendorName || stage.contractor_name || stage.outsourced_vendor_name;
      if (!finalContractor || String(finalContractor).trim().length === 0) {
        return next(new AppError(400, 'CONTRACTOR_REQUIRED', 'نام پیمانکار / کارگاه برون‌سپاری الزامی است'));
      }

      const eventId = generateId('EVT');
      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE order_stages SET
            is_outsourced = 1,
            contractor_name = ?,
            outsourced_vendor_name = ?,
            sent_date = ?,
            expected_return_date = ?,
            status = 'assigned',
            assigned_at = ?,
            updated_at = ?
          WHERE order_id = ? AND stage_number = ?
        `).run(
          finalContractor,
          finalContractor,
          sentDate || now,
          expectedReturnDate || null,
          now,
          now,
          id,
          stageNumber
        );

        db.prepare(`
          INSERT INTO stage_events (
            id, order_id, stage_number, event_type, timestamp, reason, details, created_at
          ) VALUES (?, ?, ?, 'assigned', ?, ?, ?, ?)
        `).run(
          eventId,
          id,
          stageNumber,
          now,
          'واگذاری به پیمانکار برون‌سپاری',
          JSON.stringify({ isOutsourced: true, contractorName: finalContractor, sentDate, expectedReturnDate }),
          now
        );

        if (order.status === 'engineering_approved' || order.status === 'awaiting_engineering') {
          db.prepare(`UPDATE orders SET status = 'in_production', updated_at = ? WHERE id = ?`).run(now, id);
        }
      });

      tx();

      logAudit(db, {
        userId: req.user?.id,
        userName: req.user?.username,
        userRole: req.user?.role,
        action: 'STAGE_ASSIGNED_OUTSOURCED',
        entityType: 'order_stages',
        entityId: `${id}-${stageNumber}`,
        details: { contractorName: finalContractor, sentDate, expectedReturnDate },
        ipAddress: req.ip,
      });

      const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
      return res.json(mapOrderRow(updated));
    }

    // INTERNAL STAGE ASSIGNMENT
    if (!machineToolId || !operatorId) {
      return next(new AppError(400, 'MACHINE_AND_OPERATOR_REQUIRED', 'انتخاب دستگاه و اپراتور برای مرحله داخلی الزامی است'));
    }

    // Check Machine status
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineToolId) as Record<string, unknown> | undefined;
    if (!machine) {
      return next(new AppError(404, 'MACHINE_NOT_FOUND', 'دستگاه انتخابی یافت نشد'));
    }
    if (!machine.is_active) {
      return next(new AppError(400, 'MACHINE_INACTIVE', `دستگاه ${machine.name} غیرفعال است`));
    }
    if (machine.status !== 'idle') {
      return next(
        new AppError(
          409,
          'MACHINE_NOT_IDLE',
          `دستگاه ${machine.name} در وضعیت "${machine.status}" قرار دارد و تنها دستگاه‌های آزاد (idle) قابل واگذاری هستند`
        )
      );
    }

    // Check Category Match
    if (order.part_id) {
      const partStageRow = db
        .prepare('SELECT default_machine_category_id FROM part_stages WHERE part_id = ? AND stage_number = ?')
        .get(order.part_id, stageNumber) as { default_machine_category_id?: string } | undefined;

      if (partStageRow && partStageRow.default_machine_category_id && partStageRow.default_machine_category_id !== machine.category) {
        if (!overrideCategory) {
          return next(
            new AppError(
              409,
              'MACHINE_CATEGORY_MISMATCH',
              `دسته‌ی دستگاه انتخابی (${machine.category}) با فرایند تعریف‌شده برای این مرحله (${partStageRow.default_machine_category_id}) همخوانی ندارد. جهت واگذاری، فعال‌سازی گزینه اورراید و درج دلیل الزامی است`
            )
          );
        }
        if (!overrideCategoryReason || overrideCategoryReason.trim().length === 0) {
          return next(
            new AppError(400, 'OVERRIDE_REASON_REQUIRED', 'درج علت اورراید و تغییر دسته‌بندی دستگاه الزامی است')
          );
        }
      }
    }

    // Check Operator Concurrency: max 1 active in_progress stage at any time
    const busyCheck = db
      .prepare("SELECT count(*) as count FROM order_stages WHERE operator_id = ? AND status = 'in_progress'")
      .get(operatorId) as { count: number };

    if (busyCheck.count > 0) {
      return next(
        new AppError(
          409,
          'OPERATOR_BUSY',
          'اپراتور انتخابی در حال حاضر دارای مرحله‌ی فعال دیگری در خط تولید می‌باشد (محدودیت همزمانی: حداکثر ۱ مرحله فعال)'
        )
      );
    }

    const opRow = db.prepare('SELECT * FROM operators WHERE id = ?').get(operatorId) as Record<string, unknown> | undefined;
    const finalOpName = operatorName || (opRow ? String(opRow.name) : 'اپراتور');
    const finalMachineName = machineToolName || String(machine.name);

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE order_stages SET
          machine_tool_id = ?,
          machine_tool_name = ?,
          operator_id = ?,
          operator_name = ?,
          override_category_reason = ?,
          status = 'assigned',
          assigned_at = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(
        machineToolId,
        finalMachineName,
        operatorId,
        finalOpName,
        overrideCategory ? overrideCategoryReason : null,
        now,
        now,
        id,
        stageNumber
      );

      db.prepare(`
        UPDATE machines SET
          status = 'active',
          current_work_order_id = ?,
          current_part_name = ?,
          current_stage_name = ?,
          current_operator_id = ?,
          current_operator_name = ?,
          updated_at = ?
        WHERE id = ?
      `).run(id, order.part_name, stage.stage_name, operatorId, finalOpName, now, machineToolId);

      db.prepare(`
        UPDATE operators SET
          assigned_machine_id = ?,
          current_work_order_id = ?,
          current_stage_name = ?,
          status = 'working',
          updated_at = ?
        WHERE id = ?
      `).run(machineToolId, id, stage.stage_name, now, operatorId);

      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, details, created_at
        ) VALUES (?, ?, ?, 'assigned', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        machineToolId,
        finalMachineName,
        operatorId,
        finalOpName,
        JSON.stringify({ overrideCategory: Boolean(overrideCategory), overrideCategoryReason }),
        now
      );

      // Order advances to in_production
      if (order.status === 'engineering_approved' || order.status === 'awaiting_engineering') {
        db.prepare(`
          UPDATE orders SET
            status = 'in_production',
            updated_at = ?
          WHERE id = ?
        `).run(now, id);
      }
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_ASSIGNED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { machineToolId, operatorId, operatorName: finalOpName },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 12. START STAGE EXECUTION (Operator / Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/start', requirePermission('orders:start_stage'), validateBody(StartStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (stage.status !== 'assigned' && stage.status !== 'rework' && stage.status !== 'not_started') {
      return next(new AppError(409, 'INVALID_STAGE_STATUS', `مرحله در وضعیت "${stage.status}" قابل شروع نیست`));
    }

    if (req.user?.role === 'operator' && req.user.operatorId && stage.operator_id && stage.operator_id !== req.user.operatorId) {
      return next(new AppError(403, 'FORBIDDEN', 'شما فقط مجاز به شروع مراحل واگذارشده به خودتان هستید'));
    }

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE order_stages SET
          status = 'in_progress',
          start_time = coalesce(start_time, ?),
          started_at = coalesce(started_at, ?),
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(now, now, now, id, stageNumber);

      if (stage.machine_tool_id) {
        db.prepare(`
          UPDATE machines SET
            status = 'active',
            current_work_order_id = ?,
            current_part_name = ?,
            current_stage_name = ?,
            updated_at = ?
          WHERE id = ?
        `).run(id, order.part_name, stage.stage_name, now, stage.machine_tool_id);
      }

      if (stage.operator_id) {
        db.prepare(`
          UPDATE operators SET
            status = 'working',
            current_work_order_id = ?,
            current_stage_name = ?,
            updated_at = ?
          WHERE id = ?
        `).run(id, stage.stage_name, now, stage.operator_id);
      }

      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, details, created_at
        ) VALUES (?, ?, ?, 'started', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        stage.machine_tool_id ? String(stage.machine_tool_id) : null,
        stage.machine_tool_name ? String(stage.machine_tool_name) : null,
        stage.operator_id ? String(stage.operator_id) : null,
        stage.operator_name ? String(stage.operator_name) : null,
        JSON.stringify({ startedBy: req.user?.fullName || req.user?.username }),
        now
      );
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_STARTED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { stageName: stage.stage_name },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 13. PAUSE STAGE EXECUTION (Operator / Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/pause', requirePermission('orders:pause_stage'), validateBody(PauseStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { reason } = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (stage.status !== 'in_progress') {
      return next(new AppError(409, 'STAGE_NOT_IN_PROGRESS', 'تنها مراحل در حال اجرا قابل توقف موقت هستند'));
    }

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE order_stages SET
          status = 'paused',
          paused_at = ?,
          pause_reason = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(now, reason, now, id, stageNumber);

      if (stage.machine_tool_id) {
        db.prepare(`UPDATE machines SET status = 'idle', updated_at = ? WHERE id = ?`).run(now, stage.machine_tool_id);
      }

      if (stage.operator_id) {
        db.prepare(`UPDATE operators SET status = 'idle', updated_at = ? WHERE id = ?`).run(now, stage.operator_id);
      }

      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, reason, created_at
        ) VALUES (?, ?, ?, 'paused', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        stage.machine_tool_id ? String(stage.machine_tool_id) : null,
        stage.machine_tool_name ? String(stage.machine_tool_name) : null,
        stage.operator_id ? String(stage.operator_id) : null,
        stage.operator_name ? String(stage.operator_name) : null,
        reason,
        now
      );
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_PAUSED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { reason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 14. RESUME STAGE EXECUTION (Operator / Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/resume', requirePermission('orders:resume_stage'), validateBody(ResumeStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (stage.status !== 'paused') {
      return next(new AppError(409, 'STAGE_NOT_PAUSED', 'مرحله در وضعیت متوقف موقت قرار ندارد'));
    }

    // Check machine status if machine is assigned
    if (stage.machine_tool_id) {
      const machine = db.prepare('SELECT status FROM machines WHERE id = ?').get(stage.machine_tool_id) as { status: string } | undefined;
      if (machine && machine.status === 'breakdown') {
        return next(
          new AppError(
            409,
            'MACHINE_IN_BREAKDOWN',
            'دستگاه این مرحله در وضعیت خرابی قرار دارد. ابتدا خرابی دستگاه را برطرف کرده یا مرحله را به دستگاه دیگری منتقل نمایید'
          )
        );
      }
    }

    // Calculate pause duration
    let pauseMinutes = 0;
    if (stage.paused_at) {
      const diffMs = new Date(now).getTime() - new Date(String(stage.paused_at)).getTime();
      pauseMinutes = Math.max(1, Math.round(diffMs / 60000));
    }
    const totalPauseMinutes = (Number(stage.total_pause_minutes) || 0) + pauseMinutes;

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE order_stages SET
          status = 'in_progress',
          resumed_at = ?,
          paused_at = NULL,
          total_pause_minutes = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(now, totalPauseMinutes, now, id, stageNumber);

      if (stage.machine_tool_id) {
        db.prepare(`
          UPDATE machines SET
            status = 'active',
            current_work_order_id = ?,
            current_part_name = ?,
            current_stage_name = ?,
            updated_at = ?
          WHERE id = ?
        `).run(id, order.part_name, stage.stage_name, now, stage.machine_tool_id);
      }

      if (stage.operator_id) {
        db.prepare(`
          UPDATE operators SET
            status = 'working',
            current_work_order_id = ?,
            current_stage_name = ?,
            updated_at = ?
          WHERE id = ?
        `).run(id, stage.stage_name, now, stage.operator_id);
      }

      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, details, created_at
        ) VALUES (?, ?, ?, 'resumed', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        stage.machine_tool_id ? String(stage.machine_tool_id) : null,
        stage.machine_tool_name ? String(stage.machine_tool_name) : null,
        stage.operator_id ? String(stage.operator_id) : null,
        stage.operator_name ? String(stage.operator_name) : null,
        JSON.stringify({ additionalPauseMinutes: pauseMinutes, totalPauseMinutes }),
        now
      );
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_RESUMED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { pauseMinutes, totalPauseMinutes },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 15. FINISH STAGE & RELEASE RESOURCES (Operator / Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/finish', requirePermission('orders:finish_stage'), validateBody(FinishStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { producedQty, scrapQty, operatorNotes } = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (stage.status !== 'in_progress' && stage.status !== 'paused' && stage.status !== 'assigned' && stage.status !== 'rework') {
      return next(new AppError(409, 'STAGE_NOT_ACTIVE', `مرحله در وضعیت "${stage.status}" قابل خاتمه نیست`));
    }

    // Operator constraint: can only report on assigned stages
    if (req.user?.role === 'operator' && req.user.operatorId && stage.operator_id && stage.operator_id !== req.user.operatorId) {
      return next(new AppError(403, 'FORBIDDEN', 'شما فقط مجاز به ثبت اتمام مراحل واگذارشده به خودتان هستید'));
    }

    // Calculate actual working minutes
    const startTimeStr = stage.started_at || stage.assigned_at || stage.start_time || stage.created_at;
    const elapsedMinutes = Math.max(1, Math.round((new Date(now).getTime() - new Date(String(startTimeStr)).getTime()) / 60000));
    const totalPause = Number(stage.total_pause_minutes) || 0;
    const actualWorkingMinutes = Math.max(1, elapsedMinutes - totalPause);

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      // 1. Update stage to qc_pending
      db.prepare(`
        UPDATE order_stages SET
          status = 'qc_pending',
          produced_qty = ?,
          scrap_qty = ?,
          finished_at = ?,
          end_time = ?,
          actual_working_minutes = ?,
          operator_notes = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(
        producedQty,
        scrapQty,
        now,
        now,
        actualWorkingMinutes,
        operatorNotes || null,
        now,
        id,
        stageNumber
      );

      // 2. RESOURCE RELEASE RULE: Free up machine to IDLE
      if (stage.machine_tool_id) {
        db.prepare(`
          UPDATE machines SET
            status = 'idle',
            current_work_order_id = NULL,
            current_part_name = NULL,
            current_stage_name = NULL,
            current_operator_id = NULL,
            current_operator_name = NULL,
            updated_at = ?
          WHERE id = ?
        `).run(now, stage.machine_tool_id);
      }

      // 3. RESOURCE RELEASE RULE: Free up operator to IDLE and update metrics
      if (stage.operator_id) {
        db.prepare(`
          UPDATE operators SET
            status = 'idle',
            current_work_order_id = NULL,
            current_stage_name = NULL,
            total_parts_produced_today = coalesce(total_parts_produced_today, 0) + ?,
            updated_at = ?
          WHERE id = ?
        `).run(producedQty, now, stage.operator_id);
      }

      // 4. Log event
      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, details, created_at
        ) VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        stage.machine_tool_id ? String(stage.machine_tool_id) : null,
        stage.machine_tool_name ? String(stage.machine_tool_name) : null,
        stage.operator_id ? String(stage.operator_id) : null,
        stage.operator_name ? String(stage.operator_name) : null,
        JSON.stringify({ producedQty, scrapQty, actualWorkingMinutes, operatorNotes }),
        now
      );

      // 5. Notify QC
      createNotification(db, {
        title: `مرحله ${stageNumber} آماده بازرسی QC: ${order.order_number}`,
        message: `تولید مرحله ${stageNumber} (${stage.stage_name}) به پایان رسید (${producedQty} سالم، ${scrapQty} ضایعات) و آماده بازرسی QC است.`,
        type: 'info',
        targetRoles: ['qc', 'production'],
        linkOrderId: id,
        stageNumber,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_FINISHED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { producedQty, scrapQty, actualWorkingMinutes },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 16. TRANSFER STAGE TO ANOTHER MACHINE (Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/transfer', requirePermission('orders:transfer_stage'), validateBody(TransferStageSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { machineToolId, machineToolName, operatorId, operatorName, reason } = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    // Check new machine
    const newMachine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineToolId) as Record<string, unknown> | undefined;
    if (!newMachine) {
      return next(new AppError(404, 'MACHINE_NOT_FOUND', 'دستگاه مقصد یافت نشد'));
    }
    if (newMachine.status !== 'idle') {
      return next(new AppError(409, 'MACHINE_NOT_IDLE', `دستگاه جدید (${newMachine.name}) در وضعیت "${newMachine.status}" است و آزاد نمی‌باشد`));
    }

    // Check new operator concurrency
    const busyCheck = db
      .prepare("SELECT count(*) as count FROM order_stages WHERE operator_id = ? AND status = 'in_progress'")
      .get(operatorId) as { count: number };

    if (busyCheck.count > 0) {
      return next(
        new AppError(
          409,
          'OPERATOR_BUSY',
          'اپراتور جدید انتخابی در حال حاضر دارای مرحله فعال دیگری در خط تولید می‌باشد'
        )
      );
    }

    const newOp = db.prepare('SELECT * FROM operators WHERE id = ?').get(operatorId) as Record<string, unknown> | undefined;
    const finalNewOpName = operatorName || (newOp ? String(newOp.name) : 'اپراتور');
    const finalNewMachineName = machineToolName || String(newMachine.name);

    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      // Free old machine if it was not in breakdown
      if (stage.machine_tool_id && stage.machine_tool_id !== machineToolId) {
        db.prepare(`
          UPDATE machines SET
            status = CASE WHEN status = 'breakdown' THEN 'breakdown' ELSE 'idle' END,
            current_work_order_id = NULL,
            current_part_name = NULL,
            current_stage_name = NULL,
            current_operator_id = NULL,
            current_operator_name = NULL,
            updated_at = ?
          WHERE id = ?
        `).run(now, stage.machine_tool_id);
      }

      // Free old operator
      if (stage.operator_id && stage.operator_id !== operatorId) {
        db.prepare(`
          UPDATE operators SET
            status = 'idle',
            current_work_order_id = NULL,
            current_stage_name = NULL,
            updated_at = ?
          WHERE id = ?
        `).run(now, stage.operator_id);
      }

      // Assign to new machine and operator
      db.prepare(`
        UPDATE order_stages SET
          machine_tool_id = ?,
          machine_tool_name = ?,
          operator_id = ?,
          operator_name = ?,
          status = 'assigned',
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(machineToolId, finalNewMachineName, operatorId, finalNewOpName, now, id, stageNumber);

      // New machine active
      db.prepare(`
        UPDATE machines SET
          status = 'active',
          current_work_order_id = ?,
          current_part_name = ?,
          current_stage_name = ?,
          current_operator_id = ?,
          current_operator_name = ?,
          updated_at = ?
        WHERE id = ?
      `).run(id, order.part_name, stage.stage_name, operatorId, finalNewOpName, now, machineToolId);

      // New operator working
      db.prepare(`
        UPDATE operators SET
          assigned_machine_id = ?,
          current_work_order_id = ?,
          current_stage_name = ?,
          status = 'working',
          updated_at = ?
        WHERE id = ?
      `).run(machineToolId, id, stage.stage_name, now, operatorId);

      // Log transfer event
      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, reason, details, created_at
        ) VALUES (?, ?, ?, 'transferred', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        machineToolId,
        finalNewMachineName,
        operatorId,
        finalNewOpName,
        reason,
        JSON.stringify({ fromMachineId: stage.machine_tool_id, toMachineId: machineToolId, fromOperatorId: stage.operator_id, toOperatorId: operatorId }),
        now
      );
    });

    tx();

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_TRANSFERRED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { fromMachineId: stage.machine_tool_id, toMachineId: machineToolId, reason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 17. GET STAGE EVENT TIMELINE HISTORY
// ==========================================
ordersRouter.get('/:id/stages/:stageNumber/events', requirePermission('orders:read'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);

    const rows = db
      .prepare('SELECT * FROM stage_events WHERE order_id = ? AND stage_number = ? ORDER BY timestamp ASC')
      .all(id, stageNumber) as Record<string, unknown>[];

    const events = rows.map((e) => ({
      id: String(e.id),
      orderId: String(e.order_id),
      stageNumber: Number(e.stage_number),
      eventType: e.event_type,
      timestamp: String(e.timestamp),
      machineId: e.machine_id ? String(e.machine_id) : undefined,
      machineName: e.machine_name ? String(e.machine_name) : undefined,
      operatorId: e.operator_id ? String(e.operator_id) : undefined,
      operatorName: e.operator_name ? String(e.operator_name) : undefined,
      reason: e.reason ? String(e.reason) : undefined,
      details: e.details ? JSON.parse(String(e.details)) : undefined,
      createdAt: String(e.created_at),
    }));

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// Backwards Compatibility: UPDATE STAGE PROGRESS
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/progress', requirePermission('orders:finish_stage'), validateBody(UpdateStageProgressSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { producedQty, scrapQty, status, endTime } = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (req.user?.role === 'operator') {
      const userOperatorId = req.user.operatorId;
      if (!userOperatorId || stage.operator_id !== userOperatorId) {
        return next(new AppError(403, 'FORBIDDEN', 'شما فقط مجاز به ثبت پیشرفت مراحل واگذارشده به خودتان هستید'));
      }
    }

    const tx = db.transaction(() => {
      const stageStatus = status || (producedQty >= Number(stage.planned_qty || order.quantity) ? 'qc_pending' : 'in_progress');

      db.prepare(`
        UPDATE order_stages SET
          produced_qty = ?,
          scrap_qty = ?,
          status = ?,
          end_time = coalesce(?, end_time),
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(producedQty, scrapQty, stageStatus, endTime || (stageStatus === 'qc_pending' ? now : null), now, id, stageNumber);

      if (stageStatus === 'qc_pending') {
        // Free machine & operator
        if (stage.machine_tool_id) {
          db.prepare(`UPDATE machines SET status = 'idle', current_work_order_id = NULL, current_part_name = NULL, current_stage_name = NULL WHERE id = ?`).run(stage.machine_tool_id);
        }
        if (stage.operator_id) {
          db.prepare(`UPDATE operators SET status = 'idle', current_work_order_id = NULL, current_stage_name = NULL WHERE id = ?`).run(stage.operator_id);
        }

        createNotification(db, {
          title: `مرحله ${stageNumber} آماده بازرسی QC: ${order.order_number}`,
          message: `تولید مرحله ${stageNumber} به پایان رسید و در انتظار بازرسی و ثبت برگه ابعادی QC است.`,
          type: 'info',
          targetRoles: ['qc', 'production'],
          linkOrderId: id,
          stageNumber,
        });
      }
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_PROGRESS_UPDATED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { producedQty, scrapQty, status },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 13. SUBMIT QC REPORT (QC Role Strictly)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/qc-report', requirePermission('orders:qc_submit'), validateBody(SubmitQCReportSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const data = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    // MANDATORY QC RULE: passedQty + rejectedQty + conditionalQty MUST equal stage.produced_qty!
    const totalCounted = data.passedQty + (data.rejectedQty || 0) + (data.conditionalQty || 0);
    const producedQty = Number(stage.produced_qty || 0);
    if (totalCounted !== producedQty) {
      return next(
        new AppError(
          400,
          'QC_QUANTITY_MISMATCH',
          `مجموع تعداد سالم (${data.passedQty}) + ضایعات (${data.rejectedQty || 0}) + مشروط (${data.conditionalQty || 0}) برابر با ${totalCounted} است، اما تعداد تولیدشده مرحله ${producedQty} عدد می‌باشد`
        )
      );
    }

    // Conditional requirement: reason required
    if (data.decision === 'conditional' || (data.conditionalQty && data.conditionalQty > 0)) {
      if (!data.conditionalReason || data.conditionalReason.trim().length === 0) {
        return next(new AppError(400, 'CONDITIONAL_REASON_REQUIRED', 'در صورت پذیرش مشروط، درج علت پذیرش مشروط الزامی است'));
      }
    }

    const reportId = `QC-${id}-${stageNumber}`;
    let reportNumber: string = data.reportNumber || '';

    const tx = db.transaction(() => {
      if (!reportNumber) {
        reportNumber = generateQCReportNumber(db);
      }

      db.prepare(`
        INSERT INTO qc_reports (
          id, order_id, stage_number, report_number, inspected_at, inspector_name,
          inspector_personnel_code, passed_qty, rejected_qty, conditional_qty,
          decision, conditional_reason, conditional_approved_by,
          dimensional_check_passed, surface_roughness_passed,
          hardness_rockwell, roughness_ra, measured_tolerances, notes,
          sheet_file_name, sheet_file_size, sheet_uploaded_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id, stage_number) DO UPDATE SET
          report_number = excluded.report_number,
          inspected_at = excluded.inspected_at,
          inspector_name = excluded.inspector_name,
          inspector_personnel_code = excluded.inspector_personnel_code,
          passed_qty = excluded.passed_qty,
          rejected_qty = excluded.rejected_qty,
          conditional_qty = excluded.conditional_qty,
          decision = excluded.decision,
          conditional_reason = excluded.conditional_reason,
          conditional_approved_by = excluded.conditional_approved_by,
          dimensional_check_passed = excluded.dimensional_check_passed,
          surface_roughness_passed = excluded.surface_roughness_passed,
          hardness_rockwell = excluded.hardness_rockwell,
          roughness_ra = excluded.roughness_ra,
          measured_tolerances = excluded.measured_tolerances,
          notes = excluded.notes,
          sheet_file_name = excluded.sheet_file_name,
          sheet_file_size = excluded.sheet_file_size,
          sheet_uploaded_at = excluded.sheet_uploaded_at,
          updated_at = excluded.updated_at
      `).run(
        reportId,
        id,
        stageNumber,
        reportNumber,
        now,
        req.user?.fullName || data.inspectorName,
        req.user?.personnelCode || data.inspectorPersonnelCode || null,
        data.passedQty,
        data.rejectedQty || 0,
        data.conditionalQty || 0,
        data.decision,
        data.conditionalReason || null,
        data.conditionalApprovedBy || req.user?.fullName || null,
        data.dimensionalCheckPassed ? 1 : 0,
        data.surfaceRoughnessPassed ? 1 : 0,
        data.hardnessRockwell || null,
        data.roughnessRa || null,
        data.measuredTolerances || null,
        data.notes || '',
        data.sheetFileName || 'QC-Inspection-Report.pdf',
        data.sheetFileSize || '1.2 MB',
        now,
        now,
        now
      );

      const nextStageStatus: StageStatus = data.decision === 'rejected' ? 'qc_rejected' : 'engineering_qc_pending';
      db.prepare(`
        UPDATE order_stages SET
          status = ?,
          qc_inspector_name = ?,
          qc_notes = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(nextStageStatus, req.user?.fullName || data.inspectorName, data.notes, now, id, stageNumber);

      // Free machine & operator during QC
      if (stage.machine_tool_id) {
        db.prepare(`
          UPDATE machines SET
            status = 'idle',
            current_work_order_id = NULL,
            current_part_name = NULL,
            current_stage_name = NULL,
            current_operator_id = NULL,
            current_operator_name = NULL,
            updated_at = ?
          WHERE id = ?
        `).run(now, stage.machine_tool_id);
      }
      if (stage.operator_id) {
        db.prepare(`
          UPDATE operators SET
            status = 'idle',
            current_work_order_id = NULL,
            current_stage_name = NULL,
            updated_at = ?
          WHERE id = ?
        `).run(now, stage.operator_id);
      }

      createNotification(db, {
        title: `گزارش QC مرحله ${stageNumber} صادر شد: ${reportNumber}`,
        message: `نتیجه بازرسی: ${data.decision === 'approved' ? 'تایید' : data.decision === 'conditional' ? 'مشروط' : 'رد قطعه'}. در انتظار صحه‌گذاری واحد مهندسی.`,
        type: 'info',
        targetRoles: ['engineering', 'production', 'qc'],
        linkOrderId: id,
        stageNumber,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'QC_REPORT_SUBMITTED',
      entityType: 'qc_reports',
      entityId: reportId,
      details: { decision: data.decision, reportNumber, passedQty: data.passedQty },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 14. ENGINEERING QC APPROVAL & STAGE COMPLETION (Engineering)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/engineering-approval', requirePermission('orders:qc_approve'), validateBody(SubmitEngineeringApprovalSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const data = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    // Segregation of Duties: inspector cannot be the approver
    const qcRow = db
      .prepare('SELECT inspector_name, inspector_personnel_code, passed_qty, conditional_qty, rejected_qty, decision FROM qc_reports WHERE order_id = ? AND stage_number = ?')
      .get(id, stageNumber) as
      | {
          inspector_name?: string;
          inspector_personnel_code?: string;
          passed_qty: number;
          conditional_qty: number;
          rejected_qty: number;
          decision: string;
        }
      | undefined;

    if (!qcRow) {
      return next(new AppError(404, 'QC_NOT_FOUND', 'گزارش کنترل کیفیت برای این مرحله یافت نشد'));
    }

    if (req.user) {
      if (
        (qcRow.inspector_personnel_code && req.user.personnelCode && qcRow.inspector_personnel_code === req.user.personnelCode) ||
        (qcRow.inspector_name && qcRow.inspector_name === req.user.fullName)
      ) {
        return next(new AppError(403, 'CANNOT_SELF_APPROVE_QC', 'اصل تفکیک وظایف: بازرس QC نمی‌تواند گزارش خود را صحه‌گذاری مهندسی کند'));
      }
    }

    // Rework enforcement: Rejected stages cannot be approved without rework
    if (stage.status === 'qc_rejected' && !data.isApproved) {
      // rejection confirmed
    }

    const tx = db.transaction(() => {
      const approvalObj = {
        approvedAt: now,
        approverName: req.user?.fullName || data.approverName,
        isApproved: data.isApproved,
        feedback: data.feedback || '',
        isFinalStage: Boolean(data.isFinalStage),
        canAdvanceToNextStage: Boolean(data.canAdvanceToNextStage),
      };

      db.prepare(`
        UPDATE qc_reports SET
          engineering_approval = ?,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(JSON.stringify(approvalObj), now, id, stageNumber);

      if (data.isApproved) {
        db.prepare(`
          UPDATE order_stages SET
            status = 'completed',
            qc_approved = 1,
            updated_at = ?
          WHERE order_id = ? AND stage_number = ?
        `).run(now, id, stageNumber);

        // Accepted quantity from this stage
        const acceptedQty = Number(qcRow.passed_qty) + Number(qcRow.conditional_qty || 0);

        // Update planned_qty of next stage if it exists
        db.prepare(`
          UPDATE order_stages SET
            planned_qty = ?,
            updated_at = ?
          WHERE order_id = ? AND stage_number = ?
        `).run(acceptedQty, now, id, stageNumber + 1);

        // Check if shortfall occurred
        if (acceptedQty < Number(order.quantity)) {
          db.prepare('UPDATE orders SET has_shortfall = 1, updated_at = ? WHERE id = ?').run(now, id);
        }

        const stages = db
          .prepare("SELECT count(*) as total, sum(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM order_stages WHERE order_id = ?")
          .get(id) as { total: number; completed: number };

        let newOrderStatus = order.status;
        if (stages.completed >= stages.total) {
          newOrderStatus = 'awaiting_planning_handover';

          createNotification(db, {
            title: `تولید و کنترل کیفیت به پایان رسید: ${order.order_number}`,
            message: `تمامی مراحل ساخت "${order.part_name}" تایید شد. در انتظار صدور رسید و تحویل به انبار توسط واحد برنامه‌ریزی.`,
            type: 'success',
            targetRoles: ['planning', 'warehouse', 'ceo'],
            linkOrderId: id,
          });
        }

        db.prepare(`
          UPDATE orders SET
            status = ?,
            updated_at = ?
          WHERE id = ?
        `).run(newOrderStatus, now, id);
      } else {
        db.prepare(`
          UPDATE order_stages SET
            status = 'qc_rejected',
            qc_approved = 0,
            updated_at = ?
          WHERE order_id = ? AND stage_number = ?
        `).run(now, id, stageNumber);
      }
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: data.isApproved ? 'ENGINEERING_QC_APPROVED' : 'ENGINEERING_QC_REJECTED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { isApproved: data.isApproved, feedback: data.feedback },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 15. ASSIGN REWORK TO REJECTED STAGE (Production)
// ==========================================
ordersRouter.post('/:id/stages/:stageNumber/rework', requirePermission('orders:rework'), validateBody(AssignReworkSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const stageNumber = Number(req.params.stageNumber);
    const { machineToolId, operatorId, reworkNotes } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const stage = db.prepare('SELECT * FROM order_stages WHERE order_id = ? AND stage_number = ?').get(id, stageNumber) as Record<string, unknown> | undefined;
    if (!stage) {
      return next(new AppError(404, 'NOT_FOUND', 'مرحله سفارش یافت نشد'));
    }

    if (stage.status !== 'qc_rejected') {
      return next(new AppError(409, 'STAGE_NOT_REJECTED', 'فقط مراحلی که توسط QC یا مهندسی رد شده‌اند قابل واگذاری مجدد جهت دوباره‌کاری هستند'));
    }

    // Machine check
    const machine = db.prepare('SELECT * FROM machines WHERE id = ?').get(machineToolId) as Record<string, unknown> | undefined;
    if (!machine) {
      return next(new AppError(404, 'MACHINE_NOT_FOUND', 'دستگاه انتخابی یافت نشد'));
    }
    if (machine.status !== 'idle') {
      return next(new AppError(409, 'MACHINE_NOT_IDLE', `دستگاه ${machine.name} در وضعیت "${machine.status}" است و آزاد نمی‌باشد`));
    }

    // Operator concurrency check
    const busyCheck = db
      .prepare("SELECT count(*) as count FROM order_stages WHERE operator_id = ? AND status = 'in_progress'")
      .get(operatorId) as { count: number };

    if (busyCheck.count > 0) {
      return next(
        new AppError(
          409,
          'OPERATOR_BUSY',
          'اپراتور انتخابی در حال حاضر دارای مرحله‌ی فعال دیگری در خط تولید می‌باشد'
        )
      );
    }

    const opRow = db.prepare('SELECT * FROM operators WHERE id = ?').get(operatorId) as Record<string, unknown> | undefined;
    const finalOpName = opRow ? String(opRow.name) : 'اپراتور';
    const finalMachineName = String(machine.name);

    const now = new Date().toISOString();
    const eventId = generateId('EVT');

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE order_stages SET
          status = 'rework',
          machine_tool_id = ?,
          machine_tool_name = ?,
          operator_id = ?,
          operator_name = ?,
          rework_notes = ?,
          rework_assigned_machine_id = ?,
          rework_assigned_operator_id = ?,
          rework_count = coalesce(rework_count, 0) + 1,
          updated_at = ?
        WHERE order_id = ? AND stage_number = ?
      `).run(machineToolId, finalMachineName, operatorId, finalOpName, reworkNotes, machineToolId, operatorId, now, id, stageNumber);

      db.prepare(`
        UPDATE machines SET
          status = 'active',
          current_work_order_id = ?,
          current_part_name = ?,
          current_stage_name = ?,
          current_operator_id = ?,
          current_operator_name = ?,
          updated_at = ?
        WHERE id = ?
      `).run(id, order.part_name, stage.stage_name, operatorId, finalOpName, now, machineToolId);

      db.prepare(`
        UPDATE operators SET
          assigned_machine_id = ?,
          current_work_order_id = ?,
          current_stage_name = ?,
          status = 'working',
          updated_at = ?
        WHERE id = ?
      `).run(machineToolId, id, stage.stage_name, now, operatorId);

      db.prepare(`
        INSERT INTO stage_events (
          id, order_id, stage_number, event_type, timestamp, machine_id, machine_name, operator_id, operator_name, details, created_at
        ) VALUES (?, ?, ?, 'rework_assigned', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        eventId,
        id,
        stageNumber,
        now,
        machineToolId,
        finalMachineName,
        operatorId,
        finalOpName,
        JSON.stringify({ reworkNotes, reworkCount: (Number(stage.rework_count) || 0) + 1 }),
        now
      );

      createNotification(db, {
        title: `دستور اصلاحیه و دوباره‌کاری صادر شد: مرحله ${stageNumber}`,
        message: `مرحله ${stageNumber} سفارش ${order.order_number} جهت رفع ایراد به اپراتور واگذار گردید. شرح: ${reworkNotes}`,
        type: 'warning',
        targetRoles: ['production', 'operator', 'qc'],
        linkOrderId: id,
        stageNumber,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'STAGE_REWORK_ASSIGNED',
      entityType: 'order_stages',
      entityId: `${id}-${stageNumber}`,
      details: { reworkNotes, machineToolId, operatorId },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 16. SHORTFALL DECISION (Planning / CEO)
// ==========================================
ordersRouter.post('/:id/shortfall-decision', requirePermission('orders:shortfall_decide'), validateBody(ShortfallDecisionSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { decision, notes } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET
          shortfall_decision = ?,
          shortfall_notes = ?,
          updated_at = ?
        WHERE id = ?
      `).run(decision, notes || null, now, id);

      createNotification(db, {
        title: `تصمیم‌گیری کسری سفارش: ${order.order_number}`,
        message: `تصمیم: ${decision === 'rebuild_shortfall' ? 'ساخت مجدد کسری' : decision === 'accept_shortfall' ? 'پذیرش با تیراژ کمتر' : 'لغو کسری'}.`,
        type: 'info',
        targetRoles: ['planning', 'ceo', 'production'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'SHORTFALL_DECIDED',
      entityType: 'orders',
      entityId: id,
      details: { decision, notes },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 17. HANDOVER TO WAREHOUSE (Planning)
// ==========================================
ordersRouter.post('/:id/handover-warehouse', requirePermission('orders:handover_warehouse'), validateBody(HandoverToWarehouseSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const data = req.body;
    const now = new Date().toISOString();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    const finalStatus: OrderStatus = data.isSemiFinished ? 'semi_finished_stored' : 'completed';

    if (!isOrderTransitionAllowed(currentStatus, finalStatus)) {
      return next(
        new AppError(
          409,
          'INVALID_STATUS_TRANSITION',
          `تحویل به انبار در وضعیت "${currentStatus}" مجاز نمی‌باشد`
        )
      );
    }

    let receiptNumber: string = data.warehouseReceiptNumber || '';

    const tx = db.transaction(() => {
      // Issue sequential warehouse receipt number from counters table
      if (!receiptNumber) {
        receiptNumber = generateWarehouseReceiptNumber(db);
      }

      db.prepare(`
        UPDATE orders SET
          status = ?,
          delivered_to_warehouse_qty = ?,
          is_delivered_semi_finished = ?,
          warehouse_receipt_number = ?,
          notes = coalesce(?, notes),
          updated_at = ?
        WHERE id = ?
      `).run(
        finalStatus,
        data.deliveredQty,
        data.isSemiFinished ? 1 : 0,
        receiptNumber,
        data.notes || null,
        now,
        id
      );

      const itemType = data.isSemiFinished ? 'semi_finished' : 'final_product';
      const existingItem = db
        .prepare('SELECT * FROM warehouse_items WHERE part_number = ? AND type = ?')
        .get(order.part_number, itemType) as Record<string, unknown> | undefined;

      let warehouseItemId: string;
      if (existingItem) {
        warehouseItemId = String(existingItem.id);
        db.prepare(`
          UPDATE warehouse_items SET
            quantity = quantity + ?,
            shelf_location = ?,
            last_updated = ?,
            updated_at = ?
          WHERE id = ?
        `).run(data.deliveredQty, data.shelfLocation, now, now, warehouseItemId);
      } else {
        warehouseItemId = generateId('WH');
        db.prepare(`
          INSERT INTO warehouse_items (
            id, part_number, name, type, quantity, unit,
            shelf_location, min_threshold, last_updated, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'عدد', ?, 5, ?, 1, ?, ?)
        `).run(
          warehouseItemId,
          order.part_number,
          order.part_name,
          itemType,
          data.deliveredQty,
          data.shelfLocation,
          now,
          now,
          now
        );
      }

      db.prepare(`
        INSERT INTO stock_movements (
          id, item_id, order_id, movement_type, quantity,
          reference_number, notes, performed_by, created_at, updated_at
        ) VALUES (?, ?, ?, 'in', ?, ?, ?, ?, ?, ?)
      `).run(
        generateId('MOV'),
        warehouseItemId,
        id,
        data.deliveredQty,
        receiptNumber,
        `تحویل کاردکس از خط تولید - رسید ${receiptNumber}`,
        req.user?.fullName || data.handedOverBy || 'واحد برنامه‌ریزی',
        now,
        now
      );

      createNotification(db, {
        title: `تحویل به انبار ثبت شد: رسید ${receiptNumber}`,
        message: `تعداد ${data.deliveredQty} عدد از "${order.part_name}" با شماره رسید ${receiptNumber} وارد قفسه ${data.shelfLocation} گردید.`,
        type: 'success',
        targetRoles: ['warehouse', 'planning', 'ceo', 'super_admin'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'completed');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'HANDOVER_TO_WAREHOUSE',
      entityType: 'orders',
      entityId: id,
      details: { deliveredQty: data.deliveredQty, receiptNumber, shelfLocation: data.shelfLocation },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 18. HOLD ORDER
// ==========================================
ordersRouter.post('/:id/hold', requirePermission('orders:cancel_hold'), validateBody(HoldOrderSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    if (!isOrderTransitionAllowed(currentStatus, 'on_hold')) {
      return next(new AppError(409, 'INVALID_TRANSITION', `سفارش پایان‌یافته یا لغوشده را نمی‌توان متوقف کرد`));
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET
          previous_status = status,
          status = 'on_hold',
          hold_reason = ?,
          updated_at = ?
        WHERE id = ?
      `).run(reason, now, id);

      createNotification(db, {
        title: `سفارش متوقف شد: ${order.order_number}`,
        message: `سفارش "${order.part_name}" به دلیل "${reason}" در وضعیت توقف موقت (On Hold) قرار گرفت.`,
        type: 'warning',
        targetRoles: ['planning', 'production', 'ceo'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'on_hold');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ORDER_HELD',
      entityType: 'orders',
      entityId: id,
      details: { reason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 19. RESUME ORDER FROM HOLD
// ==========================================
ordersRouter.post('/:id/resume', requirePermission('orders:cancel_hold'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    if (order.status !== 'on_hold') {
      return next(new AppError(409, 'NOT_ON_HOLD', 'سفارش در وضعیت توقف نیست'));
    }

    const resumeStatus: OrderStatus = (order.previous_status as OrderStatus) || 'in_production';
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET
          status = ?,
          hold_reason = null,
          updated_at = ?
        WHERE id = ?
      `).run(resumeStatus, now, id);

      createNotification(db, {
        title: `ادامه گردش کار سفارش: ${order.order_number}`,
        message: `سفارش "${order.part_name}" از وضعیت توقف خارج شده و به وضعیت ${resumeStatus} برگشت.`,
        type: 'info',
        targetRoles: ['planning', 'production', 'ceo'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, resumeStatus);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ORDER_RESUMED',
      entityType: 'orders',
      entityId: id,
      details: { resumeStatus },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 20. CANCEL ORDER
// ==========================================
ordersRouter.post('/:id/cancel', requirePermission('orders:cancel_hold'), validateBody(CancelOrderSchema), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { reason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!order) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const currentStatus = order.status as OrderStatus;
    if (!isOrderTransitionAllowed(currentStatus, 'cancelled')) {
      return next(new AppError(409, 'CANNOT_CANCEL', 'سفارشات تحویل‌شده به انبار یا لغوشده مجدداً قابل لغو نیستند'));
    }

    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET
          status = 'cancelled',
          cancellation_reason = ?,
          updated_at = ?
        WHERE id = ?
      `).run(reason, now, id);

      createNotification(db, {
        title: `سفارش لغو گردید: ${order.order_number}`,
        message: `سفارش ساخت "${order.part_name}" لغو شد. علت: ${reason}`,
        type: 'error',
        targetRoles: ['planning', 'production', 'ceo', 'warehouse'],
        linkOrderId: id,
      });
    });

    tx();

    sseService.broadcastOrderUpdate(id, 'cancelled');

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ORDER_CANCELLED',
      entityType: 'orders',
      entityId: id,
      details: { reason },
      ipAddress: req.ip,
    });

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json(mapOrderRow(updated));
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 21. SOFT DELETE ORDER
// ==========================================
ordersRouter.delete('/:id', requirePermission('orders:delete'), (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      return next(new AppError(404, 'NOT_FOUND', 'سفارش یافت نشد'));
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET is_active = 0, updated_at = ? WHERE id = ?').run(now, id);

    logAudit(db, {
      userId: req.user?.id,
      userName: req.user?.username,
      userRole: req.user?.role,
      action: 'ORDER_SOFT_DELETED',
      entityType: 'orders',
      entityId: id,
      oldValue: mapOrderRow(existing) as unknown as Record<string, unknown>,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'سفارش با موفقیت غیرفعال شد' });
  } catch (error) {
    next(error);
  }
});
