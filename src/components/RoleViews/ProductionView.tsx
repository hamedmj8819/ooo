import React, { useState } from 'react';
import {
  ProductionOrder,
  MachineTool,
  OperatorProfile
} from '../../types';
import { MachineStatusGrid } from '../MachineStatusGrid';
import {
  Cog,
  UserCheck,
  CheckCircle2,
  Clock,
  Layers,
  Wrench,
  AlertTriangle,
  Play,
  Users,
  Activity,
  Sparkles,
  BarChart3,
  Calendar
} from 'lucide-react';

interface ProductionViewProps {
  orders: ProductionOrder[];
  machines: MachineTool[];
  operators: OperatorProfile[];
  onAssignStage: (orderId: string, stageNumber: number, machineId: string, operatorId: string) => void;
  onReportBreakdown: (machineId: string, reason: string) => void;
  onResolveBreakdown: (machineId: string) => void;
  onApproveQC: (orderId: string, stageNumber: number, inspector: string, notes?: string) => void;
  onHandoverWarehouse: (orderId: string, qty: number, isSemiFinished: boolean) => void;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  orders,
  machines,
  operators,
  onAssignStage,
  onReportBreakdown,
  onResolveBreakdown,
  onApproveQC,
  onHandoverWarehouse
}) => {
  const [activeTab, setActiveTab] = useState<'assignment' | 'shopfloor' | 'operators' | 'qc'>('assignment');
  
  // Assignment Modal
  const [assigningStage, setAssigningStage] = useState<{
    orderId: string;
    stageNumber: number;
    stageName: string;
    partName: string;
  } | null>(null);

  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || '');

  // QC inspection modal
  const [qcInspectOrder, setQcInspectOrder] = useState<{
    orderId: string;
    stageNumber: number;
    stageName: string;
    goodQty: number;
    scrapQty: number;
  } | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [qcInspectorName, setQcInspectorName] = useState('مهندس اسدی (سرممیز QC)');

  // Warehouse handover modal
  const [handoverOrderId, setHandoverOrderId] = useState<string | null>(null);
  const [handoverQty, setHandoverQty] = useState<number>(4);
  const [isSemiFinished, setIsSemiFinished] = useState<boolean>(false);

  // Orders that are either approved by engineering or currently in production
  const productionReadyOrders = orders.filter(
    o => o.status === 'engineering_approved' || o.status === 'in_production' || o.status === 'assigned_to_production'
  );

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assigningStage) {
      onAssignStage(
        assigningStage.orderId,
        assigningStage.stageNumber,
        selectedMachineId,
        selectedOperatorId
      );
      setAssigningStage(null);
    }
  };

  const handleQcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qcInspectOrder) {
      onApproveQC(
        qcInspectOrder.orderId,
        qcInspectOrder.stageNumber,
        qcInspectorName,
        qcNotes
      );
      setQcInspectOrder(null);
      setQcNotes('');
    }
  };

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handoverOrderId) {
      onHandoverWarehouse(handoverOrderId, handoverQty, isSemiFinished);
      setHandoverOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              مدیریت سالن تولید و ماشین‌کاری
            </span>
            <span className="text-xs text-slate-400">تخصیص دستور کارها، مانیتورینگ دستگاه‌ها و پرسنل</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            سالن ماشین‌کاری قطعات سنگین و روتورهای کمپرسور
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            تخصیص دستور ساخت‌های مهندسی‌شده به ماشین‌آلات (سنگ مغناطیس، تراش منوال، CNC، فرز دروازه‌ای، بورینگ و کاروسل) و ثبت آمار تولید روزانه اپراتورها.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] text-slate-400 block">دستگاه‌های فعال:</span>
            <span className="text-xl font-black text-emerald-400">
              {machines.filter(m => m.status === 'active').length} / {machines.length}
            </span>
          </div>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center min-w-[110px]">
            <span className="text-[11px] text-slate-400 block">اپراتورهای شیفت:</span>
            <span className="text-xl font-black text-cyan-400">
              {operators.length} نفر
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout: Right-hand Tabs Navigation + Left-hand Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: Production Navigation Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های مدیریت سالن تولید</span>
              <span className="text-[10px] text-slate-400">هدایت خطوط و تخصیص اپراتورها</span>
            </div>

            <button
              onClick={() => setActiveTab('assignment')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'assignment'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 ring-2 ring-rose-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">تخصیص مراحل ساخت و دستگاه‌ها</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-300 border border-rose-500/30 shrink-0">
                {productionReadyOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shopfloor')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'shopfloor'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 ring-2 ring-rose-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">وضعیت زنده سالن و توقفات</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-300 border border-rose-500/30 shrink-0">
                {machines.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('operators')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'operators'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 ring-2 ring-rose-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">آمار خروجی و عملکرد اپراتورها</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-300 border border-rose-500/30 shrink-0">
                {operators.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Left Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* Tab 1: Stage Assignment */}
      {activeTab === 'assignment' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>
              سفارشات زیر نقشه‌های مهندسی را دریافت کرده و آماده تخصیص به ماشین‌کاران هستند:
            </span>
            <span className="text-cyan-400 font-bold">
              {productionReadyOrders.length} سفارش در صف تولید
            </span>
          </div>

          <div className="space-y-4">
            {productionReadyOrders.map((order) => {
              const allStagesDone = order.stages.length > 0 && order.stages.every(s => s.status === 'completed');

              return (
                <div
                  key={order.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-400">{order.partNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.priority === 'emergency'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.priority === 'emergency' ? 'اورژانسی' : order.priority === 'urgent' ? 'فوری' : 'عادی'}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">{order.title}</h4>
                      <p className="text-xs text-slate-300">
                        قطعه: <span className="text-cyan-300 font-semibold">{order.partName}</span> | تیراژ: <span className="text-emerald-400 font-bold">{order.quantity} عدد</span> | موعد: <span className="font-mono text-amber-300">{order.deadlineDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {allStagesDone && order.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setHandoverOrderId(order.id);
                            setHandoverQty(order.quantity);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          اتمام کل ساخت و صدور حواله انبار
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi-Stage Machining Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">مرحله</th>
                          <th className="p-3">شرح عملیات ماشین‌کاری</th>
                          <th className="p-3">دستگاه تخصیص‌یافته</th>
                          <th className="p-3">اپراتور مجری</th>
                          <th className="p-3">وضعیت مرحله</th>
                          <th className="p-3">قطعات سالم / ضایعات</th>
                          <th className="p-3 text-center">اقدام مدیر تولید</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {order.stages.map((stage) => {
                          const isAssigned = !!stage.machineToolId;
                          const isQcPending = stage.status === 'qc_pending';
                          const isCompleted = stage.status === 'completed';

                          return (
                            <tr key={stage.stageNumber} className="hover:bg-slate-800/40 transition">
                              <td className="p-3 font-bold text-white whitespace-nowrap">
                                مرحله {stage.stageNumber}
                              </td>
                              <td className="p-3 text-slate-200">
                                {stage.stageName}
                                {stage.isOutsourced && (
                                  <span className="mr-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                                    برون‌سپاری
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-cyan-300 font-mono">
                                {stage.machineToolName || <span className="text-slate-500 italic">تعیین نشده</span>}
                              </td>
                              <td className="p-3 text-slate-300">
                                {stage.operatorName || <span className="text-slate-500 italic">تعیین نشده</span>}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {isCompleted ? (
                                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> تایید QC شده
                                  </span>
                                ) : isQcPending ? (
                                  <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3.5 h-3.5" /> منتظر بازرسی QC
                                  </span>
                                ) : stage.status === 'in_progress' ? (
                                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                                    <Cog className="w-3.5 h-3.5 animate-spin" /> در حال تراشکاری
                                  </span>
                                ) : (
                                  <span className="text-slate-500">آماده واگذاری</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-300">
                                {stage.producedQty > 0 ? (
                                  <span>
                                    <strong className="text-emerald-400">{stage.producedQty} سالم</strong> / {stage.scrapQty} ضایعات
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {isQcPending ? (
                                  <button
                                    onClick={() => setQcInspectOrder({
                                      orderId: order.id,
                                      stageNumber: stage.stageNumber,
                                      stageName: stage.stageName,
                                      goodQty: stage.producedQty,
                                      scrapQty: stage.scrapQty
                                    })}
                                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition"
                                  >
                                    بررسی و تایید کیفی (QC)
                                  </button>
                                ) : !isCompleted ? (
                                  <button
                                    onClick={() => setAssigningStage({
                                      orderId: order.id,
                                      stageNumber: stage.stageNumber,
                                      stageName: stage.stageName,
                                      partName: order.partName
                                    })}
                                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition"
                                  >
                                    تخصیص به دستگاه و اپراتور
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-500">پایان یافته ✓</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Shop floor machine status */}
      {activeTab === 'shopfloor' && (
        <MachineStatusGrid
          machines={machines}
          onReportBreakdown={onReportBreakdown}
          onResolveBreakdown={onResolveBreakdown}
          canManageBreakdowns={true}
        />
      )}

      {/* Tab 3: Operator workloads */}
      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((op) => (
            <div
              key={op.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {op.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{op.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">کد: {op.personnelCode}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    op.status === 'working'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {op.status === 'working' ? 'در حال کار' : 'آماده به کار'}
                </span>
              </div>

              <p className="text-xs text-slate-400">{op.specialty}</p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">دستگاه تخصیص‌یافته:</span>
                  <span className="text-cyan-300 font-mono">
                    {machines.find(m => m.id === op.assignedMachineId)?.name || 'دستگاه آزاد'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">تعداد قطعه تولیدی امروز:</span>
                  <span className="text-emerald-400 font-bold">{op.totalPartsProducedToday} عدد</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شیفت کاری:</span>
                  <span className="text-slate-200">
                    {op.shift === 'morning' ? 'صبح' : op.shift === 'evening' ? 'عصر' : 'شب'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        </div>
      </div>

      {/* Modal: Assign Stage to Machine & Operator */}
      {assigningStage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-400" />
                تخصیص مرحله ماشین‌کاری به خط تولید
              </h3>
              <button onClick={() => setAssigningStage(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="my-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">سفارش: <strong className="text-white">{assigningStage.orderId}</strong></div>
              <div className="text-slate-400">مرحله {assigningStage.stageNumber}: <strong className="text-cyan-300">{assigningStage.stageName}</strong></div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  انتخاب دستگاه ماشین‌کاری (از سالن تولید):
                </label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id} disabled={m.status === 'breakdown'}>
                      {m.name} [{m.code}] - وضعیت: {m.status === 'active' ? 'در حال کار' : m.status === 'breakdown' ? 'خراب (غیرقابل انتخاب)' : 'آماده به کار'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  انتخاب اپراتور یا استادکار مجری:
                </label>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} - تخصص: {o.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningStage(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Play className="w-4 h-4" />
                  شروع فرآیند ساخت روی دستگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QC Inspection & Approval */}
      {qcInspectOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2 mb-3 text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
              تاییدیه بازرسی کنترل کیفی (QC) مرحله
            </h3>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              تعداد <strong className="text-emerald-400">{qcInspectOrder.goodQty} قطعه سالم</strong> و <strong className="text-rose-400">{qcInspectOrder.scrapQty} قطعه ضایعات</strong> توسط اپراتور گزارش شده است.
            </p>

            <form onSubmit={handleQcSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام بازرس QC:</label>
                <input
                  type="text"
                  required
                  value={qcInspectorName}
                  onChange={(e) => setQcInspectorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">گزارش بازرسی و ابعاد چک‌شده:</label>
                <textarea
                  rows={3}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="ابعاد با میکرومتر و شابلون کنترل گردید، تلورانس‌ها مطابق نقشه پاس شد..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQcInspectOrder(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  صدور تاییدیه کیفی و انتقال به مرحله بعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Warehouse Handover */}
      {handoverOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              تحویل قطعات تولیدی به انبار کارخانه
            </h3>
            
            <form onSubmit={handleHandoverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">تعداد قطعات تحویلی:</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={handoverQty}
                  onChange={(e) => setHandoverQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                <input
                  type="checkbox"
                  checked={isSemiFinished}
                  onChange={(e) => setIsSemiFinished(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
                <div>
                  <span className="font-bold text-white block">تحویل به عنوان قطعه نیمه‌ساخته</span>
                  <span className="text-[11px] text-slate-400">
                    در صورتی که قطعه هنوز نیاز به مونتاژ نهایی یا مراحل تکمیلی دارد
                  </span>
                </div>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverOrderId(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  صدور رسید ورود به انبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
