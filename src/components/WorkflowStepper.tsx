import React from 'react';
import { OrderStatus } from '../types';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  PackageCheck,
  FileCode2,
  Cog,
  ShieldCheck,
  Warehouse
} from 'lucide-react';

interface WorkflowStepperProps {
  status: OrderStatus;
  isDeliveredSemiFinished?: boolean;
}

const STEPS = [
  { id: 1, key: 'order', label: 'دستور ساخت', icon: FileText },
  { id: 2, key: 'quotes', label: 'پیش‌فاکتور و استعلام', icon: DollarSign },
  { id: 3, key: 'ceo_approval', label: 'تایید مدیرعامل', icon: CheckCircle2 },
  { id: 4, key: 'material_po', label: 'خرید متریال و PO', icon: PackageCheck },
  { id: 5, key: 'engineering', label: 'نقشه‌ها و فایل STEP', icon: FileCode2 },
  { id: 6, key: 'production', label: 'ماشین‌کاری و ساخت', icon: Cog },
  { id: 7, key: 'qc', label: 'کنترل کیفی (QC)', icon: ShieldCheck },
  { id: 8, key: 'warehouse', label: 'تحویل انبار', icon: Warehouse },
];

export function getStepIndexFromStatus(status: OrderStatus): number {
  switch (status) {
    case 'draft':
      return 1;
    case 'pending_planning':
      return 1;
    case 'planning_inquiry':
      return 2;
    case 'pending_ceo_quote':
      return 2;
    case 'quote_rejected':
      return 2;
    case 'material_ordered':
      return 3;
    case 'material_received_po':
      return 4;
    case 'awaiting_engineering':
      return 5;
    case 'engineering_approved':
      return 5;
    case 'assigned_to_production':
      return 6;
    case 'in_production':
      return 6;
    case 'completed':
    case 'semi_finished_stored':
      return 8;
    default:
      return 1;
  }
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ status, isDeliveredSemiFinished }) => {
  const currentStep = getStepIndexFromStatus(status);

  return (
    <div className="w-full py-4 px-3 bg-slate-900/60 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between relative overflow-x-auto pb-2 scrollbar-none">
        
        {/* Background Connecting Line */}
        <div className="absolute top-5 right-6 left-6 h-0.5 bg-slate-800 -z-0">
          <div
            className="h-full bg-gradient-to-l from-cyan-500 to-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, ((currentStep - 1) / (STEPS.length - 1)) * 100)}%` }}
          />
        </div>

        {STEPS.map((step) => {
          const Icon = step.icon;
          const isPassed = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isPending = step.id > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center min-w-[85px] z-10 text-center px-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                  isPassed
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                    : isCurrent
                    ? 'bg-cyan-500 text-slate-950 font-bold ring-4 ring-cyan-500/30 scale-110 animate-pulse'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-semibold mt-2 whitespace-nowrap transition ${
                  isPassed
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-cyan-300 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {step.id === 8 && isDeliveredSemiFinished ? 'انبار نیمه‌ساخته' : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
