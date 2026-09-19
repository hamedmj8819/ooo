import React, { useState } from 'react';
import {
  MachineTool,
  OperatorProfile,
  ProductionOrder,
  StageEngineeringDoc
} from '../../types';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Play,
  RotateCw,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  ShieldAlert,
  Sliders,
  Flame,
  Check
} from 'lucide-react';

interface OperatorViewProps {
  machines: MachineTool[];
  operators: OperatorProfile[];
  orders: ProductionOrder[];
  onFinishStage: (orderId: string, stageNumber: number, goodQty: number, scrapQty: number, notes?: string) => void;
  onReportBreakdown: (machineId: string, reason: string) => void;
  onResolveBreakdown: (machineId: string) => void;
  onOpenCadViewer: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

export const OperatorView: React.FC<OperatorViewProps> = ({
  machines,
  operators,
  orders,
  onFinishStage,
  onReportBreakdown,
  onResolveBreakdown,
  onOpenCadViewer
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || '');

  // Finish stage modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [goodQty, setGoodQty] = useState<number>(4);
  const [scrapQty, setScrapQty] = useState<number>(0);
  const [operatorNotes, setOperatorNotes] = useState('');

  // Breakdown modal
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownReason, setBreakdownReason] = useState('');

  const currentMachine = machines.find(m => m.id === selectedMachineId) || machines[0];
  const currentOperator = operators.find(o => o.id === selectedOperatorId) || operators[0];

  // Find the active work order and stage on this machine
  let activeOrder: ProductionOrder | undefined;
  let activeStage: any;

  if (currentMachine?.currentWorkOrderId) {
    activeOrder = orders.find(o => o.id === currentMachine.currentWorkOrderId);
    if (activeOrder) {
      activeStage = activeOrder.stages.find(
        s => s.machineToolId === currentMachine.id && (s.status === 'in_progress' || s.status === 'qc_pending')
      );
    }
  }

  // If no order specifically assigned via machine field, check across orders stages
  if (!activeOrder) {
    for (const ord of orders) {
      const matchStage = ord.stages.find(s => s.machineToolId === currentMachine?.id && s.status !== 'completed');
      if (matchStage) {
        activeOrder = ord;
        activeStage = matchStage;
        break;
      }
    }
  }

  // Find engineering doc for this stage
  const currentEngDoc = activeOrder?.engineeringDocs.find(
    d => d.stageNumber === activeStage?.stageNumber
  ) || activeOrder?.engineeringDocs[0];

