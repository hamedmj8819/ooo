import { z } from 'zod';
import {
  USER_ROLES,
  ORDER_STATUSES,
  STAGE_STATUSES,
  PRIORITIES,
  MACHINE_STATUSES,
  MACHINE_CATEGORIES,
  DOWNTIME_CATEGORIES,
  MAINTENANCE_TYPES,
  SUPPLIER_TYPES,
  QUOTE_STATUSES,
  QC_DECISIONS,
  WAREHOUSE_ITEM_TYPES,
} from './constants';

export const UserRoleSchema = z.enum(USER_ROLES);
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export const StageStatusSchema = z.enum(STAGE_STATUSES);
export const PrioritySchema = z.enum(PRIORITIES);
export const MachineStatusSchema = z.enum(MACHINE_STATUSES);
export const MachineCategorySchema = z.enum(MACHINE_CATEGORIES);
export const DowntimeCategorySchema = z.enum(DOWNTIME_CATEGORIES);
export const MaintenanceTypeSchema = z.enum(MAINTENANCE_TYPES);
export const SupplierTypeSchema = z.enum(SUPPLIER_TYPES);
export const QuoteStatusSchema = z.enum(QUOTE_STATUSES);
export const QCDecisionSchema = z.enum(QC_DECISIONS);
export const WarehouseItemTypeSchema = z.enum(WAREHOUSE_ITEM_TYPES);

export const CustomOrderDetailsSchema = z.object({
  partName: z.string().min(1, 'نام قطعه الزامی است'),
  application: z.string().default(''),
  material: z.string().default(''),
  technicalSpecs: z.string().default(''),
  sampleProvided: z.boolean().default(false),
});

export const CreateOrderSchema = z.object({
  title: z.string().optional(),
  isCustomOrder: z.boolean().default(false),
  compressorModelId: z.string().optional(),
  compressorModelName: z.string().optional(),
  partId: z.string().optional(),
  partName: z.string().min(1, 'نام قطعه الزامی است'),
  partNumber: z.string().default(''),
  quantity: z.number().int().positive('تعداد باید عدد مثبت باشد'),
  priority: PrioritySchema.default('normal'),
  deadlineDate: z.string().min(1, 'تاریخ سررسید الزامی است'),
  notes: z.string().optional(),
  createdByRole: UserRoleSchema.default('ceo'),
  createdByName: z.string().default('سیستم'),
  customDetails: CustomOrderDetailsSchema.optional(),
});

export const CreateQuoteSchema = z.object({
  supplierName: z.string().min(1, 'نام تامین‌کننده الزامی است'),
  supplierType: SupplierTypeSchema,
  amountRials: z.number().int().nonnegative('مبلغ ریال باید نامنفی باشد'),
  deliveryTimeDays: z.number().int().positive('مدت تحویل باید مثبت باشد'),
  attachmentFileId: z.string().min(1, 'پیوست پیشفاکتور الزامی است'),
  attachmentFileName: z.string().optional(),
  attachmentFileType: z.string().optional(),
  notes: z.string().optional(),
  submittedBy: z.string().default('واحد برنامه‌ریزی'),
});

export const DecideQuoteSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
  decidedBy: z.string().default('مدیرعامل'),
});

export const AssignStageSchema = z.object({
  machineToolId: z.string().optional(),
  machineToolName: z.string().optional(),
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
  isOutsourced: z.boolean().default(false),
  contractorName: z.string().optional(),
  sentDate: z.string().optional(),
  expectedReturnDate: z.string().optional(),
  overrideCategory: z.boolean().default(false),
  overrideCategoryReason: z.string().optional(),
  assignedBy: z.string().default('مدیر تولید'),
});

export const StartStageSchema = z.object({
  operatorId: z.string().optional(),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
});

export const PauseStageSchema = z.object({
  reason: z.string().min(2, 'علت توقف الزامی است'),
});

export const ResumeStageSchema = z.object({
  notes: z.string().optional(),
});

export const FinishStageSchema = z.object({
  producedQty: z.number().int().nonnegative('تعداد تولیدی نمی‌تواند منفی باشد'),
  scrapQty: z.number().int().nonnegative('تعداد ضایعات نمی‌تواند منفی باشد').default(0),
  operatorNotes: z.string().optional(),
  notes: z.string().optional(),
});

