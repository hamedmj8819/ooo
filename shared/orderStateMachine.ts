import { OrderStatus, StageStatus, UserRole } from './constants';

/**
 * Valid Next Transitions for Production Orders
 * Strict state machine mapping according to Phase 3 requirements.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ['pending_planning', 'cancelled', 'on_hold'],
  pending_planning: ['planning_inquiry', 'cancelled', 'on_hold'],
  planning_inquiry: ['pending_ceo_quote', 'cancelled', 'on_hold'],
  pending_ceo_quote: ['material_ordered', 'quote_rejected', 'cancelled', 'on_hold'],
  quote_rejected: ['planning_inquiry', 'cancelled', 'on_hold'],
  material_ordered: ['material_received_po', 'cancelled', 'on_hold'],
  material_received_po: ['awaiting_engineering', 'cancelled', 'on_hold'],
  awaiting_engineering: ['engineering_approved', 'cancelled', 'on_hold'],
  engineering_approved: ['in_production', 'cancelled', 'on_hold'],
  in_production: ['awaiting_planning_handover', 'cancelled', 'on_hold'],
  awaiting_planning_handover: ['completed', 'semi_finished_stored', 'cancelled', 'on_hold'],
  completed: [], // Terminal state
  semi_finished_stored: [], // Terminal state
  cancelled: [], // Terminal state
  on_hold: [
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
    'cancelled',
  ],
};

/**
 * Valid Next Transitions for Manufacturing Stage Execution
 */
export const STAGE_TRANSITIONS: Record<StageStatus, readonly StageStatus[]> = {
  not_started: ['assigned'],
  assigned: ['in_progress', 'paused'],
  in_progress: ['qc_pending', 'paused'],
  paused: ['in_progress', 'assigned'],
  qc_pending: ['engineering_qc_pending', 'qc_rejected'],
  engineering_qc_pending: ['completed', 'qc_rejected'],
  qc_rejected: ['rework'],
  rework: ['in_progress', 'qc_pending'],
  completed: [], // Terminal state for stage
};

/**
 * Checks if a given order status transition is valid
 */
