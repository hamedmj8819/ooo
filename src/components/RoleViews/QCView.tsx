import React, { useState } from 'react';
import {
  ProductionOrder,
  MachineTool,
  StageExecutionProgress,
  StageEngineeringDoc,
  PartDefinition
} from '../../types';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  FileText,
  Eye,
  FileCheck,
  Search,
  Layers,
  ArrowLeft,
  X,
  Sparkles,
  Printer,
  ShieldCheck,
  HardHat,
  Cpu,
  BadgeAlert,
  Send,
  HelpCircle,
  Compass
} from 'lucide-react';

interface QCViewProps {
  orders: ProductionOrder[];
  machines?: MachineTool[];
  parts?: PartDefinition[];
  onSubmitStageQC: (
    orderId: string,
    stageNumber: number,
    reportData: {
      inspectorName: string;
      inspectorPersonnelCode?: string;
      passedQty: number;
      rejectedQty: number;
      conditionalQty: number;
      decision: 'approved' | 'conditional' | 'rejected';
      dimensionalCheckPassed: boolean;
      surfaceRoughnessPassed: boolean;
      hardnessRockwell?: string;
      roughnessRa?: string;
      measuredTolerances?: string;
      notes: string;
      sheetFileName: string;
      sheetFileSize?: string;
    }
  ) => void;
  onOpenCadViewer?: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

export const QCView: React.FC<QCViewProps> = ({
  orders,
  machines = [],
  onSubmitStageQC,
  onOpenCadViewer
}) => {
  const [filterTab, setFilterTab] = useState<'pending_qc' | 'pending_eng' | 'all' | 'completed'>('pending_qc');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspection Modal State
  const [selectedInspection, setSelectedInspection] = useState<{
    order: ProductionOrder;
    stage: StageExecutionProgress;
  } | null>(null);

  // Form Fields for QC Sheet
  const [inspectorName, setInspectorName] = useState('مهندس کاظمی');
  const [inspectorCode, setInspectorCode] = useState('EMP-4001');
  const [passedQty, setPassedQty] = useState<number>(1);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [conditionalQty, setConditionalQty] = useState<number>(0);
  const [decision, setDecision] = useState<'approved' | 'conditional' | 'rejected'>('approved');
  const [dimPassed, setDimPassed] = useState(true);
  const [roughnessPassed, setRoughnessPassed] = useState(true);
  const [hardness, setHardness] = useState('56 HRC');
  const [roughnessRa, setRoughnessRa] = useState('Ra 0.8 µm');
  const [measuredTolerances, setMeasuredTolerances] = useState('انحراف قطر کمتر از ۰.۰۰۸ میلی‌متر - لنگی شعاعی درون محدوده مجاز');
  const [qcNotes, setQcNotes] = useState('');
  const [sheetFileName, setSheetFileName] = useState('QC_Report_Form.pdf');
  const [sheetFileSize, setSheetFileSize] = useState('1.2 MB');
  const [isDragOver, setIsDragOver] = useState(false);

  // View Sheet Details Modal
  const [viewingSheetDoc, setViewingSheetDoc] = useState<{
    order: ProductionOrder;
    stage: StageExecutionProgress;
  } | null>(null);

  // Flatten all stages across active orders with order context
  const allOrderStages: { order: ProductionOrder; stage: StageExecutionProgress }[] = [];
  orders.forEach(ord => {
    (ord.stages || []).forEach(stg => {
      allOrderStages.push({ order: ord, stage: stg });
    });
  });

  // Calculate quick metrics
  const pendingQCStages = allOrderStages.filter(item => item.stage.status === 'qc_pending');
  const pendingEngStages = allOrderStages.filter(item => item.stage.status === 'engineering_qc_pending');
  const completedStages = allOrderStages.filter(item => item.stage.status === 'completed');
  const rejectedStages = allOrderStages.filter(item => item.stage.status === 'qc_rejected');

  // Filter list by tab & search
  const filteredList = allOrderStages.filter(item => {
    // Tab match
    if (filterTab === 'pending_qc' && item.stage.status !== 'qc_pending') return false;
    if (filterTab === 'pending_eng' && item.stage.status !== 'engineering_qc_pending') return false;
    if (filterTab === 'completed' && item.stage.status !== 'completed') return false;

    // Search query match
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.order.orderNumber.toLowerCase().includes(q) ||
      item.order.partName.toLowerCase().includes(q) ||
      item.stage.stageName.toLowerCase().includes(q) ||
      (item.stage.operatorName && item.stage.operatorName.toLowerCase().includes(q)) ||
      (item.stage.machineToolName && item.stage.machineToolName.toLowerCase().includes(q))
    );
  });