  const handleFinishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeOrder && activeStage) {
      onFinishStage(activeOrder.id, activeStage.stageNumber, goodQty, scrapQty, operatorNotes);
      setShowFinishModal(false);
      setOperatorNotes('');
    }
  };

  const handleBreakdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMachine && breakdownReason.trim()) {
      onReportBreakdown(currentMachine.id, breakdownReason.trim());
      setShowBreakdownModal(false);
      setBreakdownReason('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Shop Floor Station Header */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-cyan-400 block">
              ترمینال صنعتی سالن ماشین‌کاری (Shop Floor Kiosk)
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              ایستگاه کاری اپراتور و استادکار
            </h2>
          </div>
        </div>

        {/* Machine & Operator Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">انتخاب دستگاه مستقر:</label>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} [{m.code}] {m.status === 'breakdown' ? '⛔ خراب' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">اپراتور شیفت:</label>
            <select
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              className="bg-slate-950 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
            >
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name} ({op.personnelCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Machine Status Banner (Alert if Breakdown) */}
      {currentMachine.status === 'breakdown' ? (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-black text-rose-300 uppercase tracking-wider">
                هشدار توقف اضطراری خط
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">
                دستگاه {currentMachine.name} متوقف است
              </h3>
              <p className="text-xs text-rose-200 mt-1">
                علت ثبت شده: {currentMachine.breakdownReason}
              </p>
            </div>
          </div>

          <button
            onClick={() => onResolveBreakdown(currentMachine.id)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xl transition flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5" />
            تعمیر شد / رفع خرابی و بازگشت به خط
          </button>
        </div>
      ) : null}

      {/* Main Work Surface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Stage & Part Specification (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400 font-medium">سفارش و دستور کار جاری روی این دستگاه:</span>
                {activeOrder ? (
                  <h3 className="text-xl font-black text-white mt-1">
                    {activeOrder.title}
                  </h3>
                ) : (
                  <h3 className="text-lg font-bold text-slate-500 mt-1">
                    در حال حاضر قطعه‌ای به این دستگاه اختصاص داده نشده است
                  </h3>
                )}
              </div>

              {activeStage && (
                <span className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-bold">
                  مرحله {activeStage.stageNumber}: {activeStage.stageName}
                </span>
              )}
            </div>

            {activeOrder && activeStage ? (
              <div className="space-y-6">
                
                {/* Part Specs Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">شماره نقشه / فنی:</span>
                    <span className="font-mono text-cyan-300 font-bold text-sm mt-0.5 block truncate">
                      {activeOrder.partNumber}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">تعداد کل سفارش:</span>
                    <span className="text-white font-bold text-sm mt-0.5 block">
                      {activeOrder.quantity} عدد
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">وضعیت فعلی عملیات:</span>
                    <span className="text-emerald-400 font-bold text-xs mt-1 block">
                      {activeStage.status === 'qc_pending' ? 'در انتظار بازرسی QC' : 'در حال تراشکاری'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">موعد تحویل PO:</span>
                    <span className="font-mono text-amber-300 text-xs mt-1 block">
                      {activeOrder.deadlineDate}
                    </span>
                  </div>
                </div>

                {/* Engineering Documentation & CAD Quick Access */}
                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileCode2 className="w-4 h-4 text-cyan-400" />
                      مدارک مهندسی مرحله ({currentEngDoc?.drawingNumber || 'DWG-ACTIVE'})
                    </div>
                    {currentEngDoc && (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        تایید شده توسط مهندسی
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentEngDoc?.notes || 'تلورانس‌ها، زوایای ابزار و ضخامت براده‌برداری را دقیقاً مطابق با نقشه تنظیم نمایید.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
                    {currentEngDoc ? (
                      <button
                        onClick={() => onOpenCadViewer(currentEngDoc, activeOrder!.partName, activeOrder!.orderNumber)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                      >
                        <Eye className="w-4 h-4" />
                        باز کردن مدل ۳D STEP و نقشه ساخت مرحله
                      </button>
                    ) : (
                      <div className="text-xs text-amber-400">
                        در انتظار آپلود فایل نقشه توسط مهندسی...
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons (Touch Friendly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => {
                      setGoodQty(activeOrder!.quantity);
                      setShowFinishModal(true);
                    }}
                    disabled={currentMachine.status === 'breakdown'}
                    className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>اعلام اتمام مرحله ساخت (ارسال به QC)</span>
                  </button>

                  <button
                    onClick={() => setShowBreakdownModal(true)}
                    className="py-4 px-6 rounded-2xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-600/50 font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>اعلام خرابی دستگاه / توقف اضطراری</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                <Layers className="w-12 h-12 text-slate-600 mx-auto" />
                <p>این دستگاه در حال حاضر در وضعیت آماده‌به‌کار (Idle) قرار دارد.</p>
                <p className="text-slate-500">
                  مدیر تولید می‌تواند از کارتابل خود دستور کار بعدی را به این دستگاه اختصاص دهد.
                </p>
                <button
                  onClick={() => setShowBreakdownModal(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-800 text-rose-300 text-xs border border-slate-700 inline-flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  گزارش نقص فنی یا سرویس دوره‌ای
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Machine Technical Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                مشخصات فنی دستگاه مستقر
              </h4>
              <span className="font-mono text-xs text-slate-400">{currentMachine.code}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">نام دستگاه:</span>
                <span className="font-bold text-white">{currentMachine.name}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">موقعیت در سالن:</span>
                <span className="text-slate-200">{currentMachine.location}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">ظرفیت و ابعاد کارگیر:</span>
                <span className="text-slate-300 text-[11px] leading-relaxed block mt-0.5">
                  {currentMachine.specifications}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">شاخص سلامت دستگاه:</span>
                  <span className="font-mono font-bold text-emerald-400">{currentMachine.healthPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${currentMachine.healthPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operator Instructions Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-xs space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              چک‌لیست الزامات ایمنی و ماشین‌کاری
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">•</span>
                کنترل سطح روغن هیدرولیک و خنک‌کننده (Coolant) قبل از استارت
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">•</span>
                کالیبراسیون ساعت اندیکاتور و سنتر کردن قطعه کار
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">•</span>
                ثبت قطعات سالم و هرگونه ضایعات با دقت بالا در سامانه
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Modal: Finish Stage Reporting */}
      {showFinishModal && activeOrder && activeStage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              ثبت اتمام مرحله ماشین‌کاری
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              مرحله {activeStage.stageNumber}: {activeStage.stageName}
            </p>

            <form onSubmit={handleFinishSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    تعداد قطعات سالم و ماشین‌کاری شده:
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={goodQty}
                    onChange={(e) => setGoodQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-400 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    تعداد قطعات ضایعات (Scrap):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={scrapQty}
                    onChange={(e) => setScrapQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-rose-400 font-black text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  یادداشت اپراتور برای واحد کنترل کیفیت (QC):
                </label>
                <textarea
                  rows={2}
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="نکات براده‌برداری، صافی سطح، وضعیت ابزار..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  ثبت خروجی و ارجاع به بازرسی QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Breakdown */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              ثبت توقف اضطراری و خرابی دستگاه
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              با تایید این فرم، دستگاه {currentMachine.name} در سراسر شبکه به رنگ قرمز درمی‌آید و پیام هشدار برای سرپرست تولید ارسال می‌شود.
            </p>

            <form onSubmit={handleBreakdownSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  شرح نقص فنی یا دلیل توقف دستگاه:
                </label>
                <textarea
                  rows={3}
                  required
                  value={breakdownReason}
                  onChange={(e) => setBreakdownReason(e.target.value)}
                  placeholder="مثال: گیرپاژ محور X، افت فشار پمپ هیدرولیک، شکستگی اینسرت و آسیب به هلدر، داغ شدن اسپیندل..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  ثبت خرابی و توقف خط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
