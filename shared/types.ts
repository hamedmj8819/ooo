import {
  UserRole,
  OrderStatus,
  StageStatus,
  Priority,
  MachineStatus,
  MachineCategory,
  DowntimeCategory,
  MaintenanceType,
  SupplierType,
  QuoteStatus,
  QCDecision,
  WarehouseItemType,
} from './constants';

export type {
  UserRole,
  OrderStatus,
  StageStatus,
  Priority,
  MachineStatus,
  MachineCategory,
  DowntimeCategory,
  MaintenanceType,
  SupplierType,
  QuoteStatus,
  QCDecision,
  WarehouseItemType,
} from './constants';

export interface SystemUser extends BaseEntity {
  username: string;
  fullName: string;
  role: UserRole;
  department: string;
  personnelCode: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  mustChangePassword?: boolean;
  operatorId?: string;
}

export interface BaseEntity {
  id: string;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
  isActive?: boolean;
}

export interface CompressorModel extends BaseEntity {
  name: string;
  nameEn?: string;
  code: string;
  type: 'screw' | 'piston' | 'centrifugal' | 'lobe' | 'booster';
  capacityM3Min: number;
  workingPressureBar: number;
  motorPowerKw?: number;
  powerKw?: number;
  coolingType?: string;
  description: string;
  partsCount: number;
  inHouseRatio?: number;
  activeOrdersCount?: number;
  image?: string;
  imageUrl?: string;
}

export interface ManufacturingStageDefinition {
  id?: string;
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

export interface PartDefinition extends BaseEntity {
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

export interface MachineTool extends BaseEntity {
  name: string;
  code: string;
  type: 'internal' | 'outsourced';
  category: MachineCategory;
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

export interface DowntimeEvent extends BaseEntity {
  machineId: string;
  machineName?: string;
  machineCode?: string;
  orderId?: string;
  stageNumber?: number;
  startTime: string; // ISO-8601 UTC
  endTime?: string; // ISO-8601 UTC
  durationMinutes?: number;
  reason: string;
  category: DowntimeCategory;
  reportedBy: string;
  reportedById?: string;
  resolvedBy?: string;
  resolvedById?: string;
  repairNotes?: string;
  sparePartsUsed?: string;
}

export interface MaintenancePlan extends BaseEntity {
  machineId: string;
  machineName?: string;
  machineCode?: string;
  title: string;
  type: MaintenanceType;
  scheduledDate: string; // ISO-8601 UTC
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  checklist: string[];
  technicianName?: string;
  notes?: string;
}

export interface StageEvent extends BaseEntity {
  orderId: string;
  stageNumber: number;
  eventType: 'assigned' | 'started' | 'paused' | 'resumed' | 'completed' | 'transferred' | 'rework_assigned';
  timestamp: string; // ISO-8601 UTC
  machineId?: string;
  machineName?: string;
  operatorId?: string;
  operatorName?: string;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface OperatorProfile extends BaseEntity {
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

export interface FoundryPartner extends BaseEntity {
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

export interface Quote extends BaseEntity {
  orderId: string;
  supplierName: string;
  supplierType: SupplierType;
  amountRials: number; // Integer
  deliveryTimeDays: number;
  dateSubmitted: string; // ISO-8601 UTC
  status: QuoteStatus;
  attachmentFileName?: string;
  attachmentFileType?: string;
  notes?: string;
  rejectionReason?: string;
  submittedBy: string;
  decidedAt?: string;
}

export interface StageEngineeringDoc extends BaseEntity {
  orderId?: string;
  stageNumber: number;
  stageName: string;
  drawingNumber: string;
  drawingFileName?: string;
  drawingFileType?: 'pdf' | 'dwg' | 'image';
  stepFileName?: string;
  uploadedAt: string; // ISO-8601 UTC
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

export interface StageQCReport extends BaseEntity {
  orderId?: string;
  stageNumber: number;
  reportNumber: string;
  inspectedAt: string; // ISO-8601 UTC
  inspectorName: string;
  inspectorPersonnelCode?: string;
  passedQty: number;
  rejectedQty: number;
  conditionalQty: number;
  decision: QCDecision;
  conditionalReason?: string;
  conditionalApprovedBy?: string;
  dimensionalCheckPassed: boolean;
  surfaceRoughnessPassed: boolean;
  hardnessRockwell?: string;
  roughnessRa?: string;
  measuredTolerances?: string;
  notes: string;
  sheetFileName: string;
  sheetFileSize?: string;
  sheetUploadedAt?: string;
  engineeringApproval?: StageEngineeringApproval;
}

export interface StageEngineeringApproval {
  approvedAt: string; // ISO-8601 UTC
  approverName: string;
  isApproved: boolean;
  feedback?: string;
  isFinalStage: boolean;
  canAdvanceToNextStage: boolean;
}

export interface StageExecutionProgress extends BaseEntity {
  orderId?: string;
  stageNumber: number;
  stageName: string;
  machineToolId?: string;
  machineToolName?: string;
  operatorId?: string;
  operatorName?: string;
  status: StageStatus;
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

export interface CustomOrderDetails {
  partName: string;
  application: string;
  material: string;
  technicalSpecs: string;
  sampleProvided: boolean;
}

export interface ProductionOrder extends BaseEntity {
  orderNumber: string;
  poNumber?: string;
  title: string;
  isCustomOrder: boolean;
  customDetails?: CustomOrderDetails;
  compressorModelId?: string;
  compressorModelName?: string;
  partId?: string;
  partName: string;
  partNumber: string;
  quantity: number;
  priority: Priority;
  deadlineDate: string; // ISO-8601 UTC
  createdDate: string; // ISO-8601 UTC
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
  holdReason?: string;
  cancellationReason?: string;
  quoteRejectionReason?: string;
  hasShortfall?: boolean;
  shortfallDecision?: string;
  shortfallNotes?: string;
  previousStatus?: OrderStatus;
  // Computed server-side metrics
  isOverdue?: boolean;
  daysRemaining?: number;
  urgencyLevel?: 'normal' | 'warning' | 'critical';
}

export interface WarehouseItem extends BaseEntity {
  partNumber: string;
  name: string;
  type: WarehouseItemType;
  quantity: number;
  unit: string;
  shelfLocation: string;
  minThreshold: number;
  lastUpdated: string;
}

export interface StockMovement extends BaseEntity {
  itemId: string;
  orderId?: string;
  movementType: 'in' | 'out' | 'adjustment' | 'scrap';
  quantity: number;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
}

export interface SystemNotification extends BaseEntity {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetRoles: UserRole[];
  isRead: boolean;
  linkOrderId?: string;
}

export interface SystemFileRecord extends BaseEntity {
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
  storagePath: string;
  category: 'drawing' | 'step' | 'qc_sheet' | 'quote_attachment' | 'image';
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
}

export interface AuditLogEntry extends BaseEntity {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

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
  deadlineDate: string; // ISO-8601 UTC
  notes?: string;
  createdByRole?: UserRole;
  createdByName?: string;
  customDetails?: CustomOrderDetails;
}

export interface CreateQuoteParams {
  supplierName: string;
  supplierType: SupplierType;
  amountRials: number;
  deliveryTimeDays: number;
  attachmentFileName?: string;
  attachmentFileType?: string;
  notes?: string;
  submittedBy?: string;
}

export interface RoutingStageParam {
  stageNumber: number;
  stageName: string;
  defaultMachineCategoryId?: string;
  estimatedMinutes?: number;
  isOutsourced?: boolean;
  qcCheckpoints?: string[];
  parallelGroup?: number;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
