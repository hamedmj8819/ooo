import { UserRole } from './constants';

export type Permission =
  // Models
  | 'models:read'
  | 'models:create'
  | 'models:update'
  | 'models:delete'
  // Machines
  | 'machines:read'
  | 'machines:create'
  | 'machines:update'
  | 'machines:delete'
  | 'machines:breakdown'
  // Parts
  | 'parts:read'
  | 'parts:create'
  | 'parts:update'
  | 'parts:delete'
  | 'parts:drawings'
  // Operators
  | 'operators:read'
  | 'operators:create'
  | 'operators:update'
  | 'operators:delete'
  // Foundries
  | 'foundries:read'
  | 'foundries:create'
  | 'foundries:update'
  | 'foundries:delete'
  // Users
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Orders
  | 'orders:read'
  | 'orders:create'
  | 'orders:delete'
  | 'orders:inquiry_start'
  | 'orders:quotes_create'
  | 'orders:quotes_decide'
  | 'orders:material_receive_po'
  | 'orders:engineering_upload'
  | 'orders:routing_define'
  | 'orders:assign_stage'
  | 'orders:start_stage'
  | 'orders:pause_stage'
  | 'orders:resume_stage'
  | 'orders:transfer_stage'
  | 'orders:finish_stage'
  | 'orders:rework'
  | 'orders:qc_submit'
  | 'orders:qc_approve'
  | 'orders:engineering_approve'
  | 'orders:handover_warehouse'
  | 'orders:cancel_hold'
  | 'orders:shortfall_decide'
  // Warehouse
  | 'warehouse:read'
  | 'warehouse:write'
  | 'warehouse:adjust'
  | 'warehouse:confirm_receipt'
  // Notifications
  | 'notifications:read'
  | 'notifications:mark_read'
  // Audit & Backup
  | 'audit:read'
  | 'backup:manage';

export const ALL_PERMISSIONS: readonly Permission[] = [
  'models:read',
  'models:create',
  'models:update',
  'models:delete',
  'machines:read',
  'machines:create',
  'machines:update',
  'machines:delete',
  'machines:breakdown',
  'parts:read',
  'parts:create',
  'parts:update',
  'parts:delete',
  'parts:drawings',
  'operators:read',
  'operators:create',
  'operators:update',
  'operators:delete',
  'foundries:read',
  'foundries:create',
  'foundries:update',
  'foundries:delete',
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'orders:read',
  'orders:create',
  'orders:delete',
  'orders:inquiry_start',
  'orders:quotes_create',
  'orders:quotes_decide',
  'orders:material_receive_po',
  'orders:engineering_upload',
  'orders:routing_define',
  'orders:assign_stage',
  'orders:finish_stage',
  'orders:rework',
  'orders:qc_submit',
  'orders:qc_approve',
  'orders:handover_warehouse',
  'orders:cancel_hold',
  'orders:shortfall_decide',
  'warehouse:read',
  'warehouse:write',
  'warehouse:adjust',
  'warehouse:confirm_receipt',
  'notifications:read',
  'notifications:mark_read',
  'audit:read',
  'backup:manage',
] as const;

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,

  ceo: [
    'models:read',
    'machines:read',
    'parts:read',
    'operators:read',
    'foundries:read',
    'orders:read',
    'orders:create',
    'orders:quotes_decide',
    'orders:cancel_hold',
    'orders:shortfall_decide',
    'warehouse:read',
    'notifications:read',
    'notifications:mark_read',
    'audit:read',
  ],

  planning: [
    'models:read',
    'machines:read',
    'parts:read',
    'operators:read',
    'foundries:read',
    'orders:read',
    'orders:create',
    'orders:inquiry_start',
    'orders:quotes_create',
    'orders:material_receive_po',
    'orders:handover_warehouse',
    'orders:cancel_hold',
    'orders:shortfall_decide',
    'warehouse:read',
    'machines:breakdown',
    'notifications:read',
    'notifications:mark_read',
  ],

  engineering: [
    'models:read',
    'machines:read',
    'parts:read',
    'parts:drawings',
    'orders:read',
    'orders:engineering_upload',
    'orders:routing_define',
    'orders:qc_approve',
    'notifications:read',
    'notifications:mark_read',
  ],

  production: [
    'models:read',
    'machines:read',
    'parts:read',
    'operators:read',
    'orders:read',
    'orders:assign_stage',
    'orders:start_stage',
    'orders:pause_stage',
    'orders:resume_stage',
    'orders:transfer_stage',
    'orders:finish_stage',
    'orders:rework',
    'machines:breakdown',
    'notifications:read',
    'notifications:mark_read',
  ],

  operator: [
    'orders:read',
    'machines:read',
    'orders:start_stage',
    'orders:pause_stage',
    'orders:resume_stage',
    'orders:finish_stage',
    'machines:breakdown',
    'notifications:read',
    'notifications:mark_read',
  ],

  qc: [
    'orders:read',
    'models:read',
    'machines:read',
    'parts:read',
    'orders:qc_submit',
    'notifications:read',
    'notifications:mark_read',
  ],

  warehouse: [
    'orders:read',
    'warehouse:read',
    'warehouse:write',
    'warehouse:adjust',
    'warehouse:confirm_receipt',
    'notifications:read',
    'notifications:mark_read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
