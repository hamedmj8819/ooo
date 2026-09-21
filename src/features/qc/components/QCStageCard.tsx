import React from 'react';
import { ClipboardCheck, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { ProductionOrder, StageExecutionProgress } from '../../../types';

interface QCStageCardProps {
  order: ProductionOrder;
  stage: StageExecutionProgress;
  onOpenInspection: (order: ProductionOrder, stage: StageExecutionProgress) => void;
}

export function QCStageCard({ order, stage, onOpenInspection }: QCStageCardProps) {
  const isPendingQC = stage.status === 'qc_pending';
  const isPendingEng = stage.status === 'engineering_qc_pending';
  const isCompleted = stage.status === 'completed';
  const isRejected = stage.status === 'qc_rejected';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 hover:border-slate-700 transition" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-cyan-400">{order.orderNumber}</span>
            <span className="text-xs font-bold text-white">{order.partName}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            مرحله {stage.stageNumber}: {stage.stageName}
          </p>
        </div>

        <div>
          {isPendingQC && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              منتظر بازرسی QC
            </span>
          )}
          {isPendingEng && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              ارسال‌شده به مهندسی
            </span>
          )}
          {isCompleted && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تایید شد
            </span>
          )}
          {isRejected && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              عدم تایید
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
        <div>
          دستگاه: <span className="text-slate-200 font-medium">{stage.machineToolName || 'نامشخص'}</span>
        </div>
        <div>
          اپراتور: <span className="text-slate-200 font-medium">{stage.operatorName || 'نامشخص'}</span>
        </div>
        <div>
          تولیدشده: <span className="text-cyan-300 font-mono font-bold">{stage.producedQty || order.quantity} عدد</span>
        </div>
      </div>

      {isPendingQC && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => onOpenInspection(order, stage)}
            className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>ثبت بازرسی و برگه QC</span>
          </button>
        </div>
      )}
    </div>
  );
}