  const openInspectionModal = (order: ProductionOrder, stage: StageExecutionProgress) => {
    setSelectedInspection({ order, stage });
    const targetQty = stage.producedQty || order.quantity || 1;
    setPassedQty(targetQty);
    setRejectedQty(0);
    setConditionalQty(0);
    setDecision('approved');
    setDimPassed(true);
    setRoughnessPassed(true);
    setHardness('58 HRC');
    setRoughnessRa('Ra 0.8 µm');
    setMeasuredTolerances(`انحرافات ابعادی طبق نقشه؛ عدم دوپخ؛ تلورانس ابعادی داخل ±0.01mm`);
    setQcNotes(`بازرسی ابعادی با کولیس دیجیتال و میکرومتر میکرومتری و راکول‌سنج انجام پذیرفت.`);
    setSheetFileName(`QC_Inspection_Sheet_${order.orderNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Stg${stage.stageNumber}.pdf`);
    setSheetFileSize('1.4 MB');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSheetFileName(file.name);
      setSheetFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    }
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSheetFileName(file.name);
      setSheetFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInspection) return;

    onSubmitStageQC(
      selectedInspection.order.id,
      selectedInspection.stage.stageNumber,
      {
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
        sheetFileSize
      }
    );

    setSelectedInspection(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
              واحد کنترل کیفیت و اندازه‌برداری CMM (QC)
            </span>
            <span className="text-xs text-slate-400">فرآیند ۴ مرحله‌ای: بازرسی ابعادی → بارگذاری فرم QC → تایید مدیر مهندسی → ترخیص</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            پنل بازرسی فنی و کنترل کیفیت قطعات تولیدی
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            کلیه قطعات پس از ماشین‌کاری در هر مرحله به این واحد ارسال می‌شوند. کارشناس QC پس از سنجش ابعادی، زبری سطح و سختی‌سنجی، برگه کنترل کیفیت را بارگذاری نموده و جهت تایید و ترخیص به مدیر مهندسی ارجاع می‌دهد.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-blue-950/60 border border-blue-600/40 text-blue-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>استاندارد بازرسی: ISO 9001:2015</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-xs text-slate-400">در صف بازرسی فوری QC</div>
            <div className="text-2xl font-black text-amber-400 mt-0.5">{pendingQCStages.length}</div>
            <div className="text-[10px] text-amber-300 mt-1">ماشین‌کاری تمام شده، منتظر QC</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-xs text-slate-400">در انتظار تایید مدیر مهندسی</div>
            <div className="text-2xl font-black text-cyan-400 mt-0.5">{pendingEngStages.length}</div>
            <div className="text-[10px] text-cyan-300 mt-1">برگه QC بارگذاری شده</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-xs text-slate-400">تایید نهایی شده (ترخیص)</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{completedStages.length}</div>
            <div className="text-[10px] text-emerald-300 mt-1">ترخیص به مرحله بعد یا انبار</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-xs text-slate-400">موارد عدم انطباق / رد فنی</div>
            <div className="text-2xl font-black text-rose-400 mt-0.5">{rejectedStages.length}</div>
            <div className="text-[10px] text-rose-300 mt-1">نیاز به بازکاری یا بررسی ضایعات</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <BadgeAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Layout: Right-hand Tabs Navigation + Left-hand Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: QC Navigation Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های کنترل کیفی (QC)</span>
              <span className="text-[10px] text-slate-400">فیلتر و پایش بازرسی‌های کارخانه</span>
            </div>

            <button
              onClick={() => setFilterTab('pending_qc')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                filterTab === 'pending_qc'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25 ring-2 ring-amber-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="leading-snug">در صف بازرسی فوری QC</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-300 border border-amber-500/30 shrink-0">
                {pendingQCStages.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('pending_eng')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                filterTab === 'pending_eng'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/25 ring-2 ring-cyan-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 shrink-0 text-cyan-400" />
                <span className="leading-snug">در انتظار تایید مهندسی</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                {pendingEngStages.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('completed')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                filterTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="leading-snug">تایید نهایی شده (ترخیص)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                {completedStages.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('all')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                filterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0 text-blue-400" />
                <span className="leading-snug">تمام مراحل و آرشیو کیفی</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700 shrink-0">
                {allOrderStages.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Left Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره سفارش، قطعه، متریال یا دستگاه..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition shadow"
            />
          </div>

      {/* Main Inspection Cards List */}
      {filteredList.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">موردی در این دسته یافت نشد</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            هیچ قطعه یا مرحله‌ای مطابق فیلتر فعلی وجود ندارد. می‌توانید تب‌های دیگر را انتخاب کنید یا وضعیت مراحل را در سالن تولید تغییر دهید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map(({ order, stage }) => {
            const hasQcReport = !!stage.qcReport;
            const hasEngApproval = !!stage.engineeringApproval;
            const engDoc = order.engineeringDocs?.find(d => d.stageNumber === stage.stageNumber);

            return (
              <div
                key={`${order.id}-${stage.stageNumber}`}
                className={`bg-slate-900/90 border rounded-3xl p-5 transition shadow-lg space-y-4 ${
                  stage.status === 'qc_pending'
                    ? 'border-amber-500/50 hover:border-amber-400 bg-gradient-to-l from-slate-900 via-amber-950/10 to-slate-900'
                    : stage.status === 'engineering_qc_pending'
                    ? 'border-cyan-500/50 hover:border-cyan-400'
                    : stage.status === 'qc_rejected'
                    ? 'border-rose-500/50 hover:border-rose-400'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded-xl">
                      {order.orderNumber}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <span>{order.partName}</span>
                        {order.compressorModelName && (
                          <span className="text-[11px] font-normal text-slate-400">
                            ({order.compressorModelName})
                          </span>
                        )}
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        کد قطعه: <span className="font-mono text-slate-300">{order.partNumber}</span>
                        {' | '}
                        اولویت: <span className="text-amber-400 font-bold">{order.priority === 'emergency' ? 'اورژانسی' : order.priority === 'urgent' ? 'فوری' : 'عادی'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {stage.status === 'qc_pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>در صف بازرسی QC</span>
                      </span>
                    )}

                    {stage.status === 'engineering_qc_pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        <Send className="w-3.5 h-3.5" />
                        <span>برگه QC ارسال شده - در انتظار تایید مدیر مهندسی</span>
                      </span>
                    )}

                    {stage.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ترخیص شده با تایید مدیر مهندسی</span>
                      </span>
                    )}

                    {stage.status === 'qc_rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>رد فنی / نیاز به اصلاح</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stage Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">مرحله ساخت:</span>
                    <span className="font-bold text-white mt-0.5 block">
                      مرحله {stage.stageNumber}: {stage.stageName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">ماشین‌ابزار و اپراتور:</span>
                    <span className="text-slate-200 mt-0.5 block">
                      {stage.machineToolName || 'دستگاه سالن'}
                      {stage.operatorName ? ` (${stage.operatorName})` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">تعداد قطعات مرحله:</span>
                    <span className="font-mono font-bold text-cyan-400 mt-0.5 block">
                      تولیدشده: {stage.producedQty} از {stage.plannedQty} عدد
                      {stage.scrapQty > 0 && (
                        <span className="text-rose-400 mr-1.5">({stage.scrapQty} ضایعات)</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">وضعیت ترخیص بعدی:</span>
                    <span className="text-slate-300 mt-0.5 block">
                      {order.stages && stage.stageNumber < order.stages.length
                        ? `انتقال به مرحله ${stage.stageNumber + 1}`
                        : 'مرحله پایانی (تموم‌کار - تحویل به انبار)'}
                    </span>
                  </div>
                </div>

                {/* If QC report exists, show preview card */}
                {hasQcReport && stage.qcReport && (
                  <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-blue-200">
                          برگه کنترل کیفیت شماره {stage.qcReport.reportNumber}
                        </span>
                        <span className="text-slate-400">
                          (ثبت توسط: {stage.qcReport.inspectorName} - {stage.qcReport.inspectedAt})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingSheetDoc({ order, stage })}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-900/50 hover:bg-blue-800/60 border border-blue-600/40 text-blue-300 text-[11px] font-bold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده کامل برگه و مشخصات QC</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                      <div>ابعاد و تلورانس: <span className={stage.qcReport.dimensionalCheckPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{stage.qcReport.dimensionalCheckPassed ? 'منطبق با نقشه' : 'عدم انطباق'}</span></div>
                      <div>زبری سطح: <span className="font-mono text-cyan-300">{stage.qcReport.roughnessRa || 'Ra 0.8'}</span></div>
                      <div>سختی‌سنجی: <span className="font-mono text-amber-300">{stage.qcReport.hardnessRockwell || '56 HRC'}</span></div>
                      <div>فایل برگه: <span className="font-mono text-blue-300">{stage.qcReport.sheetFileName}</span></div>
                    </div>
                  </div>
                )}

                {/* If Engineering Approval exists */}
                {hasEngApproval && stage.engineeringApproval && (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold">تاییدیه رسمی مدیر مهندسی: </span>
                        <span>توسط {stage.engineeringApproval.approverName} در تاریخ {stage.engineeringApproval.approvedAt}</span>
                        {stage.engineeringApproval.feedback && (
                          <span className="text-slate-400 block sm:inline mr-2">«{stage.engineeringApproval.feedback}»</span>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/60 text-emerald-300 font-bold text-[11px] shrink-0 border border-emerald-700/60">
                      {stage.engineeringApproval.isFinalStage ? 'ترخیص نهایی تموم‌کار' : 'ترخیص به مرحله بعدی'}
                    </span>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {/* View Drawing/STEP if CAD Doc available */}
                    {engDoc && onOpenCadViewer && (
                      <button
                        type="button"
                        onClick={() => onOpenCadViewer(engDoc, order.partName, order.orderNumber)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>مشاهده نقشه و مدل سه‌بعدی مرحله</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {stage.status === 'qc_pending' && (
                      <button
                        type="button"
                        onClick={() => openInspectionModal(order, stage)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition hover:scale-[1.02]"
                      >
                        <ClipboardCheck className="w-4 h-4 text-slate-950" />
                        <span>تکمیل و بارگذاری برگه کنترل کیفی (QC Form)</span>
                      </button>
                    )}

                    {stage.status === 'engineering_qc_pending' && (
                      <button
                        type="button"
                        onClick={() => setViewingSheetDoc({ order, stage })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold border border-cyan-600/40 transition"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>برگه در کارتابل مدیر مهندسی قرار دارد</span>
                      </button>
                    )}

                    {stage.status === 'qc_rejected' && (
                      <button
                        type="button"
                        onClick={() => openInspectionModal(order, stage)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>بازرسی و ثبت مجدد برگه اصلاحیه</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SUBMIT QC REPORT & UPLOAD INSPECTION SHEET                          */}
      {/* ========================================================================= */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    ثبت و بارگذاری برگه کنترل کیفی (QC Report)
                  </h3>
                  <p className="text-xs text-slate-400">
                    سفارش {selectedInspection.order.orderNumber} - {selectedInspection.order.partName} - مرحله {selectedInspection.stage.stageNumber} ({selectedInspection.stage.stageName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedInspection(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Info strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">تعداد قطعات ارسالی به QC:</span>
                  <span className="font-mono text-cyan-400 font-black">{selectedInspection.stage.producedQty || selectedInspection.order.quantity} عدد</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">دستگاه و ماشین‌ابزار:</span>
                  <span className="text-slate-200 font-bold">{selectedInspection.stage.machineToolName || 'دستگاه کارگاه'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">اپراتور تولیدکننده:</span>
                  <span className="text-slate-200 font-bold">{selectedInspection.stage.operatorName || 'اپراتور سالن'}</span>
                </div>
              </div>

              {/* Inspector Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    نام کارشناس و بازرس QC
                  </label>
                  <input
                    type="text"
                    required
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    کد پرسنلی بازرس
                  </label>
                  <input
                    type="text"
                    value={inspectorCode}
                    onChange={(e) => setInspectorCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Quantity Assessment */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>تفکیک تعداد قطعات پس از اندازه‌برداری:</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-emerald-400 font-bold">
                      تعداد سالم و مطابق (Passed)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={passedQty}
                      onChange={(e) => setPassedQty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-emerald-600/40 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono font-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-amber-400 font-bold">
                      مشروط (Conditional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={conditionalQty}
                      onChange={(e) => setConditionalQty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-amber-600/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] text-rose-400 font-bold">
                      رد و ضایعات (Scrap)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={rejectedQty}
                      onChange={(e) => setRejectedQty(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-rose-600/40 rounded-xl px-3 py-1.5 text-xs text-rose-300 font-mono font-black"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Measurements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    سختی‌سنجی قطعه (Rockwell)
                  </label>
                  <input
                    type="text"
                    value={hardness}
                    onChange={(e) => setHardness(e.target.value)}
                    placeholder="مثال: 58 HRC یا 220 HB"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    زبری سطح اندازه‌گیری شده (Surface Roughness)
                  </label>
                  <input
                    type="text"
                    value={roughnessRa}
                    onChange={(e) => setRoughnessRa(e.target.value)}
                    placeholder="مثال: Ra 0.8 µm یا Ra 1.6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dimensional Tolerances */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  انحرافات مجاز و نتایج اندازه‌برداری CMM / کولیس / میکرومتر
                </label>
                <input
                  type="text"
                  value={measuredTolerances}
                  onChange={(e) => setMeasuredTolerances(e.target.value)}
                  placeholder="مثال: انحراف قطر کمتر از ۰.۰۰۸ میلی‌متر - لنگی شعاعی مجاز"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              {/* File Upload Box for QC Sheet */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  بارگذاری فایل برگه و فرم کنترل کیفی (QC Sheet PDF / Scan)
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropFile}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition ${
                    isDragOver
                      ? 'border-amber-400 bg-amber-950/20'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
                  }`}
                >
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <div className="text-xs text-white font-bold">
                    فایل اسکن یا فرم دیجیتال QC را بکشید یا انتخاب کنید
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    پشتیبانی از فرمت‌های PDF, JPG, PNG (حداکثر ۲۰ مگابایت)
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition">
                      <span>انتخاب فایل از رایانه</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {sheetFileName && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono">
                      <FileCheck className="w-4 h-4" />
                      <span>{sheetFileName} ({sheetFileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Decision Radio Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  تصمیم نهایی بازرس کنترل کیفیت:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                    decision === 'approved'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={decision === 'approved'}
                      onChange={() => setDecision('approved')}
                      className="accent-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">تایید کامل (Approved)</div>
                      <div className="text-[10px] opacity-75">ارسال به مدیر مهندسی</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                    decision === 'conditional'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="conditional"
                      checked={decision === 'conditional'}
                      onChange={() => setDecision('conditional')}
                      className="accent-amber-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">تایید مشروط (Conditional)</div>
                      <div className="text-[10px] opacity-75">با تصمیم مدیر مهندسی</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-2.5 ${
                    decision === 'rejected'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="decision"
                      value="rejected"
                      checked={decision === 'rejected'}
                      onChange={() => setDecision('rejected')}
                      className="accent-rose-500"
                    />
                    <div className="text-xs">
                      <div className="font-bold">عدم انطباق (Rejected)</div>
                      <div className="text-[10px] opacity-75">نیاز به بازکاری / اسقاط</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  توضیحات و گزارش تکمیلی بازرسی:
                </label>
                <textarea
                  rows={3}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  placeholder="نکات بازرسی، ابزارهای کنترلی استفاده شده، توصیه‌ها به سالن ماشین‌کاری..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInspection(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>ثبت برگه کنترل کیفی و ارسال جهت تایید مدیر مهندسی</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VIEW UPLOADED QC SHEET & DETAILS                                    */}
      {/* ========================================================================= */}
      {viewingSheetDoc && viewingSheetDoc.stage.qcReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    برگه بازرسی کیفی شماره {viewingSheetDoc.stage.qcReport.reportNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingSheetDoc.order.orderNumber} - مرحله {viewingSheetDoc.stage.stageNumber} ({viewingSheetDoc.stage.stageName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingSheetDoc(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">بازرس کنترل کیفی:</span>
                  <span className="font-bold text-white mt-0.5 block">{viewingSheetDoc.stage.qcReport.inspectorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">زمان بازرسی:</span>
                  <span className="text-slate-300 mt-0.5 block">{viewingSheetDoc.stage.qcReport.inspectedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">سختی قطعه:</span>
                  <span className="font-mono text-amber-300 font-bold mt-0.5 block">{viewingSheetDoc.stage.qcReport.hardnessRockwell || 'HRC 58'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">زبری سطح Ra:</span>
                  <span className="font-mono text-cyan-300 font-bold mt-0.5 block">{viewingSheetDoc.stage.qcReport.roughnessRa || 'Ra 0.8'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-200">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-bold font-mono">{viewingSheetDoc.stage.qcReport.sheetFileName}</div>
                    <div className="text-[11px] text-slate-400">بارگذاری شده: {viewingSheetDoc.stage.qcReport.sheetUploadedAt || viewingSheetDoc.stage.qcReport.inspectedAt}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-300 text-[11px] font-mono border border-blue-600/30">
                  {viewingSheetDoc.stage.qcReport.sheetFileSize || '1.4 MB'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">تلورانس‌ها و ابعاد اندازه‌گیری شده:</span>
                <p className="p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 leading-relaxed">
                  {viewingSheetDoc.stage.qcReport.measuredTolerances || 'ابعاد مطابق با تلورانس‌های نقشه فنی تایید شد.'}
                </p>
              </div>

              {viewingSheetDoc.stage.qcReport.notes && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">توضیحات تکمیلی:</span>
                  <p className="p-3 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 leading-relaxed">
                    {viewingSheetDoc.stage.qcReport.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingSheetDoc(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