export const TransferStageSchema = z.object({
  machineToolId: z.string().min(1, 'شناسه دستگاه جدید الزامی است'),
  machineToolName: z.string().optional(),
  operatorId: z.string().min(1, 'شناسه اپراتور جدید الزامی است'),
  operatorName: z.string().optional(),
  reason: z.string().min(2, 'علت انتقال مرحله الزامی است'),
  overrideCategory: z.boolean().default(false),
  overrideCategoryReason: z.string().optional(),
});

export const ReportBreakdownSchema = z.object({
  reason: z.string().min(2, 'علت خرابی الزامی است'),
  category: DowntimeCategorySchema.default('mechanical'),
  reportedBy: z.string().optional(),
});

export const ResolveBreakdownSchema = z.object({
  repairNotes: z.string().min(2, 'شرح اقدامات تعمیراتی الزامی است'),
  resolvedBy: z.string().optional(),
  sparePartsUsed: z.string().optional(),
});

export const CreateMaintenancePlanSchema = z.object({
  machineId: z.string().min(1, 'شناسه دستگاه الزامی است'),
  title: z.string().min(1, 'عنوان برنامه نگهداری الزامی است'),
  type: MaintenanceTypeSchema.default('monthly'),
  scheduledDate: z.string().min(1, 'تاریخ برنامه الزامی است'),
  checklist: z.array(z.string()).default([]),
  technicianName: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateMaintenancePlanSchema = CreateMaintenancePlanSchema.partial();

export const UpdateStageProgressSchema = z.object({
  producedQty: z.number().int().nonnegative(),
  scrapQty: z.number().int().nonnegative().default(0),
  status: StageStatusSchema.optional(),
  endTime: z.string().optional(),
  operatorNotes: z.string().optional(),
});

export const SubmitQCReportSchema = z.object({
  reportNumber: z.string().optional(),
  inspectorName: z.string().min(1, 'نام بازرس الزامی است'),
  inspectorPersonnelCode: z.string().optional(),
  passedQty: z.number().int().nonnegative(),
  rejectedQty: z.number().int().nonnegative().default(0),
  conditionalQty: z.number().int().nonnegative().default(0),
  decision: QCDecisionSchema,
  dimensionalCheckPassed: z.boolean().default(true),
  surfaceRoughnessPassed: z.boolean().default(true),
  hardnessRockwell: z.string().optional(),
  roughnessRa: z.string().optional(),
  measuredTolerances: z.string().optional(),
  notes: z.string().default(''),
  sheetFileId: z.string().min(1, 'برگه بازرسی QC (فایل واقعی) الزامی است'),
  sheetFileName: z.string().optional(),
  sheetFileSize: z.string().optional(),
});

export const SubmitEngineeringApprovalSchema = z.object({
  approverName: z.string().min(1, 'نام تاییدکننده الزامی است'),
  isApproved: z.boolean(),
  feedback: z.string().optional(),
  isFinalStage: z.boolean().default(false),
  canAdvanceToNextStage: z.boolean().default(true),
});

export const UploadEngineeringDocSchema = z.object({
  stageNumber: z.number().int().positive(),
  stageName: z.string().min(1),
  drawingNumber: z.string().min(1),
  drawingFileId: z.string().min(1, 'شناسه فایل نقشه الزامی است'),
  drawingFileName: z.string().optional(),
  drawingFileType: z.enum(['pdf', 'dwg', 'image']).default('pdf'),
  stepFileId: z.string().optional(),
  stepFileName: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateMachineSchema = z.object({
  name: z.string().min(1, 'نام دستگاه الزامی است'),
  code: z.string().min(1, 'کد دستگاه الزامی است'),
  type: z.enum(['internal', 'outsourced']).default('internal'),
  category: MachineCategorySchema,
  status: MachineStatusSchema.default('idle'),
  location: z.string().default('سالن ماشین‌کاری'),
  specifications: z.string().default(''),
  lastMaintenanceDate: z.string().default(new Date().toISOString()),
  healthPercent: z.number().min(0).max(100).default(100),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const UpdateMachineSchema = CreateMachineSchema.partial();

export const CreateModelSchema = z.object({
  code: z.string().min(1, 'کد مدل الزامی است'),
  name: z.string().min(1, 'نام مدل الزامی است'),
  nameEn: z.string().default(''),
  type: z.enum(['screw', 'lobe', 'booster']).default('screw'),
  capacityM3Min: z.number().nonnegative(),
  workingPressureBar: z.number().nonnegative(),
  motorPowerKw: z.number().nonnegative(),
  coolingType: z.string().default(''),
  description: z.string().default(''),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  partsCount: z.number().int().nonnegative().default(0),
  inHouseRatio: z.number().min(0).max(100).default(80),
});

export const UpdateModelSchema = CreateModelSchema.partial();

export const ManufacturingStageDefinitionSchema = z.object({
  stageNumber: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().default(''),
  defaultMachineCategoryId: z.string().default('cnc_lathe'),
  estimatedMinutes: z.number().int().positive().default(60),
  requiredDrawingType: z.string().default('2D Drawing + STEP'),
  isOutsourced: z.boolean().default(false),
  qcCheckpoints: z.array(z.string()).default([]),
  pdfDrawingFileName: z.string().optional(),
  stepFileName: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreatePartSchema = z.object({
  partNumber: z.string().min(1, 'شماره فنی الزامی است'),
  name: z.string().min(1, 'نام قطعه الزامی است'),
  nameEn: z.string().default(''),
  machineModelId: z.string().min(1, 'مدل دستگاه الزامی است'),
  category: z.enum(['manufactured', 'imported', 'bought_out', 'casting']).default('manufactured'),
  material: z.string().default('فولاد آلیاژی'),
  rawWeightKg: z.number().nonnegative().default(0),
  finishedWeightKg: z.number().nonnegative().default(0),
  stockQty: z.number().int().nonnegative().default(0),
  minStockAlert: z.number().int().nonnegative().default(0),
  defaultStages: z.array(ManufacturingStageDefinitionSchema).default([]),
  defaultDrawingName: z.string().optional(),
  defaultStepFileName: z.string().optional(),
  supplierName: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const UpdatePartSchema = CreatePartSchema.partial();

export const CreateOperatorSchema = z.object({
  name: z.string().min(1, 'نام اپراتور الزامی است'),
  personnelCode: z.string().min(1, 'کد پرسنلی الزامی است'),
  specialty: z.string().min(1, 'تخصص الزامی است'),
  assignedMachineId: z.string().optional(),
  shift: z.enum(['morning', 'evening', 'night']).default('morning'),
  totalPartsProducedToday: z.number().int().nonnegative().default(0),
  status: z.enum(['working', 'idle', 'on_break']).default('idle'),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const UpdateOperatorSchema = CreateOperatorSchema.partial();

export const CreateFoundrySchema = z.object({
  name: z.string().min(1, 'نام تامین‌کننده الزامی است'),
  manager: z.string().default(''),
  phone: z.string().default(''),
  city: z.string().default(''),
  capabilities: z.array(z.string()).default([]),
  qualityRating: z.number().min(0).max(5).default(5.0),
  activeOrdersCount: z.number().int().nonnegative().default(0),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  logoUrl: z.string().optional(),
});

export const UpdateFoundrySchema = CreateFoundrySchema.partial();

export const CreateWarehouseItemSchema = z.object({
  partNumber: z.string().min(1, 'شماره فنی الزامی است'),
  name: z.string().min(1, 'نام کالا الزامی است'),
  type: WarehouseItemTypeSchema,
  quantity: z.number().int().nonnegative().default(0),
  unit: z.string().default('عدد'),
  shelfLocation: z.string().default('A-01'),
  minThreshold: z.number().int().nonnegative().default(0),
});

export const HandoverToWarehouseSchema = z.object({
  deliveredQty: z.number().int().positive('تعداد تحویلی باید مثبت باشد'),
  isSemiFinished: z.boolean().default(false),
  warehouseReceiptNumber: z.string().optional(),
  shelfLocation: z.string().default('WH-A-10'),
  notes: z.string().optional(),
  handedOverBy: z.string().default('واحد برنامه‌ریزی'),
});

export const CreateNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  targetRoles: z.array(UserRoleSchema),
  linkOrderId: z.string().optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1, 'نام کاربری الزامی است'),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'رمز عبور قبلی الزامی است'),
  newPassword: z.string().min(6, 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد'),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  role: UserRoleSchema,
  department: z.string(),
  personnelCode: z.string(),
  phone: z.string().optional(),
  isActive: z.boolean(),
  lastLogin: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
  operatorId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
});

export const AuditQuerySchema = z.object({
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
