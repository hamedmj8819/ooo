export const USER_ROLES = [
  'super_admin',
  'ceo',
  'planning',
  'engineering',
  'qc',
  'production',
  'operator',
  'warehouse',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ORDER_STATUSES = [
  'draft',
  'pending_planning',
  'planning_inquiry',
  'pending_ceo_quote',
  'quote_rejected',
  'material_ordered',
  'material_received_po',
  'awaiting_engineering',
  'engineering_approved',
  'in_production',
  'awaiting_planning_handover',
  'completed',
  'semi_finished_stored',
  'cancelled',
  'on_hold',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STAGE_STATUSES = [
  'not_started',
  'assigned',
  'in_progress',
  'paused',
  'qc_pending',
  'engineering_qc_pending',
  'completed',
  'qc_rejected',
  'rework',
] as const;

export type StageStatus = (typeof STAGE_STATUSES)[number];

export const PRIORITIES = ['normal', 'urgent', 'emergency'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const MACHINE_STATUSES = ['active', 'idle', 'breakdown', 'maintenance'] as const;
export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const MACHINE_CATEGORIES = [
  'grinder',
  'manual_lathe',
  'cnc_lathe',
  'gantry_mill',
  'boring',
  'carousel',
  'outsourced_wirecut',
  'outsourced_lap',
  'outsourced_cylindrical_grind',
] as const;
export type MachineCategory = (typeof MACHINE_CATEGORIES)[number];

export const DOWNTIME_CATEGORIES = [
  'mechanical',
  'electrical',
  'tooling',
  'hydraulic',
  'software_cnc',
  'operator_error',
  'other',
] as const;
export type DowntimeCategory = (typeof DOWNTIME_CATEGORIES)[number];

export const MAINTENANCE_TYPES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annual',
  'overhaul',
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const SUPPLIER_TYPES = ['foundry', 'raw_material', 'outsourcing', 'importer'] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const QUOTE_STATUSES = ['pending_ceo', 'approved_by_ceo', 'rejected_by_ceo', 'superseded'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QC_DECISIONS = ['approved', 'conditional', 'rejected'] as const;
export type QCDecision = (typeof QC_DECISIONS)[number];

export const WAREHOUSE_ITEM_TYPES = [
  'final_product',
  'semi_finished',
  'raw_material',
  'bought_out',
] as const;
export type WarehouseItemType = (typeof WAREHOUSE_ITEM_TYPES)[number];
