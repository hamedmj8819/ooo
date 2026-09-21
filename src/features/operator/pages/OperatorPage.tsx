import React from 'react';
import { Wrench, Play, CheckCircle2 } from 'lucide-react';
import { useOrders, useFinishStage } from '../../orders/api';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../auth/AuthContext';

export function OperatorPage() {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { data: orders = [] } = useOrders();

  const finishStageMutation = useFinishStage();

  const operatorStages: Array<{
    orderId: string;
    orderNumber: string;
    partName: string;
    stageNumber: number;
    stageName: string;
    machineName: string;
    producedQty: number;
    status: string;
  }> = [];

  orders.forEach((o) => {
    o.stages?.forEach((stg) => {
      if (stg.operatorId === currentUser?.id || !currentUser?.id) {
        operatorStages.push({
          orderId: o.id,
          orderNumber: o.orderNumber,
          partName: o.partName,
          stageNumber: stg.stageNumber,
          stageName: stg.stageName,
          machineName: stg.machineToolName || 'نامشخص',
          producedQty: stg.producedQty || 0,
          status: stg.status,
        });
      }
    });
  });

  const handleFinish = async (orderId: string, stageNumber: number, producedQty: number) => {
    try {
      await finishStageMutation.mutateAsync({
        orderId,
        stageNumber,
        producedQty,
      });

      showToast({ type: 'success', title: 'ثبت شد', message: 'اتمام ساخت مرحله جهت بازرسی QC ثبت شد.' });
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'ثبت اتمام مرحله با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-yellow-400" />
            میزکار اپراتور دستگاه و ماشین‌کار
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            مشاهده دستورکارهای تخصیص داده شده، ثبت قطعات تولیدشده و اعلام اتمام ساخت
          </p>
        </div>
      </div>

      {/* Operator Tasks List */}
      <div className="space-y-4">
        {operatorStages.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
            هیچ دستور کاری در حال حاضر به شما تخصیص داده نشده است.
          </div>
        ) : (
          operatorStages.map((stg) => (
            <div key={`${stg.orderId}-${stg.stageNumber}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-yellow-400 ml-2">{stg.orderNumber}</span>
                  <span className="text-sm font-bold text-white">{stg.partName}</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    مرحله {stg.stageNumber}: {stg.stageName} | دستگاه: {stg.machineName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFinish(stg.orderId, stg.stageNumber, stg.producedQty + 1)}
                    disabled={finishStageMutation.isPending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ارسال به بازرسی QC</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
