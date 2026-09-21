export type UserRole = 
  | 'super_admin'   // سوپر ادمین: تعریف اطلاعات پایه، BOM، ماشین‌آلات، کاربران
  | 'ceo'           // مدیرعامل: صدور سفارش، تایید/رد پیش‌فاکتور، داشبورد کلان، سفارش دستی
  | 'planning'      // مدیر برنامه‌ریزی: بررسی سفارش‌ها، استعلام قیمت، صدور PO، مانیتورینگ PO و ماشین‌ها
  | 'engineering'   // واحد مهندسی: بارگذاری نقشه‌ها و فایل‌های STEP مراحل، تایید فنی و تاییدیه گزارش QC
  | 'qc'            // کنترل کیفیت: بازرسی فنی، پرکردن و بارگذاری برگه کنترل کیفیت
  | 'production'    // مدیر تولید: تخصیص دستور کارها به ماشین‌ها و اپراتورها، مانیتورینگ زنده کارگاه
  | 'operator'      // اپراتور: دریافت کار، ثبت زمان شروع، ثبت قطعات، اعلام خرابی دستگاه
  | 'warehouse';    // انبار: تحویل‌گیری قطعات کامل، نیمه‌ساخته و مدیریت کاردکس

export interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  type: 'finished_part' | 'semi_finished' | 'raw_casting' | 'bought_out';
  quantity: number;
  unit: string;
  minThreshold: number;
  locationRack: string;
  lastUpdated: string;
}

export type Priority = 'normal' | 'urgent' | 'emergency';

export type MachineStatus = 'active' | 'idle' | 'breakdown' | 'maintenance';

export type MachineType = 'internal' | 'outsourced';

export type DowntimeCategory =
  | 'mechanical'
  | 'electrical'
  | 'tooling'
  | 'hydraulic'
  | 'software_cnc'
  | 'operator_error'
  | 'other';

export type MaintenanceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'overhaul';

export interface MachineTool {
  id: string;
  name: string;
  code: string;
  type: MachineType;
  category: 'grinder' | 'manual_lathe' | 'cnc_lathe' | 'gantry_mill' | 'boring' | 'carousel' | 'outsourced_wirecut' | 'outsourced_lap' | 'outsourced_cylindrical_grind';
  status: MachineStatus;
  currentWorkOrderId?: string;
  currentPartName?: string;
  currentStageName?: string;
  currentOperatorId?: string;
  currentOperatorName?: string;
  breakdownReason?: string;
  breakdownReportedAt?: string;
  location: string;
  specifications: string;
  lastMaintenanceDate: string;
  healthPercent?: number;
  totalDowntimeMinutes30Days?: number;
  downtimeCount30Days?: number;
  mttrMinutes?: number;
  mtbfHours?: number;
  nextMaintenanceDate?: string;
  activeDowntimeId?: string;
  image?: string;
  imageUrl?: string;
}

