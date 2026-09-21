import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ClipboardCheck, X } from 'lucide-react';
import { useOrders } from '../../orders/api';
import { useEngineeringApproval } from '../api';
import { useToast } from '../../../context/ToastContext';
import type { ProductionOrder, StageExecutionProgress } from '../../../types';

export function QCApprovalsTab() {
  const { showToast } = useToast();
  const { data: orders = [] } = useOrders();
  const approvalMutation = useEngineeringApproval();

  const [approverName] = useState('مهندس کریمی (مدیر مهندسی)');
  const [approvingStageId, setApprovingStageId] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<string>(
    'بررسی ابعادی و برگه QC با نقشه و الزامات فنی مطابقت دارد؛ تایید شد.'
  );
  const [rejectingStageId, setRejectingStageId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [viewingQcDoc, setViewingQcDoc] = useState<{
    order: ProductionOrder;
    stage: StageExecutionProgress;
  } | null>(null);

  // Find stages with non-conformance or needing engineering approval
  const pendingStages: Array<{ order: ProductionOrder; stage: StageExecutionProgress }> = [];
  orders.forEach((o) => {
    o.stages?.forEach((stg) => {
      if (stg.qcReport && !stg.engineeringApproval) {
        pendingStages.push({ order: o, stage: stg });
      }
    });
  });

  const handleApprove = async (orderId: string, stageNumber: number) => {
    try {
      await approvalMutation.mutateAsync({
        orderId,
        stageNumber,
        data: {
          isApproved: true,
          approverName,
          feedback: approvalFeedback,
        },
      });
      showToast({ type: 'success', title: 'تایید شد', message: `مرحله ${stageNumber} تایید مهندسی گردید.` });
      setApprovingStageId(null);
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'عملیات تایید با خطا مواجه شد.' });
    }
  };

  const handleReject = async (orderId: string, stageNumber: number) => {
    if (!rejectReason.trim()) {
      showToast({ type: 'warning', title: 'دلیل عدم تایید', message: 'لطفاً علت عدم تایید و دستور اصلاح را وارد کنید.' });
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        orderId,
        stageNumber,
        data: {
          isApproved: false,
          approverName,
          feedback: rejectReason,
        },
      });
      showToast({ type: 'warning', title: 'اصلاحیه صادر شد', message: `مرحله ${stageNumber} جهت دوباره‌کاری ارجاع گردید.` });
      setRejectingStageId(null);
      setRejectReason('');
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'ثبت رد مهندسی با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            بررسی و تایید گزارش‌های کیفیت و مغایرت‌های فنی QC ({pendingStages.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            بررسی برگه‌های اندازه‌برداری و تصمیم‌گیری درباره انحرافات ابعادی جهت تایید یا صدور دوباره‌کاری
          </p>
        </div>
      </div>

      {pendingStages.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
          هیچ گزارش QC بلاتکلیفی برای تایید مهندسی وجود ندارد.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingStages.map(({ order, stage }) => {
            const stageKey = `${order.id}-${stage.stageNumber}`;
            const isApproving = approvingStageId === stageKey;
            const isRejecting = rejectingStageId === stageKey;

            return (
              <div key={stageKey} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 ml-2 font-mono">سفارش {order.orderNumber}</span>
                    <span className="text-xs font-bold text-white">{order.partName}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      مرحله {stage.stageNumber}: {stage.stageName} | دستگاه: {stage.machineToolName}
                    </p>
                  </div>

                  <button
                    onClick={() => setViewingQcDoc({ order, stage })}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>مشاهده فرم کیفیت QC</span>
                  </button>
                </div>

                {/* QC Details */}
                {stage.qcReport && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        وضعیت بازرسی QC: {stage.qcReport.decision === 'approved' ? 'تایید اولیه' : 'دارای عدم انطباق / مغایرت'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">بازرس: {stage.qcReport.inspectorName}</span>
                    </div>
                    {stage.qcReport.notes && <p className="text-slate-300">توضیحات بازرس: {stage.qcReport.notes}</p>}
                  </div>
                )}

                {/* Approve/Reject Action Triggers */}
                {!isApproving && !isRejecting && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setRejectingStageId(stageKey);
                        setApprovingStageId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>عدم تایید و دستور اصلاح / دوباره‌کاری</span>
                    </button>
                    <button
                      onClick={() => {
                        setApprovingStageId(stageKey);
                        setRejectingStageId(null);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>تایید نهائی مهندسی</span>
                    </button>
                  </div>
                )}

                {/* Approve Box */}
                {isApproving && (
                  <div className="bg-emerald-950/30 border border-emerald-800/80 p-4 rounded-xl space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-emerald-300">ثبت تاییدیه فنی مهندسی</h4>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">توضیحات تاییدیه:</label>
                      <input
                        type="text"
                        value={approvalFeedback}
                        onChange={(e) => setApprovalFeedback(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setApprovingStageId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={() => handleApprove(order.id, stage.stageNumber)}
                        disabled={approvalMutation.isPending}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                      >
                        تایید قطعی
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Box */}
                {isRejecting && (
                  <div className="bg-rose-950/30 border border-rose-800/80 p-4 rounded-xl space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-rose-300">صدور عدم تایید و دستور اصلاح</h4>
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">شرح عدم انطباق و دستور اصلاح دوباره‌کاری:</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="علت رد و دستور اصلاح برای اپراتور را وارد کنید..."
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setRejectingStageId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={() => handleReject(order.id, stage.stageNumber)}
                        disabled={approvalMutation.isPending}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                      >
                        ارسال دستور اصلاح
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QC Form Modal */}
      {viewingQcDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">برگه بازرسی کیفیت QC</h3>
              <button
                onClick={() => setViewingQcDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong>سفارش:</strong> {viewingQcDoc.order.orderNumber} ({viewingQcDoc.order.partName})
              </p>
              <p>
                <strong>مرحله:</strong> {viewingQcDoc.stage.stageNumber} - {viewingQcDoc.stage.stageName}
              </p>
              {viewingQcDoc.stage.qcReport && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <p>
                    <strong>وضعیت:</strong> {viewingQcDoc.stage.qcReport.decision === 'approved' ? 'تایید' : 'مغایرت ابعادی'}
                  </p>
                  <p>
                    <strong>بازرس:</strong> {viewingQcDoc.stage.qcReport.inspectorName}
                  </p>
                  <p>
                    <strong>توضیحات:</strong> {viewingQcDoc.stage.qcReport.notes || 'بدون توضیح'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