export function isOrderTransitionAllowed(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ORDER_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

/**
 * Checks if a stage status transition is valid
 */
export function isStageTransitionAllowed(currentStatus: StageStatus, nextStatus: StageStatus): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = STAGE_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

/**
 * Metadata for Order Statuses (Persian display name, color classes, descriptions)
 */
export interface OrderStatusMeta {
  status: OrderStatus;
  label: string;
  badgeClass: string;
  stepNumber: number;
  description: string;
  responsibleRole: UserRole | 'system';
}

export const ORDER_STATUS_METAS: Record<OrderStatus, OrderStatusMeta> = {
  draft: {
    status: 'draft',
    label: 'پیش‌نویس سفارش',
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    stepNumber: 0,
    description: 'سفارش در مرحله ایجاد اولیه و پیش‌نویس است.',
    responsibleRole: 'ceo',
  },
  pending_planning: {
    status: 'pending_planning',
    label: 'ثبت و در انتظار بررسی برنامه‌ریزی',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    stepNumber: 1,
    description: 'سفارش توسط مدیرعامل ثبت شده و منتظر شروع استعلام توسط برنامه‌ریزی است.',
    responsibleRole: 'planning',
  },
  planning_inquiry: {
    status: 'planning_inquiry',
    label: 'در حال استعلام ریخته‌گری/تامین',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    stepNumber: 2,
    description: 'واحد برنامه‌ریزی در حال استعلام قیمت و زمان تحویل از تامین‌کنندگان است.',
    responsibleRole: 'planning',
  },
  pending_ceo_quote: {
    status: 'pending_ceo_quote',
    label: 'در انتظار تصمیم پیش‌فاکتور مدیرعامل',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    stepNumber: 3,
    description: 'پیش‌فاکتورهای استعلام‌شده جهت تایید یا رد به مدیرعامل ارسال گردیده است.',
    responsibleRole: 'ceo',
  },
  quote_rejected: {
    status: 'quote_rejected',
    label: 'رد پیش‌فاکتور (نیاز به استعلام مجدد)',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    stepNumber: 2,
    description: 'مدیرعامل پیش‌فاکتورها را رد کرده و برنامه‌ریزی باید استعلام جدید بگیرد.',
    responsibleRole: 'planning',
  },
  material_ordered: {
    status: 'material_ordered',
    label: 'پیش‌فاکتور تایید شد / سفارش‌گذاری متریال',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    stepNumber: 4,
    description: 'پیش‌فاکتور منتخب تایید شده و متریال به ریخته‌گری سفارش داده شده است.',
    responsibleRole: 'planning',
  },
  material_received_po: {
    status: 'material_received_po',
    label: 'ورود متریال / صدور PO رسمی',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    stepNumber: 5,
    description: 'متریال اولیه وارد کارخانه شده و شماره PO رسمی به سفارش تخصیص یافته است.',
    responsibleRole: 'planning',
  },
  awaiting_engineering: {
    status: 'awaiting_engineering',
    label: 'در انتظار تایید نقشه‌ها و مدارک فنی',
    badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    stepNumber: 6,
    description: 'واحد مهندسی در حال تدوین مسیر ساخت و بارگذاری نقشه‌ها و فایل‌های CAD است.',
    responsibleRole: 'engineering',
  },
  engineering_approved: {
    status: 'engineering_approved',
    label: 'نقشه‌ها تایید شد (آماده واگذاری)',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    stepNumber: 7,
    description: 'کلیه نقشه‌های مراحل ساخت تایید گردیده و آماده تخصیص به ماشین‌ها است.',
    responsibleRole: 'production',
  },
  in_production: {
    status: 'in_production',
    label: 'در حال تولید در سالن ماشین‌کاری',
    badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    stepNumber: 8,
    description: 'مراحل ساخت روی ماشین‌آلات با نظارت سرپرست و اپراتورها در حال انجام است.',
    responsibleRole: 'production',
  },
  awaiting_planning_handover: {
    status: 'awaiting_planning_handover',
    label: 'تکمیل تولید و QC (در انتظار تحویل انبار)',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    stepNumber: 9,
    description: 'تمامی مراحل ساخت و کنترل کیفیت انجام شده و در انتظار صدور رسید انبار است.',
    responsibleRole: 'planning',
  },
  completed: {
    status: 'completed',
    label: 'تحویل نهایی به انبار (پایان‌یافته)',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    stepNumber: 10,
    description: 'محصول نهایی با موفقیت کنترل کیفی شده و به انبار تحویل گردید.',
    responsibleRole: 'warehouse',
  },
  semi_finished_stored: {
    status: 'semi_finished_stored',
    label: 'انتقال به انبار نیمه‌ساخته',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    stepNumber: 10,
    description: 'قطعه به عنوان محصول نیمه‌ساخته در انبار ذخیره گردید.',
    responsibleRole: 'warehouse',
  },
  cancelled: {
    status: 'cancelled',
    label: 'لغو شده',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    stepNumber: -1,
    description: 'سفارش لغو شده است.',
    responsibleRole: 'ceo',
  },
  on_hold: {
    status: 'on_hold',
    label: 'متوقف موقت (On Hold)',
    badgeClass: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
    stepNumber: -1,
    description: 'سفارش به طور موقت متوقف شده است.',
    responsibleRole: 'ceo',
  },
};

/**
 * Calculates weighted dynamic completion percentage of an order
 * Completed stages weighted by estimatedMinutes. 100% only when completed/semi_finished_stored.
 */
export function calculateOrderProgress(
  orderStatus: OrderStatus,
  stages: Array<{ status: StageStatus; estimatedMinutes?: number }>
): number {
  if (orderStatus === 'completed' || orderStatus === 'semi_finished_stored') {
    return 100;
  }
  if (orderStatus === 'cancelled' || orderStatus === 'draft') {
    return 0;
  }
  if (!stages || stages.length === 0) {
    // If before production stages
    if (orderStatus === 'engineering_approved') return 30;
    if (orderStatus === 'material_received_po' || orderStatus === 'awaiting_engineering') return 20;
    if (orderStatus === 'material_ordered') return 15;
    if (orderStatus === 'pending_ceo_quote') return 10;
    if (orderStatus === 'planning_inquiry') return 5;
    return 0;
  }

  let totalWeight = 0;
  let completedWeight = 0;

  for (const s of stages) {
    const weight = s.estimatedMinutes && s.estimatedMinutes > 0 ? s.estimatedMinutes : 60;
    totalWeight += weight;
    if (s.status === 'completed') {
      completedWeight += weight;
    } else if (s.status === 'qc_pending' || s.status === 'engineering_qc_pending') {
      completedWeight += weight * 0.85;
    } else if (s.status === 'in_progress') {
      completedWeight += weight * 0.5;
    } else if (s.status === 'assigned') {
      completedWeight += weight * 0.15;
    }
  }

  if (totalWeight === 0) return 0;

  // Range within production: 30% to 95%
  const productionRatio = completedWeight / totalWeight;
  const progress = Math.round(30 + productionRatio * 65);

  // Cap at 99% until formally completed
  return Math.min(99, Math.max(0, progress));
}

/**
 * Computes deadline urgency and overdue metrics
 */
export function calculateDeadlineToMetrics(deadlineDateStr: string, orderStatus: OrderStatus): {
  isOverdue: boolean;
  daysRemaining: number;
  urgencyLevel: 'normal' | 'warning' | 'critical';
} {
  const isFinal = orderStatus === 'completed' || orderStatus === 'semi_finished_stored' || orderStatus === 'cancelled';
  const now = new Date();
  const deadline = new Date(deadlineDateStr);

  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (isFinal) {
    return { isOverdue: false, daysRemaining, urgencyLevel: 'normal' };
  }

  const isOverdue = daysRemaining < 0;
  let urgencyLevel: 'normal' | 'warning' | 'critical' = 'normal';

  if (isOverdue) {
    urgencyLevel = 'critical';
  } else if (daysRemaining <= 3) {
    urgencyLevel = 'critical';
  } else if (daysRemaining <= 7) {
    urgencyLevel = 'warning';
  }

  return { isOverdue, daysRemaining, urgencyLevel };
}