export interface DowntimeEvent {
  id: string;
  machineId: string;
  machineName?: string;
  machineCode?: string;
  orderId?: string;
  stageNumber?: number;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  reason: string;
  category: DowntimeCategory;
  reportedBy: string;
  reportedById?: string;
  resolvedBy?: string;
  resolvedById?: string;
  repairNotes?: string;
  sparePartsUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlan {
  id: string;
  machineId: string;
  machineName?: string;
  machineCode?: string;
  title: string;
  type: MaintenanceType;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  checklist: string[];
  technicianName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StageEvent {
  id: string;
  orderId: string;
  stageNumber: number;
  eventType: 'assigned' | 'started' | 'paused' | 'resumed' | 'completed' | 'transferred' | 'rework_assigned';
  timestamp: string;
  machineId?: string;
  machineName?: string;
  operatorId?: string;
  operatorName?: string;
  reason?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  department: string;
  personnelCode: string;
  phone?: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  operatorId?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface ManufacturingStageDefinition {
  stageNumber: number;
  name: string;
  description: string;
  defaultMachineCategoryId: string;
  estimatedMinutes: number;
  requiredDrawingType: string;
  isOutsourced: boolean;
  qcCheckpoints: string[];
  pdfDrawingFileName?: string;
  stepFileName?: string;
  updatedAt?: string;
}

export interface PartDefinition {
  id: string;
  partNumber: string;
  name: string;
  nameEn: string;
  machineModelId: string;
  category: 'manufactured' | 'imported' | 'bought_out' | 'casting';
  material: string;
  rawWeightKg: number;
  finishedWeightKg: number;
  stockQty: number;
  minStockAlert: number;
  defaultStages: ManufacturingStageDefinition[];
  defaultDrawingName?: string;
  defaultStepFileName?: string;
  supplierName?: string;
  notes?: string;
  image?: string;
  imageUrl?: string;
}

export interface CompressorModel {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: 'screw' | 'lobe' | 'booster';
  capacityM3Min: number;
  workingPressureBar: number;
  motorPowerKw: number;
  coolingType: string;
  description: string;
  image?: string;
  imageUrl?: string;
  partsCount: number;
  inHouseRatio: number; // e.g. 80
}

export interface Quote {
  id: string;
  orderId: string;
  supplierName: string;
  supplierType: 'foundry' | 'raw_material' | 'outsourcing' | 'importer';
  amountRials: number;
  deliveryTimeDays: number;
  dateSubmitted: string;
  status: 'pending_ceo' | 'approved_by_ceo' | 'rejected_by_ceo';
  attachmentFileName?: string;
  attachmentFileType?: string;
  notes?: string;
  rejectionReason?: string;
  submittedBy: string;
  decidedAt?: string;
}

export interface StageEngineeringDoc {
  id?: string;
  stageNumber: number;
  stageName: string;
  drawingNumber: string;
  drawingFileName?: string;
  drawingFileType?: 'pdf' | 'dwg' | 'image';
  stepFileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByRole?: string;
  uploadedByName?: string;
  isApproved: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  notes?: string;
  cadPreviewData?: {
    primitiveShape: 'cylinder_rotor' | 'casing_block' | 'gear_wheel' | 'shaft' | 'flange_head';
    dimensions: { length: number; diameter: number; extra?: string };
  };
}

export interface StageQCReport {
  reportNumber: string;
  inspectedAt: string;
  inspectorName: string;
  inspectorPersonnelCode?: string;
  passedQty: number;
  rejectedQty: number;
  conditionalQty: number;
  decision: 'approved' | 'conditional' | 'rejected';
  dimensionalCheckPassed: boolean;
  surfaceRoughnessPassed: boolean;
  hardnessRockwell?: string;
  roughnessRa?: string;
  measuredTolerances?: string;
  notes: string;
  sheetFileName: string;
  sheetFileSize?: string;
  sheetUploadedAt?: string;
}

export interface StageEngineeringApproval {
  approvedAt: string;
  approverName: string;
  isApproved: boolean;
  feedback?: string;
  isFinalStage: boolean;
  canAdvanceToNextStage: boolean;
}

export interface StageExecutionProgress {
  stageNumber: number;
  stageName: string;
  machineToolId?: string;
  machineToolName?: string;
  operatorId?: string;
  operatorName?: string;
  status: 'not_started' | 'assigned' | 'in_progress' | 'paused' | 'qc_pending' | 'engineering_qc_pending' | 'completed' | 'qc_rejected' | 'rework';
  startTime?: string;
  endTime?: string;
  assignedAt?: string;
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  finishedAt?: string;
  actualWorkingMinutes?: number;
  totalPauseMinutes?: number;
  pauseReason?: string;
  operatorNotes?: string;
  plannedQty: number;
  producedQty: number;
  scrapQty: number;
  qcApproved: boolean;
  qcInspectorName?: string;
  qcNotes?: string;
  qcReport?: StageQCReport;
  engineeringApproval?: StageEngineeringApproval;
  isOutsourced?: boolean;
  outsourcedVendorName?: string;
  contractorName?: string;
  sentDate?: string;
  expectedReturnDate?: string;
  parallelGroup?: number;
  reworkNotes?: string;
  reworkAssignedMachineId?: string;
  reworkAssignedOperatorId?: string;
  reworkCount?: number;
  estimatedMinutes?: number;
  overrideCategoryReason?: string;
  events?: StageEvent[];
}

export type OrderStatus =
  | 'draft'
  | 'pending_planning'          // در انتظار بررسی و تایید برنامه‌ریزی
  | 'planning_inquiry'          // برنامه‌ریزی در حال استعلام قیمت و دریافت پیش‌فاکتور
  | 'pending_ceo_quote'         // پیش‌فاکتور برای تایید مدیرعامل ارسال شده
  | 'quote_rejected'            // پیش‌فاکتور توسط مدیرعامل رد شده
  | 'material_ordered'          // متریال/ریخته‌گری سفارش داده شده
  | 'material_received_po'      // متریال وارد شرکت شد و PO رسماً صادر گردید
  | 'awaiting_engineering'      // درخواست نقشه و فایل استپ به واحد مهندسی ارسال شد
  | 'engineering_approved'      // نقشه‌ها و فایل‌های STEP بارگذاری و تایید شد
  | 'assigned_to_production'    // توسط مدیر تولید به دستگاه‌ها و اپراتورها واگذار شد
  | 'in_production'             // در حال ماشین‌کاری و ساخت
  | 'awaiting_planning_handover'// ترخیص نهایی توسط QC و مهندسی - در انتظار صدور رسید و تحویل به انبار توسط برنامه‌ریزی
  | 'completed'                 // تحویل نهایی به انبار
  | 'semi_finished_stored';     // تحویل نیمه‌ساخته به انبار

export interface CreateOrderParams {
  title?: string;
  isCustomOrder?: boolean;
  compressorModelId?: string;
  compressorModelName?: string;
  partId?: string;
  partName?: string;
  partNumber?: string;
  quantity: number;
  priority: Priority;
  deadlineDate: string;
  notes?: string;
  createdByRole?: UserRole;
  createdByName?: string;
  customDetails?: {
    partName: string;
    application: string;
    material: string;
    technicalSpecs: string;
    sampleProvided: boolean;
  };
}

export interface CreateQuoteParams {
  supplierName: string;
  supplierType: 'foundry' | 'raw_material' | 'outsourcing' | 'importer';
  amountRials: number;
  deliveryTimeDays: number;
  attachmentFileName?: string;
  attachmentFileType?: string;
  notes?: string;
  submittedBy?: string;
}

export interface ProductionOrder {
  id: string; // e.g. PO-1403-088
  orderNumber: string;
  title: string;
  isCustomOrder: boolean;
  customDetails?: {
    partName: string;
    application: string;
    material: string;
    technicalSpecs: string;
    sampleProvided: boolean;
  };
  compressorModelId?: string;
  compressorModelName?: string;
  partId?: string;
  partName: string;
  partNumber: string;
  quantity: number;
  priority: Priority;
  deadlineDate: string;
  createdDate: string;
  createdByRole: UserRole;
  createdByName: string;
  status: OrderStatus;
  quotes: Quote[];
  engineeringDocs: StageEngineeringDoc[];
  stages: StageExecutionProgress[];
  completionPercentage: number;
  deliveredToWarehouseQty?: number;
  isDeliveredSemiFinished?: boolean;
  warehouseReceiptNumber?: string;
  notes?: string;
}

export interface OperatorProfile {
  id: string;
  name: string;
  personnelCode: string;
  specialty: string;
  assignedMachineId?: string;
  currentWorkOrderId?: string;
  currentStageName?: string;
  shift: 'morning' | 'evening' | 'night';
  totalPartsProducedToday: number;
  status: 'working' | 'idle' | 'on_break';
  image?: string;
  imageUrl?: string;
  avatarUrl?: string;
}

export interface FoundryPartner {
  id: string;
  name: string;
  manager: string;
  phone: string;
  city: string;
  capabilities: string[];
  qualityRating: number;
  activeOrdersCount: number;
  image?: string;
  imageUrl?: string;
  logoUrl?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetRoles: UserRole[];
  createdAt: string;
  isRead: boolean;
  linkOrderId?: string;
}

export interface WarehouseItem {
  id: string;
  partNumber: string;
  name: string;
  type: 'final_product' | 'semi_finished' | 'raw_material' | 'bought_out';
  quantity: number;
  unit: string;
  shelfLocation: string;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  orderId?: string;
  movementType: 'in' | 'out' | 'adjustment' | 'scrap';
  quantity: number;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string;
}
