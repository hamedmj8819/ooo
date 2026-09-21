import React, { useState } from 'react';
import { FileCode2, Upload, Send, FileCheck } from 'lucide-react';
import { useOrders } from '../../orders/api';
import { useUploadEngineeringDoc } from '../api';
import { useToast } from '../../../context/ToastContext';

export function OrdersReleaseTab() {
  const { showToast } = useToast();
  const { data: orders = [] } = useOrders();
  const uploadDocMutation = useUploadEngineeringDoc();

  const awaitingOrders = orders.filter((o) => o.status === 'awaiting_engineering');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  const [stageNumberInput, setStageNumberInput] = useState<number>(1);
  const [stageNameInput, setStageNameInput] = useState<string>('مرحله ۱: تراشکاری اولیه و سنترگیری');
  const [drawingNumberInput, setDrawingNumberInput] = useState<string>(
    () => 'DWG-ENG-' + Math.floor(1000 + Math.random() * 9000)
  );
  const [drawingFileNameInput, setDrawingFileNameInput] = useState<string>('Blueprint-RevA.pdf');
  const [stepFileNameInput, setStepFileNameInput] = useState<string>('SolidModel-Stage.step');
  const [engNotesInput, setEngNotesInput] = useState<string>('');

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await uploadDocMutation.mutateAsync({
        orderId: selectedOrder.id,
        data: {
          stageNumber: stageNumberInput,
          stageName: stageNameInput,
          drawingNumber: drawingNumberInput,
          drawingFileName: drawingFileNameInput,
          drawingFileType: 'pdf',
          stepFileName: stepFileNameInput,
          notes: engNotesInput,
        },
      });

      showToast({
        type: 'success',
        title: 'ثبت شد',
        message: `مستند مهندسی مرحله ${stageNumberInput} با موفقیت بارگذاری شد.`,
      });

      setEngNotesInput('');
      setStageNumberInput((prev) => prev + 1);
      setDrawingNumberInput('DWG-ENG-' + Math.floor(1000 + Math.random() * 9000));
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'بارگذاری مستندات با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Alert for orders needing engineering release */}
      {awaitingOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-medium">
              تعداد <strong className="text-amber-300 font-bold">{awaitingOrders.length}</strong> سفارش منتظر صدور و بارگذاری نقشه‌های مهندسی هستند.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Order Selector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
            انتخاب سفارش برای بارگذاری نقشه‌ها
          </h3>
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrderId(o.id)}
                className={`w-full text-right p-3 rounded-xl border text-xs transition ${
                  selectedOrder?.id === o.id
                    ? 'bg-cyan-950/80 border-cyan-500/80 text-white shadow-lg'
                    : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{o.partName}</span>
                  <span className="font-mono text-[10px] text-cyan-400">{o.orderNumber}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">تعداد: {o.quantity} عدد</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form for Uploading Engineering Docs */}
        {selectedOrder ? (
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                بارگذاری نقشه و مدل CAD برای سفارش: {selectedOrder.orderNumber} ({selectedOrder.partName})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">شماره مرحله ساخت:</label>
                <input
                  type="number"
                  value={stageNumberInput}
                  onChange={(e) => setStageNumberInput(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نام یا عنوان مرحله ساخت:</label>
                <input
                  type="text"
                  value={stageNameInput}
                  onChange={(e) => setStageNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شماره نقشه مهندسی (Drawing No):</label>
                <input
                  type="text"
                  value={drawingNumberInput}
                  onChange={(e) => setDrawingNumberInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نام فایل PDF نقشه دوبعدی:</label>
                <input
                  type="text"
                  value={drawingFileNameInput}
                  onChange={(e) => setDrawingFileNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">نام فایل ۳بعدی STEP / IGES:</label>
                <input
                  type="text"
                  value={stepFileNameInput}
                  onChange={(e) => setStepFileNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">یادداشت و تلرانس‌های فنی ویژه:</label>
                <input
                  type="text"
                  value={engNotesInput}
                  onChange={(e) => setEngNotesInput(e.target.value)}
                  placeholder="مثال: صافی سطح N6، تلرانس +0.02mm..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={uploadDocMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>ثبت و آزادیافت نقشه مرحله</span>
              </button>
            </div>

            {/* List of uploaded docs for this order */}
            {selectedOrder.engineeringDocs && selectedOrder.engineeringDocs.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  نقشه‌های ثبت‌شده این سفارش ({selectedOrder.engineeringDocs.length})
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedOrder.engineeringDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between text-slate-300"
                    >
                      <div>
                        <span className="font-bold text-cyan-400 ml-2">مرحله {doc.stageNumber}:</span>
                        <span>{doc.stageName}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {doc.drawingFileName} | {doc.stepFileName}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        ) : null}
      </div>
    </div>
  );
}
