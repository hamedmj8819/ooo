import React, { useState } from 'react';
import {
  ProductionOrder,
  MachineTool,
  FoundryPartner,
  CompressorModel,
  PartDefinition,
  CreateOrderParams,
  CreateQuoteParams,
  StageEngineeringDoc,
  Priority
} from '../../types';
import { WorkflowStepper } from '../WorkflowStepper';
import { MachineStatusGrid } from '../MachineStatusGrid';
import { PersianDateInput } from '../PersianDateTimePicker';
import {
  ClipboardList,
  PlusCircle,
  FileCheck2,
  DollarSign,
  PackageCheck,
  Send,
  Building2,
  TrendingUp,
  Cpu,
  Layers,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';

interface PlanningViewProps {
  orders: ProductionOrder[];
  machines: MachineTool[];
  foundries: FoundryPartner[];
  models: CompressorModel[];
  parts: PartDefinition[];
  onAddQuote: (orderId: string, quoteData: CreateQuoteParams) => void;
  onMaterialReceivedAndIssuePO: (orderId: string) => void;
  onCreateOrder: (params: CreateOrderParams) => void;
  onOpenCadViewer: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
  onReportBreakdown: (machineId: string, reason: string) => void;
  onResolveBreakdown: (machineId: string) => void;
  onHandoverToWarehouse?: (orderId: string, quantity?: number, isSemiFinished?: boolean) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  orders,
  machines,
  foundries,
  models,
  parts,
  onAddQuote,
  onMaterialReceivedAndIssuePO,
  onCreateOrder,
  onOpenCadViewer,
  onReportBreakdown,
  onResolveBreakdown,
  onHandoverToWarehouse
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'machines' | 'inquiries'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal for registering a new quote from foundry/supplier
  const [quoteModalOrderId, setQuoteModalOrderId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierType, setSupplierType] = useState<'foundry' | 'raw_material' | 'outsourcing' | 'importer'>('foundry');
  const [quoteAmount, setQuoteAmount] = useState<number>(1200000000);
  const [deliveryDays, setDeliveryDays] = useState<number>(12);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteFileName, setQuoteFileName] = useState('Pishfactor-Rikhtegari.pdf');

  // Modal for Planning issuing new order directly
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id || '');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [orderQty, setOrderQty] = useState(4);
  const [orderPriority, setOrderPriority] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [orderDeadline, setOrderDeadline] = useState('۱۴۰۳/۰۷/۲۰');

  const availableParts = parts.filter(p => p.machineModelId === selectedModelId);
  const effectivePartId = availableParts.some(p => p.id === selectedPartId) ? selectedPartId : (availableParts[0]?.id || '');

  const handleAddQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteModalOrderId) {
      onAddQuote(quoteModalOrderId, {
        supplierName,
        supplierType,
        amountRials: quoteAmount,
        deliveryTimeDays: deliveryDays,
        notes: quoteNotes,
        attachmentFileName: quoteFileName
      });
      setQuoteModalOrderId(null);
      setQuoteNotes('');
    }
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selModel = models.find(m => m.id === selectedModelId);
    const selPart = parts.find(p => p.id === effectivePartId);
    if (!selModel || !selPart) return;

    onCreateOrder({
      title: `دستور ساخت برنامه‌ریزی: ${selPart.name} برای ${selModel.code}`,
      isCustomOrder: false,
      compressorModelId: selModel.id,
      compressorModelName: selModel.name,
      partId: selPart.id,
      partName: selPart.name,
      partNumber: selPart.partNumber,
      quantity: orderQty,
      priority: orderPriority,
      deadlineDate: orderDeadline,
      createdByRole: 'planning',
      createdByName: 'مدیر برنامه‌ریزی و تولید'
    });

    setShowNewOrderModal(false);
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.includes(searchQuery) ||
                          o.partName.includes(searchQuery) ||
                          o.title.includes(searchQuery);
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'in_production') return matchesSearch && o.status === 'in_production';
    if (statusFilter === 'awaiting_engineering') return matchesSearch && o.status === 'awaiting_engineering';
    if (statusFilter === 'quotes') return matchesSearch && (o.status === 'planning_inquiry' || o.status === 'pending_ceo_quote');
    if (statusFilter === 'completed') return matchesSearch && (o.status === 'completed' || o.status === 'semi_finished_stored');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Planning Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
              واحد برنامه‌ریزی و کنترل تولید (PPC)
            </span>
            <span className="text-xs text-slate-400">زنجیره تامین، استعلامات و رهگیری PO</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            مرکز هدایت و برنامه‌ریزی خطوط ماشین‌کاری کارخانه
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            صدور پیش‌فاکتور از ریخته‌گری‌ها و تامین‌کنندگان، دریافت تاییدیه مدیرعامل، صدور PO پس از ورود متریال و درخواست خودکار نقشه‌های مهندسی.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>صدور دستور ساخت مستقیم (برنامه‌ریزی)</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Right-hand Tabs Navigation + Left-hand Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: Planning Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های برنامه‌ریزی (PPC)</span>
              <span className="text-[10px] text-slate-400">کنترل تولید و زنجیره تامین</span>
            </div>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 shrink-0 text-blue-400" />
                <span className="leading-snug">رهگیری دستور ساخت‌ها و POها</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-blue-300 border border-blue-500/30 shrink-0">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('machines')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'machines'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 shrink-0 text-blue-400" />
                <span className="leading-snug">مانیتورینگ ماشین‌آلات کارخانه</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-blue-300 border border-blue-500/30 shrink-0">
                {machines.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeTab === 'inquiries'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0 text-blue-400" />
                <span className="leading-snug">تامین‌کنندگان و ریخته‌گری‌ها</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-blue-300 border border-blue-500/30 shrink-0">
                {foundries.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Left Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو بر اساس شماره PO، نام قطعه، مدل کمپرسور..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> فیلتر وضعیت:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="all">همه سفارشات</option>
                <option value="quotes">در انتظار استعلام / تایید پیش‌فاکتور</option>
                <option value="awaiting_engineering">در انتظار نقشه‌های مهندسی</option>
                <option value="in_production">در حال ماشین‌کاری و ساخت</option>
                <option value="completed">تحویل داده شده به انبار</option>
              </select>
            </div>
          </div>

          {/* List of Orders with Planning Action Center */}
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isAwaitingQuote = order.status === 'planning_inquiry' || order.status === 'pending_planning' || order.status === 'quote_rejected';
              const isQuoteApproved = order.status === 'material_ordered';
              const isAwaitingEng = order.status === 'awaiting_engineering';
              const isInProduction = order.status === 'in_production';

              return (
                <div
                  key={order.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          ثبت: {order.createdDate} توسط {order.createdByName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.priority === 'emergency'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : order.priority === 'urgent'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.priority === 'emergency' ? 'اورژانسی' : order.priority === 'urgent' ? 'فوری' : 'عادی'}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mt-1.5">{order.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        قطعه: <span className="text-cyan-300 font-semibold">{order.partName}</span> | تعداد: <span className="font-bold text-emerald-400">{order.quantity} عدد</span> | موعد تحویل: <span className="font-mono text-amber-300">{order.deadlineDate}</span>
                      </p>
                    </div>

                    {/* Planning Quick Status Badge */}
                    <div className="text-left">
                      <span className="text-xs text-slate-400 block">پیشرفت ساخت:</span>
                      <span className="text-xl font-black text-cyan-400">{order.completionPercentage}%</span>
                    </div>
                  </div>

                  {/* Workflow Lifecycle */}
                  <WorkflowStepper status={order.status} isDeliveredSemiFinished={order.isDeliveredSemiFinished} />

                  {/* Operational Stage Progress Breakdown */}
                  {order.stages.length > 0 && (
                    <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          پیشرفت مراحل ماشین‌کاری و کنترل کیفی (QC):
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {order.stages.filter(s => s.status === 'completed').length} از {order.stages.length} مرحله کامل شده
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {order.stages.map((stg) => (
                          <div
                            key={stg.stageNumber}
                            className={`p-2 rounded-xl text-xs border ${
                              stg.status === 'completed'
                                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                                : stg.status === 'engineering_qc_pending'
                                ? 'bg-blue-950/40 border-blue-800/50 text-blue-200 animate-pulse'
                                : stg.status === 'qc_pending'
                                ? 'bg-amber-950/40 border-amber-800/50 text-amber-200 animate-pulse'
                                : stg.status === 'qc_rejected'
                                ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                                : stg.status === 'in_progress'
                                ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-200'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>مرحله {stg.stageNumber}</span>
                              <span className="text-[10px]">
                                {stg.status === 'completed'
                                  ? 'تایید مهندسی ✓'
                                  : stg.status === 'engineering_qc_pending'
                                  ? 'تایید مهندسی QC'
                                  : stg.status === 'qc_pending'
                                  ? 'در انتظار QC'
                                  : stg.status === 'qc_rejected'
                                  ? 'رد QC (اصلاح)'
                                  : stg.status === 'in_progress'
                                  ? 'در حال ساخت'
                                  : 'شروع نشده'}
                              </span>
                            </div>
                            <div className="text-[11px] truncate mt-0.5">{stg.stageName}</div>
                            {stg.machineToolName && (
                              <div className="text-[10px] text-slate-400 truncate mt-1">
                                دستگاه: {stg.machineToolName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Planning Interactive Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {order.quotes.length > 0 && (
                        <span>
                          پیش‌فاکتورها: <strong className="text-white">{order.quotes.length} فقره ثبت شده</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      
                      {/* Action: Handover completed part to warehouse */}
                      {order.status === 'awaiting_planning_handover' && onHandoverToWarehouse && (
                        <button
                          onClick={() => onHandoverToWarehouse(order.id, order.quantity, false)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/25 animate-pulse"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>تحویل قطعه تموم‌کار به انبار (صدور رسید انبار)</span>
                        </button>
                      )}

                      {/* Action 1: Add Foundry/Vendor Quote */}
                      {isAwaitingQuote && (
                        <button
                          onClick={() => {
                            setQuoteModalOrderId(order.id);
                            setSupplierName(foundries[0]?.name || 'ریخته‌گری دقیق اصفهان');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow"
                        >
                          <DollarSign className="w-4 h-4" />
                          ثبت پیش‌فاکتور استعلام شده و ارسال به مدیرعامل
                        </button>
                      )}

                      {/* Action 2: Material Arrived -> Issue PO & Request Engineering Drawings */}
                      {isQuoteApproved && (
                        <button
                          onClick={() => onMaterialReceivedAndIssuePO(order.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                        >
                          <PackageCheck className="w-4 h-4" />
                          تایید ورود متریال/ریخته‌گری و صدور PO (ارسال به مهندسی)
                        </button>
                      )}

                      {/* Info if awaiting engineering */}
                      {isAwaitingEng && (
                        <span className="text-xs text-amber-400 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-800/80 font-medium">
                          در انتظار بارگذاری نقشه‌ها و فایل‌های STEP توسط واحد مهندسی
                        </span>
                      )}

                      {/* CAD view */}
                      {order.engineeringDocs.length > 0 && (
                        <button
                          onClick={() => onOpenCadViewer(order.engineeringDocs[0], order.partName, order.orderNumber)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 text-xs transition flex items-center gap-1.5"
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          نقشه‌ها و فایل ۳D STEP
                        </button>
                      )}

                      <button
                        onClick={() => window.print()}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                        title="چاپ دستور ساخت (Job Traveler)"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      ) : activeTab === 'machines' ? (
        /* Machine Tools Shop Floor Monitor */
        <MachineStatusGrid
          machines={machines}
          onReportBreakdown={onReportBreakdown}
          onResolveBreakdown={onResolveBreakdown}
          canManageBreakdowns={true}
        />
      ) : (
        /* Foundries & Suppliers List */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {foundries.map((fnd) => (
            <div
              key={fnd.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {fnd.id}
                </span>
                <span className="text-xs text-amber-400 font-bold">★ {fnd.qualityRating} / 5.0</span>
              </div>
              <h4 className="text-sm font-bold text-white">{fnd.name}</h4>
              <p className="text-xs text-slate-400">مدیر فروش: {fnd.manager} | تلفن: {fnd.phone}</p>
              <p className="text-xs text-slate-400">آدرس: {fnd.city}</p>

              <div className="pt-2 border-t border-slate-800 text-xs">
                <div className="text-slate-500 font-semibold mb-1">قابلیت‌های ریخته‌گری:</div>
                <div className="flex flex-wrap gap-1">
                  {fnd.capabilities.map((cap, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        </div>
      </div>

      {/* Modal: Add Quote from Foundry / Vendor */}
      {quoteModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <DollarSign className="w-6 h-6" />
                <h3 className="font-bold text-white text-base">ثبت پیش‌فاکتور دریافتی از ریخته‌گری / تامین‌کننده</h3>
              </div>
              <button
                onClick={() => setQuoteModalOrderId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuoteSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام ریخته‌گری یا تامین‌کننده:</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="مثال: شرکت ریخته‌گری دقیق اصفهان، ساوه چدن..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">نوع تامین:</label>
                  <select
                    value={supplierType}
                    onChange={(e) =>
                      setSupplierType(
                        e.target.value as 'foundry' | 'raw_material' | 'outsourcing' | 'importer'
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="foundry">ریخته‌گری چدن / برنز</option>
                    <option value="raw_material">فولاد آلیاژی / شمش خام</option>
                    <option value="outsourcing">خدمات برون‌سپاری ماشین‌کاری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">مدت زمان تحویل (روز):</label>
                  <input
                    type="number"
                    min={1}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">مبلغ کل پیش‌فاکتور (ریال):</label>
                <input
                  type="number"
                  step={1000000}
                  required
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-emerald-400 font-black text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  معادل: {(quoteAmount / 10).toLocaleString()} تومان
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">فایل پیوست پیش‌فاکتور (PDF / تصویر):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quoteFileName}
                    onChange={(e) => setQuoteFileName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                  />
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl border border-slate-700 cursor-pointer">
                    انتخاب فایل
                    <input type="file" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) setQuoteFileName(e.target.files[0].name);
                    }} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">یادداشت فنی و شرایط پرداخت:</label>
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="مثال: ۵۰ درصد پیش‌پرداخت، تست متالوژی GGG40 با گواهی رسمی ریخته‌گری..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuoteModalOrderId(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Send className="w-4 h-4" />
                  ارسال مستقیم پیش‌فاکتور برای تایید مدیرعامل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Planning Direct New Order */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                صدور مستقیم دستور ساخت از واحد برنامه‌ریزی
              </h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">مدل دستگاه شرکت:</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">انتخاب قطعه از BOM:</label>
                <select
                  value={effectivePartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  {availableParts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} [{p.partNumber}]</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">تعداد:</label>
                  <input
                    type="number"
                    min={1}
                    value={orderQty}
                    onChange={(e) => setOrderQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">اولویت:</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as Priority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
                  >
                    <option value="normal">عادی</option>
                    <option value="urgent">فوری</option>
                    <option value="emergency">اورژانسی</option>
                  </select>
                </div>
                <div>
                  <PersianDateInput
                    label="موعد تحویل:"
                    value={orderDeadline}
                    onChange={setOrderDeadline}
                    includeTime={true}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  ثبت دستور ساخت برنامه‌ریزی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
