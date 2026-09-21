import React, { useState } from 'react';
import {
  CompressorModel,
  PartDefinition,
  ProductionOrder,
  Priority,
  MachineTool,
  CreateOrderParams,
  StageEngineeringDoc,
  Quote
} from '../../types';
import { WorkflowStepper } from '../WorkflowStepper';
import { PersianDateInput } from '../PersianDateTimePicker';
import {
  PlusCircle,
  FileCheck2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Boxes,
  Cpu,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface CeoViewProps {
  models: CompressorModel[];
  parts: PartsList;
  orders: ProductionOrder[];
  machines: MachineTool[];
  onCreateOrder: (params: CreateOrderParams) => void;
  onDecideQuote: (orderId: string, quoteId: string, decision: 'approved' | 'rejected', reason?: string) => void;
  onOpenCadViewer: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

type PartsList = PartDefinition[];

const PRIORITY_COLORS = {
  normal: '#06b6d4',
  urgent: '#f59e0b',
  emergency: '#f43f5e'
};

export const CeoView: React.FC<CeoViewProps> = ({
  models,
  parts,
  orders,
  machines,
  onCreateOrder,
  onDecideQuote,
  onOpenCadViewer
}) => {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [orderMode, setOrderMode] = useState<'standard' | 'custom'>('standard');
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(4);
  const [priority, setPriority] = useState<Priority>('urgent');
  const [deadlineDate, setDeadlineDate] = useState<string>('۱۴۰۳/۰۷/۱۵');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Custom order states
  const [customPartName, setCustomPartName] = useState('');
  const [customApplication, setCustomApplication] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const [customSampleProvided, setCustomSampleProvided] = useState(false);

  // Quote Rejection State
  const [rejectingQuoteInfo, setRejectingQuoteInfo] = useState<{ orderId: string; quoteId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Right sidebar tab state
  type CeoTab = 'orders' | 'quotes' | 'analytics' | 'all';
  const [activeCeoTab, setActiveCeoTab] = useState<CeoTab>('orders');

  // Filter parts for selected model
  const availableParts = parts.filter(p => p.machineModelId === selectedModelId);
  const effectivePartId = availableParts.some(p => p.id === selectedPartId) ? selectedPartId : (availableParts[0]?.id || '');

  // Quotes awaiting CEO approval
  const pendingQuotesList: { order: ProductionOrder; quote: Quote }[] = [];
  orders.forEach(ord => {
    ord.quotes.forEach(q => {
      if (q.status === 'pending_ceo') {
        pendingQuotesList.push({ order: ord, quote: q });
      }
    });
  });

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (orderMode === 'standard') {
      const selectedModel = models.find(m => m.id === selectedModelId);
      const selectedPart = parts.find(p => p.id === effectivePartId);
      if (!selectedModel || !selectedPart) return;

      onCreateOrder({
        title: `تولید ${selectedPart.name} برای ${selectedModel.code}`,
        isCustomOrder: false,
        compressorModelId: selectedModel.id,
        compressorModelName: selectedModel.name,
        partId: selectedPart.id,
        partName: selectedPart.name,
        partNumber: selectedPart.partNumber,
        quantity,
        priority,
        deadlineDate,
        notes: orderNotes,
        createdByRole: 'ceo',
        createdByName: 'مدیرعامل (دکتر جمشیدی)'
      });
    } else {
      onCreateOrder({
        title: `سفارش ساخت سفارشی: ${customPartName}`,
        isCustomOrder: true,
        customDetails: {
          partName: customPartName,
          application: customApplication,
          material: customMaterial,
          technicalSpecs: customSpecs,
          sampleProvided: customSampleProvided
        },
        partName: customPartName,
        partNumber: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
        quantity,
        priority,
        deadlineDate,
        notes: orderNotes,
        createdByRole: 'ceo',
        createdByName: 'مدیرعامل (دکتر جمشیدی)'
      });
    }

    setShowNewOrderModal(false);
    // Reset
    setOrderNotes('');
    setCustomPartName('');
    setCustomSpecs('');
  };

  // KPI calculations
  const totalOrders = orders.length;
  const inProductionOrders = orders.filter(o => o.status === 'in_production').length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'semi_finished_stored').length;
  const activeMachines = machines.filter(m => m.status === 'active').length;

  // Chart data: Orders by Priority
  const priorityChartData = [
    { name: 'عادی', count: orders.filter(o => o.priority === 'normal').length, color: '#06b6d4' },
    { name: 'فوری', count: orders.filter(o => o.priority === 'urgent').length, color: '#f59e0b' },
    { name: 'اورژانسی', count: orders.filter(o => o.priority === 'emergency').length, color: '#f43f5e' }
  ];

  // Chart data: Progress per Order
  const orderProgressData = orders.slice(0, 5).map(o => ({
    name: o.orderNumber,
    پیشرفت: o.completionPercentage,
    تعداد: o.quantity
  }));

  return (
    <div className="space-y-6">
      
      {/* CEO Top Banner & Quick Action */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              داشبورد ارشد مدیرعامل
            </span>
            <span className="text-xs text-slate-400">نظارت بر تولید و زنجیره تامین</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            مدیریت خطوط تولید کمپرسورهای اسکرو و بلوئرها
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            صدور دستور ساخت برای ۵ مدل اصلی کارخانه، بررسی پیش‌فاکتورهای ریخته‌گری، سفارش قطعات خاص و پایش وضعیت لحظه‌ای ماشین‌آلات.
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <PlusCircle className="w-5 h-5" />
          <span>صدور دستور ساخت جدید</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">کل دستور ساختهای صادرشده</div>
            <div className="text-2xl font-black text-white mt-1">{totalOrders}</div>
            <div className="text-[11px] text-cyan-400 mt-0.5">{inProductionOrders} سفارش در حال ماشین‌کاری</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">پیش‌فاکتورهای نیازمند تایید</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingQuotesList.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">استعلام ریخته‌گری / متریال</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">وضعیت کارگاه و ماشین‌آلات</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeMachines} / {machines.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">دستگاه فعال در خطوط</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">تحویل شده به انبار محصول</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{completedOrders}</div>
            <div className="text-[11px] text-purple-300 mt-0.5">قطعات کامل و نیمه‌ساخته</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout: Right-hand Navigation Tabs + Left Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: CEO Navigation Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های مدیریت ارشد (CEO)</span>
              <span className="text-[10px] text-slate-400">هدایت استراتژیک کارخانه</span>
            </div>

            <button
              onClick={() => setActiveCeoTab('orders')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeCeoTab === 'orders'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="leading-snug">دستور ساخت‌ها و سفارشات</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 border border-amber-500/30 shrink-0">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCeoTab('quotes')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeCeoTab === 'quotes'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="leading-snug">تایید استعلامات و پیش‌فاکتورها</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 border border-amber-500/30 shrink-0">
                {pendingQuotesList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCeoTab('analytics')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeCeoTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="leading-snug">نمودارها و راندمان کارخانه</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700 shrink-0">
                تحلیل
              </span>
            </button>

            <button
              onClick={() => setActiveCeoTab('all')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeCeoTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="leading-snug">مشاهده تمام بخش‌ها همزمان</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Left Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* Critical Section: Pending Quotes for CEO Decision */}
      {(activeCeoTab === 'quotes' || activeCeoTab === 'all' || (activeCeoTab === 'orders' && pendingQuotesList.length > 0)) && pendingQuotesList.length > 0 && (
        <div className="bg-gradient-to-b from-amber-950/30 to-slate-900/60 rounded-3xl p-5 border border-amber-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-black text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>پیش‌فاکتورهای استعلام شده در انتظار تایید شما ({pendingQuotesList.length} فقره)</span>
            </div>
            <span className="text-xs text-slate-400">
              با تایید شما، دستور خرید صادر و متریال برای صدور PO خریداری می‌شود
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQuotesList.map(({ order, quote }) => (
              <div
                key={quote.id}
                className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      در انتظار تایید مدیرعامل
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">
                    {order.title}
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    قطعه: <span className="text-slate-200">{order.partName}</span> | تعداد: <span className="text-emerald-400 font-bold">{order.quantity} عدد</span>
                  </p>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">تامین‌کننده / ریخته‌گری:</span>
                      <span className="font-bold text-white">{quote.supplierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">مبلغ پیشنهادی:</span>
                      <span className="font-black text-emerald-400 text-sm">{quote.amountRials.toLocaleString()} ریال</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">مدت زمان تحویل:</span>
                      <span className="font-bold text-cyan-300">{quote.deliveryTimeDays} روز کاری</span>
                    </div>
                    {quote.notes && (
                      <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                        یادداشت: {quote.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onDecideQuote(order.id, quote.id, 'approved')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تایید پیش‌فاکتور و خرید
                  </button>

                  <button
                    onClick={() => setRejectingQuoteInfo({ orderId: order.id, quoteId: quote.id })}
                    className="py-2 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    رد استعلام
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Quotes Tab if none */}
      {activeCeoTab === 'quotes' && pendingQuotesList.length === 0 && (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="font-bold text-white text-sm">هیچ استعلام یا پیش‌فاکتوری در انتظار تایید مدیرعامل وجود ندارد</p>
          <p className="text-xs">کلیه پیش‌فاکتورهای ریخته‌گری و متریال توسط مدیر برنامه‌ریزی بررسی و تسویه شده‌اند.</p>
        </div>
      )}

      {/* Analytics Charts Grid */}
      {(activeCeoTab === 'analytics' || activeCeoTab === 'all') && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress of Top Active Orders */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              درصد پیشرفت دستور ساخت‌های جاری
            </h3>
            <span className="text-xs text-slate-400">به تفکیک شماره PO</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderProgressData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} unit="%" stroke="#64748b" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val) => [`${val}%`, 'پیشرفت ساخت']}
                />
                <Bar dataKey="پیشرفت" fill="#06b6d4" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie */}
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-amber-400" />
              توزیع اولویت‌های کاری در کارخانه
            </h3>
            <p className="text-xs text-slate-400 mb-4">میزان فوریت سفارشات ثبت شده</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 text-center border-t border-slate-800 pt-3">
            سفارشات اورژانسی اولویت ماشین‌کاری اول در کاروسل و فرز دروازه‌ای را دارند
          </div>
        </div>

      </div>
      )}

      {/* Production Orders List */}
      {(activeCeoTab === 'orders' || activeCeoTab === 'all') && (
      <div className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              کلیه سفارشات و دستور ساخت‌های کارخانه
            </h3>
            <p className="text-xs text-slate-400">رهگیری وضعیت از مرحله استعلام و مهندسی تا تولید و انبار</p>
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => {
            const hasEngineeringDocs = order.engineeringDocs.length > 0;
            const isCustom = order.isCustomOrder;

            return (
              <div
                key={order.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-bold">
                        {order.orderNumber}
                      </span>
                      {isCustom ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                          سفارش دستی خاص
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                          دستگاه استاندارد شرکت
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          order.priority === 'emergency'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : order.priority === 'urgent'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        اولویت: {order.priority === 'emergency' ? 'اورژانسی' : order.priority === 'urgent' ? 'فوری' : 'عادی'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mt-1.5">{order.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      قطعه: <span className="text-slate-200 font-medium">{order.partName}</span> ({order.partNumber}) | تعداد: <span className="text-cyan-300 font-bold">{order.quantity} عدد</span> | موعد تحویل: <span className="text-amber-400 font-mono">{order.deadlineDate}</span>
                    </p>
                  </div>

                  {/* Progress Badge */}
                  <div className="text-left">
                    <div className="text-xs text-slate-400">پیشرفت کل ساخت</div>
                    <div className="text-xl font-black text-cyan-400">{order.completionPercentage}%</div>
                  </div>
                </div>

                {/* Workflow Stepper */}
                <WorkflowStepper status={order.status} isDeliveredSemiFinished={order.isDeliveredSemiFinished} />

                {/* Stages & Engineering previews */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      ثبت کننده: <span className="text-slate-200">{order.createdByName}</span>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">
                      مراحل ماشین‌کاری: <span className="text-emerald-400 font-bold">{order.stages.length} مرحله</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasEngineeringDocs && (
                      <button
                        onClick={() => onOpenCadViewer(order.engineeringDocs[0], order.partName, order.orderNumber)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 transition flex items-center gap-1.5"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        مشاهده مدل ۳D و نقشه‌های مهندسی
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

        </div>
      </div>

      {/* Modal: New Production Order */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400">
                <PlusCircle className="w-6 h-6" />
                <h3 className="font-bold text-white text-lg">صدور دستور ساخت جدید (سفارش تولید)</h3>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2 my-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderMode('standard')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  orderMode === 'standard'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ۱. انتخاب از ۵ مدل دستگاه اصلی کارخانه (BOM استاندارد)
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  orderMode === 'custom'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ۲. سفارش دستی قطعه یا تجهیز خارج از کاتالوگ
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              
              {orderMode === 'standard' ? (
                <>
                  {/* Select Machine Model */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      انتخاب مدل دستگاه اصلی:
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => setSelectedModelId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.code}) - {m.type === 'screw' ? 'کمپرسور اسکرو' : 'بلوئر/لوپ'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Part from BOM */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      انتخاب قطعه از فهرست BOM دستگاه:
                    </label>
                    <select
                      value={effectivePartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {availableParts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} [{p.partNumber}] - متریال: {p.material} ({p.category === 'casting' ? 'ریخته‌گری' : 'تولید داخل'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Custom Manual Order Details */
                <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-purple-900/40">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-2">
                    <Boxes className="w-4 h-4" />
                    مشخصات قطعه یا تجهیز سفارشی خارج از کاتالوگ شرکت:
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">نام قطعه یا تجهیز:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: روتور وکیوم پمپ لوب تایپ ضداسید..."
                      value={customPartName}
                      onChange={(e) => setCustomPartName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">کاربرد و شرایط کاری:</label>
                      <input
                        type="text"
                        placeholder="مثال: صنایع دارویی، مقاوم به حرارت..."
                        value={customApplication}
                        onChange={(e) => setCustomApplication(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">جنس و متریال پیشنهادی:</label>
                      <input
                        type="text"
                        placeholder="مثال: استنلس استیل ۳۱۶L فورج، برنز..."
                        value={customMaterial}
                        onChange={(e) => setCustomMaterial(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">مشخصات فنی و ابعادی:</label>
                    <textarea
                      rows={2}
                      placeholder="ابعاد، قطر کارگیر، صافی سطح یا تلورانس‌های خاص..."
                      value={customSpecs}
                      onChange={(e) => setCustomSpecs(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSampleProvided}
                      onChange={(e) => setCustomSampleProvided(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-purple-600"
                    />
                    <span>نمونه فیزیکی قطعه یا شابلون به واحد مهندسی تحویل داده شده است</span>
                  </label>
                </div>
              )}

              {/* Quantity, Priority & Deadline */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">تعداد قطعه:</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">اولویت و فوریت ساخت:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                  >
                    <option value="normal">عادی (Normal)</option>
                    <option value="urgent">فوری (Urgent)</option>
                    <option value="emergency">اورژانسی (Emergency)</option>
                  </select>
                </div>

                <div>
                  <PersianDateInput
                    label="تاریخ و ساعت موعد تحویل:"
                    value={deadlineDate}
                    onChange={setDeadlineDate}
                    includeTime={true}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">دستورات و الزامات مدیرعامل:</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="نکات خاص فنی، اولویت تامین، مشتری نهایی یا تلورانس‌های کنترلی..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  صدور قطعی دستور ساخت و ابلاغ به برنامه‌ریزی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quote Rejection */}
      {rejectingQuoteInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-rose-400 mb-2 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              رد استعلام پیش‌فاکتور
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              لطفاً دلیل رد پیش‌فاکتور را وارد فرمایید تا واحد برنامه‌ریزی مجدداً از تامین‌کننده یا ریخته‌گری دیگری استعلام بگیرد:
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: قیمت غیرواقعی و بالا است، زمان تحویل بسیار طولانی است، سابقه کیفی قطعات ریختگی مطلوب نبوده..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingQuoteInfo(null)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  onDecideQuote(rejectingQuoteInfo.orderId, rejectingQuoteInfo.quoteId, 'rejected', rejectionReason);
                  setRejectingQuoteInfo(null);
                  setRejectionReason('');
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                ثبت رد استعلام
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
