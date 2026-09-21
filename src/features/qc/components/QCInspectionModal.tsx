import React, { useState } from 'react';
import { ClipboardCheck, X, Upload, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { useSubmitQCReport } from '../api';
import { useToast } from '../../../context/ToastContext';
import type { ProductionOrder, StageExecutionProgress } from '../../../types';

interface QCInspectionModalProps {
  order: ProductionOrder;
  stage: StageExecutionProgress;
  onClose: () => void;
}

export function QCInspectionModal({ order, stage, onClose }: QCInspectionModalProps) {
  const { showToast } = useToast();
  const submitQCMutation = useSubmitQCReport();

  const targetQty = stage.producedQty || order.quantity || 1;
  const [inspectorName, setInspectorName] = useState('مهندس کاظمی');
  const [inspectorCode, setInspectorCode] = useState('EMP-4001');
  const [passedQty, setPassedQty] = useState<number>(targetQty);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [conditionalQty, setConditionalQty] = useState<number>(0);
  const [decision, setDecision] = useState<'approved' | 'conditional' | 'rejected'>('approved');
  const [dimPassed, setDimPassed] = useState(true);
  const [roughnessPassed, setRoughnessPassed] = useState(true);
  const [hardness, setHardness] = useState('58 HRC');
  const [roughnessRa, setRoughnessRa] = useState('Ra 0.8 µm');
  const [measuredTolerances, setMeasuredTolerances] = useState(
    'انحرافات ابعادی طبق نقشه؛ عدم دوپخ؛ تلورانس ابعادی داخل ±0.01mm'
  );
  const [qcNotes, setQcNotes] = useState('بازرسی ابعادی با کولیس دیجیتال و میکرومتر انجام گردید.');
  const [sheetFileName, setSheetFileName] = useState(
    `QC_Inspection_Sheet_${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Stg${stage.stageNumber}.pdf`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await submitQCMutation.mutateAsync({
        orderId: order.id,
        stageNumber: stage.stageNumber,
        data: {
          inspectorName,
          inspectorPersonnelCode: inspectorCode,
          passedQty,
          rejectedQty,
          conditionalQty,
          decision,
          dimensionalCheckPassed: dimPassed,
          surfaceRoughnessPassed: roughnessPassed,
          hardnessRockwell: hardness,
          roughnessRa,
          measuredTolerances,
          notes: qcNotes,
          sheetFileName,
          sheetFileSize: '1.4 MB',
        },
      });

      showToast({
        type: 'success',
        title: 'ثبت شد',
        message: `گزارش بازرسی کیفیت مرحله ${stage.stageNumber} با موفقیت ثبت شد.`,
      });

      onClose();
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'ثبت برگه QC با خطا مواجه شد.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              فرم بازرسی و تکمیل برگه کیفیت (QC) - مرحله {stage.stageNumber}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Info Banner */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-slate-300">
            <div>
              سفارش: <strong className="text-white">{order.orderNumber}</strong> ({order.partName})
            </div>
            <div>
              عنوان مرحله: <strong className="text-white">{stage.stageName}</strong>
            </div>
            <div>
              ماشین / دستگاه: <strong className="text-cyan-400">{stage.machineToolName}</strong>
            </div>
            <div>
              اپراتور مجری: <strong className="text-cyan-400">{stage.operatorName}</strong>
            </div>
          </div>

          {/* Quantities and Decision */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">تعداد سالم و تاییدشده:</label>
              <input
                type="number"
                value={passedQty}
                onChange={(e) => setPassedQty(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-bold font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">تعداد ضایعات / ردشده:</label>
              <input
                type="number"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-rose-300 font-bold font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">تصمیم کیفیت:</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value as 'approved' | 'conditional' | 'rejected')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="approved">تایید کامل (Approved)</option>
                <option value="conditional">تایید مشروط / انحراف جزیی</option>
                <option value="rejected">عدم تایید / نیاز به اصلاح و دوباره‌کاری</option>
              </select>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">سختی سنجی (Rockwell):</label>
              <input
                type="text"
                value={hardness}
                onChange={(e) => setHardness(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">صافی سطح (Roughness Ra):</label>
              <input
                type="text"
                value={roughnessRa}
                onChange={(e) => setRoughnessRa(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">اندازه‌برداری و تلرانس‌های ثبت‌شده:</label>
            <textarea
              value={measuredTolerances}
              onChange={(e) => setMeasuredTolerances(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">توضیحات بازرس QC:</label>
            <input
              type="text"
              value={qcNotes}
              onChange={(e) => setQcNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitQCMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-950/50 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>ارسال و ثبت گزارش QC</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
