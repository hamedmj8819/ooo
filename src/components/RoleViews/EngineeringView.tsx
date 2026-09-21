import React, { useState } from 'react';
import {
  ProductionOrder,
  StageEngineeringDoc,
  CompressorModel,
  PartDefinition,
  MachineTool,
  StageExecutionProgress
} from '../../types';
import {
  FileCode2,
  Upload,
  CheckCircle2,
  Eye,
  Layers,
  FolderOpen,
  HardDrive,
  FileCheck,
  AlertCircle,
  FileText,
  Search,
  Sparkles,
  Download,
  Boxes,
  Cpu,
  Compass,
  FilePlus,
  Save,
  RotateCw,
  ExternalLink,
  ChevronRight,
  Filter,
  ClipboardCheck,
  Send,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';

interface EngineeringViewProps {
  orders: ProductionOrder[];
  models?: CompressorModel[];
  parts?: PartDefinition[];
  machines?: MachineTool[];
  onUploadDoc: (orderId: string, doc: {
    stageNumber: number;
    stageName: string;
    drawingNumber: string;
    drawingFileName: string;
    stepFileName: string;
    notes?: string;
  }) => void;
  onUpdatePartStageDrawings?: (partId: string, stageNumber: number, pdfFileName: string, stepFileName: string) => void;
  onUpdatePartMasterDrawings?: (partId: string, defaultDrawingName: string, defaultStepFileName: string) => void;
  onOpenCadViewer: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
  onApproveQC?: (orderId: string, stageNumber: number, approverName: string, feedback?: string) => void;
  onRejectQC?: (orderId: string, stageNumber: number, approverName: string, reason: string) => void;
}

export const EngineeringView: React.FC<EngineeringViewProps> = ({
  orders,
  models = [],
  parts = [],
  machines = [],
  onUploadDoc,
  onUpdatePartStageDrawings,
  onUpdatePartMasterDrawings,
  onOpenCadViewer,
  onApproveQC,
  onRejectQC
}) => {
  // Main view tab
  const [activeMainTab, setActiveMainTab] = useState<'orders_release' | 'master_catalog' | 'qc_approvals'>('master_catalog');

  // QC Approval State
  const [approverName] = useState('مهندس کریمی (مدیر مهندسی)');
  const [approvingStageId, setApprovingStageId] = useState<string | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState<string>('بررسی ابعادی و برگه QC با نقشه و الزامات فنی مطابقت دارد؛ تایید شد.');
  const [rejectingStageId, setRejectingStageId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [viewingQcDoc, setViewingQcDoc] = useState<{
    order: ProductionOrder;
    stage: StageExecutionProgress;
  } | null>(null);

  // Orders Release State
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [stageNumberInput, setStageNumberInput] = useState<number>(1);
  const [stageNameInput, setStageNameInput] = useState<string>('مرحله ۱: تراشکاری اولیه و سنترگیری');
  const [drawingNumberInput, setDrawingNumberInput] = useState<string>(() => 'DWG-ENG-' + Math.floor(1000 + Math.random() * 9000));
  const [drawingFileNameInput, setDrawingFileNameInput] = useState<string>('Blueprint-RevA.pdf');
  const [stepFileNameInput, setStepFileNameInput] = useState<string>('SolidModel-Stage.step');
  const [engNotesInput, setEngNotesInput] = useState<string>('');

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];
  const awaitingOrders = orders.filter(o => o.status === 'awaiting_engineering');

  // Master Catalog State (The Requested Feature)
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || '');

  // Editing state for stage drawings in master catalog
  const [editingStage, setEditingStage] = useState<{
    partId: string;
    stageNumber: number;
    pdfName: string;
    stepName: string;
  } | null>(null);

  // Master drawing inputs for the selected part
  const selectedPart = parts.find(p => p.id === selectedPartId) || parts[0];
  const [partMasterDwg, setPartMasterDwg] = useState<string>(selectedPart?.defaultDrawingName || '');
  const [partMasterStep, setPartMasterStep] = useState<string>(selectedPart?.defaultStepFileName || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleSelectPart = (p: PartDefinition) => {
    setSelectedPartId(p.id);
    setPartMasterDwg(p.defaultDrawingName || '');
    setPartMasterStep(p.defaultStepFileName || '');
  };

  // Filter parts for master catalog
  const filteredParts = parts.filter(p => {
    const matchesModel = selectedModelFilter === 'all' || p.machineModelId === selectedModelFilter;
    const matchesSearch = p.name.includes(catalogSearch) ||
                          p.partNumber.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                          p.material.includes(catalogSearch);
    return matchesModel && matchesSearch;
  });

  const handleOrderUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    onUploadDoc(selectedOrder.id, {
      stageNumber: stageNumberInput,
      stageName: stageNameInput,
      drawingNumber: drawingNumberInput,
      drawingFileName: drawingFileNameInput,
      stepFileName: stepFileNameInput,
      notes: engNotesInput
    });

    setEngNotesInput('');
    setStageNumberInput(prev => prev + 1);
    setDrawingNumberInput('DWG-ENG-' + Math.floor(1000 + Math.random() * 9000));
  };

  const handleSaveStageDrawings = (partId: string, stageNumber: number, pdf: string, step: string) => {
    if (onUpdatePartStageDrawings) {
      onUpdatePartStageDrawings(partId, stageNumber, pdf, step);
    }
    setEditingStage(null);
    setSaveSuccessMsg(`مدارک مرحله ${stageNumber} با موفقیت ثبت و ذخیره شد.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveMasterPartDrawings = () => {
    if (!selectedPart) return;
    if (onUpdatePartMasterDrawings) {
      onUpdatePartMasterDrawings(selectedPart.id, partMasterDwg, partMasterStep);
    }
    setSaveSuccessMsg(`نقشه کلی و فایل سه‌بعدی مادر قطعه ${selectedPart.name} ذخیره شد.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handlePreviewStageInCad = (partName: string, stageName: string, drawingName: string, stepName: string) => {
    const doc: StageEngineeringDoc = {
      id: 'DOC-PREVIEW-' + Date.now(),
      stageNumber: 1,
      stageName: stageName,
      drawingNumber: 'DWG-MASTER-' + (selectedPart?.partNumber || 'BOM'),
      drawingFileName: drawingName || 'Default-Drawing.pdf',
      stepFileName: stepName || 'Default-Model.step',
      uploadedAt: new Date().toLocaleDateString('fa-IR'),
      uploadedByRole: 'engineering',
      uploadedByName: 'واحد مهندسی و CAD/CAM',
      isApproved: true,
      status: 'approved'
    };
    onOpenCadViewer(doc, partName, selectedPart?.partNumber || 'MASTER-BOM');
  };

  // Find all stages waiting for Engineering QC approval
  const pendingQCStages: {
    order: ProductionOrder;
    stage: StageExecutionProgress;
    hasNextStage: boolean;
    nextStageName?: string;
  }[] = [];

  orders.forEach(ord => {
    (ord.stages || []).forEach(stg => {
      if (stg.status === 'engineering_qc_pending') {
        const currentIdx = ord.stages.findIndex(s => s.stageNumber === stg.stageNumber);
        const hasNext = currentIdx >= 0 && currentIdx < ord.stages.length - 1;
        const nextName = hasNext ? ord.stages[currentIdx + 1].stageName : undefined;
        pendingQCStages.push({
          order: ord,
          stage: stg,
          hasNextStage: hasNext,
          nextStageName: nextName
        });
      }
    });
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              واحد مهندسی مکانیک، طراحی و CAD/CAM
            </span>
            <span className="text-xs text-slate-400">بانک نقشه‌های ساخت و فایل‌های سه‌بعدی STEP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            مدیریت نقشه‌ها و فایل‌های STEP قطعات و دستگاه‌ها
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            در این بخش، واحد مهندسی می‌تواند برای کلیه دستگاه‌ها و قطعات تعریف‌شده توسط سوپر ادمین، فایل‌های PDF نقشه‌های ساخت و فایل‌های سه‌بعدی STEP را برای هر یک از مراحل ماشین‌کاری بارگذاری و مدیریت نماید.
          </p>
        </div>

        {awaitingOrders.length > 0 && (
          <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block">{awaitingOrders.length} سفارش در انتظار نقشه</span>
              <span className="text-slate-400">متریال وارد شده و منتظر تایید مدارک مهندسی است</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Right-hand Tabs Navigation + Left-hand Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: Main Navigation Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-2">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های اصلی واحد مهندسی</span>
              <span className="text-[10px] text-slate-400">میزکار نقشه‌کشی و CAD/CAM</span>
            </div>

            <button
              onClick={() => setActiveMainTab('master_catalog')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeMainTab === 'master_catalog'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 shrink-0" />
                <span className="leading-snug">آرشیو نقشه‌ها و STEP قطعات</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                {parts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('orders_release')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 ${
                activeMainTab === 'orders_release'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 shrink-0" />
                <span className="leading-snug">آزادسازی نقشه‌های سفارشات</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-300 border border-emerald-500/30 shrink-0">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('qc_approvals')}
              className={`w-full text-right p-3 rounded-2xl text-xs font-black transition flex items-center justify-between gap-2.5 relative ${
                activeMainTab === 'qc_approvals'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-2 ring-blue-400/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-4 h-4 shrink-0" />
                <span className="leading-snug">کارتابل تایید کنترل کیفی (QC)</span>
              </div>
              {pendingQCStages.length > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse shrink-0">
                  {pendingQCStages.length}
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-400 border border-slate-700 shrink-0">
                  ۰
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MASTER CATALOG DRAWINGS & STEP ARCHIVE (REQUESTED FEATURE) */}
      {/* ========================================================================= */}
      {activeMainTab === 'master_catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left/Sidebar: Filter & Parts List */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Filter by Compressor Model */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  فیلتر بر اساس مدل دستگاه:
                </span>
                <span className="text-[11px] text-slate-500">{models.length} مدل دستگاه</span>
              </div>
              <select
                value={selectedModelFilter}
                onChange={(e) => setSelectedModelFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="all">همه دستگاه‌های کارخانه</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام قطعه، پارت‌نامبر یا جنس..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Parts List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredParts.length === 0 ? (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
                  هیچ قطعه‌ای مطابق با این فیلتر یافت نشد.
                </div>
              ) : (
                filteredParts.map((p) => {
                  const isSelected = p.id === selectedPart?.id;
                  const associatedModel = models.find(m => m.id === p.machineModelId);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPart(p)}
                      className={`p-3.5 rounded-2xl cursor-pointer border transition text-xs space-y-2 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg ring-1 ring-emerald-500/30 text-white'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                          {p.partNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.category === 'manufactured'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {p.category === 'manufactured' ? 'ساخت داخل ۸۰٪' : 'اقلام وارداتی ۲۰٪'}
                        </span>
                      </div>

                      <div className="font-bold text-white text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400">
                        دستگاه: <span className="text-slate-200">{associatedModel?.name || p.machineModelId}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>جنس: {p.material}</span>
                        <span className="text-emerald-400 font-bold">
                          {p.defaultStages?.length || 0} مرحله ساخت
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right/Detail: Part Details & Stage-by-Stage Drawings Upload */}
          <div className="lg:col-span-8 space-y-5">
            {selectedPart ? (
              <>
                {/* Part Header & Master CAD/PDF Summary */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700 font-bold">
                          {selectedPart.partNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          {models.find(m => m.id === selectedPart.machineModelId)?.name}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white mt-1">
                        {selectedPart.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        جنس: <strong className="text-slate-200">{selectedPart.material}</strong> | وزن خام: {selectedPart.rawWeightKg} kg | وزن ماشین‌کاری: {selectedPart.finishedWeightKg} kg
                      </p>
                    </div>

                    <button
                      onClick={() => handlePreviewStageInCad(
                        selectedPart.name,
                        'نقشه و مدل سه‌بعدی کلی قطعه',
                        partMasterDwg || selectedPart.defaultDrawingName || 'Drawing.pdf',
                        partMasterStep || selectedPart.defaultStepFileName || 'Model.step'
                      )}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      <span>مشاهده در نمایشگر سه‌بعدی CAD</span>
                    </button>
                  </div>

                  {/* Master Drawing & Master STEP Configuration Box */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      فایل‌های مادر مهندسی قطعه (Master PDF & Master STEP):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          نام فایل PDF نقشه کلی قطعه:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={partMasterDwg}
                            onChange={(e) => setPartMasterDwg(e.target.value)}
                            placeholder="DWG-SC500-REV3.pdf"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          نام فایل سه‌بعدی STEP مادر:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={partMasterStep}
                            onChange={(e) => setPartMasterStep(e.target.value)}
                            placeholder="STP-SC500-3D-SOLID.step"
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveMasterPartDrawings}
                        className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/40 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>ذخیره فایل‌های مادر قطعه</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stage-by-Stage Manufacturing Drawings Section */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        مراحل ساخت و ماشین‌کاری قطعه و مدارک فنی هر مرحله
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        برای هر مرحله ساخت، نقشه اجرایی با تلورانس‌های مربوطه و فایل STEP مجزا تعیین نمایید.
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2.5 py-1 rounded-full border border-emerald-800/60">
                      {selectedPart.defaultStages?.length || 0} ایستگاه ماشین‌کاری
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedPart.defaultStages?.map((stage) => {
                      const isEditing = editingStage?.partId === selectedPart.id && editingStage?.stageNumber === stage.stageNumber;
                      const hasPdf = !!stage.pdfDrawingFileName || !!stage.requiredDrawingType;
                      const hasStep = !!stage.stepFileName;

                      return (
                        <div
                          key={stage.stageNumber}
                          className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 transition space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {stage.stageNumber}
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-xs">{stage.name}</h5>
                                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>ایستگاه پیش‌فرض: <strong className="text-slate-300">{stage.defaultMachineCategoryId}</strong></span>
                                  <span>•</span>
                                  <span>زمان تخمینی: {stage.estimatedMinutes} دقیقه</span>
                                  {stage.isOutsourced && (
                                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                                      برون‌سپاری
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePreviewStageInCad(
                                  selectedPart.name,
                                  stage.name,
                                  stage.pdfDrawingFileName || stage.requiredDrawingType,
                                  stage.stepFileName || selectedPart.defaultStepFileName || 'stage.step'
                                )}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>نمایش CAD این مرحله</span>
                              </button>

                              {!isEditing && (
                                <button
                                  onClick={() => setEditingStage({
                                    partId: selectedPart.id,
                                    stageNumber: stage.stageNumber,
                                    pdfName: stage.pdfDrawingFileName || `DWG-${selectedPart.partNumber}-STG${stage.stageNumber}.pdf`,
                                    stepName: stage.stepFileName || `STP-${selectedPart.partNumber}-STG${stage.stageNumber}.step`
                                  })}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>تغییر مدارک / STEP</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Current files assigned */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-slate-400 text-[11px]">نقشه اجرایی PDF:</span>
                              <span className="font-mono text-slate-200 font-bold truncate">
                                {stage.pdfDrawingFileName || stage.requiredDrawingType || 'هنوز فایلی متصل نشده'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                              <span className="text-slate-400 text-[11px]">فایل مدل STEP:</span>
                              <span className="font-mono text-cyan-300 font-bold truncate">
                                {stage.stepFileName || selectedPart.defaultStepFileName || 'SolidModel-Default.step'}
                              </span>
                            </div>
                          </div>

                          {/* Inline Edit Form when User clicks 'تغییر مدارک' */}
                          {isEditing && (
                            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-3.5 space-y-3 animate-in fade-in">
                              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                تعیین و بارگذاری فایل PDF نقشه ساخت و فایل STEP مرحله {stage.stageNumber}:
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                    فایل نقشه مهندسی (.PDF):
                                  </label>
                                  <input
                                    type="text"
                                    value={editingStage.pdfName}
                                    onChange={(e) => setEditingStage({ ...editingStage, pdfName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                                    placeholder="مثال: DWG-LATHE-STAGE1.pdf"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                                    فایل سه‌بعدی CAD (.STEP / .STP):
                                  </label>
                                  <input
                                    type="text"
                                    value={editingStage.stepName}
                                    onChange={(e) => setEditingStage({ ...editingStage, stepName: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                                    placeholder="مثال: STP-ROTOR-MACHINING.step"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStage(null)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                                >
                                  انصراف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveStageDrawings(
                                    selectedPart.id,
                                    stage.stageNumber,
                                    editingStage.pdfName,
                                    editingStage.stepName
                                  )}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>تایید و ثبت در پرونده فنی مرحله</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* QC Checkpoints */}
                          {stage.qcCheckpoints?.length > 0 && (
                            <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-xl flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">کنترل ابعادی نقشه:</span>
                              <span>{stage.qcCheckpoints.join(' | ')}</span>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center text-slate-400">
                لطفاً یک قطعه را از منوی سمت راست انتخاب فرمایید.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACTIVE PRODUCTION ORDERS RELEASE */}
      {/* ========================================================================= */}
      {activeMainTab === 'orders_release' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Orders List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                سفارشات تولید نیازمند مدارک
              </h3>
              <span className="text-xs text-slate-400">{orders.length} سفارش</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const isSelected = ord.id === selectedOrder?.id;
                const isAwaiting = ord.status === 'awaiting_engineering';
                const isApproved = ord.status === 'engineering_approved' || ord.status === 'in_production' || ord.status === 'completed';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition text-xs space-y-2 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg text-white'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                        {ord.orderNumber}
                      </span>
                      {isAwaiting ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold animate-pulse">
                          نیازمند نقشه
                        </span>
                      ) : isApproved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          تایید شده ✓
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          مراحل قبلی
                        </span>
                      )}
                    </div>

                    <div className="font-bold truncate text-white">{ord.title}</div>
                    <div className="text-[11px] text-slate-400">
                      قطعه: <span className="text-slate-200">{ord.partName}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>تعداد: {ord.quantity} عدد</span>
                      <span className="text-emerald-400 font-bold">
                        {ord.engineeringDocs?.length || 0} مدرک فنی ثبت شده
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Upload Form & Registered Docs */}
          <div className="lg:col-span-8 space-y-6">
            {selectedOrder ? (
              <>
                {/* Active Order Summary Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-700 font-bold">
                          {selectedOrder.orderNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          سفارش‌دهنده: {selectedOrder.createdByName}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">
                        {selectedOrder.title}
                      </h3>
                    </div>

                    <div className="text-left">
                      <span className="text-xs text-slate-400 block">تیراژ ساخت:</span>
                      <span className="text-lg font-black text-emerald-400">{selectedOrder.quantity} عدد</span>
                    </div>
                  </div>

                  {/* Registered Docs List for this order */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      مدارک و نقشه‌های آزاد شده برای خط تولید ({selectedOrder.engineeringDocs?.length || 0}):
                    </h4>

                    {(!selectedOrder.engineeringDocs || selectedOrder.engineeringDocs.length === 0) ? (
                      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                        هنوز مدرک یا نقشه‌ای برای این سفارش ثبت نشده است. لطفاً از فرم زیر برای مرحله ۱ مدارک را بارگذاری فرمایید.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedOrder.engineeringDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-800 font-bold">
                                  مرحله {doc.stageNumber}
                                </span>
                                <span className="font-bold text-white text-xs">{doc.stageName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">({doc.drawingNumber})</span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-mono">
                                <span>نقشه: {doc.drawingFileName}</span>
                                <span>فایل CAD: {doc.stepFileName}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => onOpenCadViewer(doc, selectedOrder.partName, selectedOrder.orderNumber)}
                              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow"
                            >
                              <Eye className="w-4 h-4" />
                              <span>نمایش ۳D و نقشه</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Form */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    بارگذاری مدرک و نقشه جدید برای سفارش جاری
                  </h4>

                  <form onSubmit={handleOrderUploadSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          شماره مرحله ماشین‌کاری:
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={stageNumberInput}
                          onChange={(e) => setStageNumberInput(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          عنوان مرحله و دستگاه:
                        </label>
                        <input
                          type="text"
                          required
                          value={stageNameInput}
                          onChange={(e) => setStageNameInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                          placeholder="مثال: مرحله ۱: کف‌تراشی در فرز دروازه‌ای"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          شماره نقشه (Drawing No):
                        </label>
                        <input
                          type="text"
                          required
                          value={drawingNumberInput}
                          onChange={(e) => setDrawingNumberInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          فایل نقشه PDF:
                        </label>
                        <input
                          type="text"
                          required
                          value={drawingFileNameInput}
                          onChange={(e) => setDrawingFileNameInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          فایل سه‌بعدی STEP:
                        </label>
                        <input
                          type="text"
                          required
                          value={stepFileNameInput}
                          onChange={(e) => setStepFileNameInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        توضیحات و تلورانس‌های خاص مهندسی:
                      </label>
                      <textarea
                        rows={2}
                        value={engNotesInput}
                        onChange={(e) => setEngNotesInput(e.target.value)}
                        placeholder="نکات تلورانس ابعادی، ابزار برشی پیشنهادی یا لزوم فیکسچر..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید و آزادسازی نقشه برای سالن تولید</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400">
                سفارشی انتخاب نشده است.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QC APPROVALS & RELEASE WORKFLOW (USER REQUEST)                      */}
      {/* ========================================================================= */}
      {activeMainTab === 'qc_approvals' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                  کارتابل تاییدات مهندسی برگه QC
                </span>
                <span className="text-xs text-slate-400">گردش‌کار رسمی: QC → تایید مدیر مهندسی → ترخیص مرحله بعد یا تحویل انبار</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                بررسی و تایید نهایی برگه‌های کنترل کیفیت و ترخیص مراحل ساخت
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                طبق دستورالعمل کارخانه، پس از ثبت گزارش و بارگذاری فرم کنترل کیفی توسط واحد QC، مدیر مهندسی نتایج اندازه‌برداری را بررسی می‌نماید. با تایید مهندسی، قطعه به مرحله بعدی ساخت ترخیص شده و یا در صورت اتمام کار (تموم‌کار)، جهت صدور رسید و تحویل به انبار به مدیر برنامه‌ریزی واگذار می‌گردد.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
                سمت تاییدکننده: <span className="text-emerald-400 font-bold">{approverName}</span>
              </span>
            </div>
          </div>

          {pendingQCStages.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">کارتابل تاییدات خالی است</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                هیچ مرحله‌ای در انتظار تایید مهندسی وجود ندارد. کلیه گزارش‌های QC تعیین تکلیف شده‌اند.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {pendingQCStages.map(({ order, stage, hasNextStage, nextStageName }) => {
                const engDoc = order.engineeringDocs?.find(d => d.stageNumber === stage.stageNumber);
                const isFinalStage = !hasNextStage;

                return (
                  <div
                    key={`${order.id}-${stage.stageNumber}`}
                    className="p-6 rounded-3xl bg-slate-900 border border-blue-500/40 shadow-xl space-y-5"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded-xl">
                          {order.orderNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <span>{order.partName}</span>
                            {order.compressorModelName && (
                              <span className="text-xs font-normal text-slate-400">
                                ({order.compressorModelName})
                              </span>
                            )}
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            کد قطعه: <span className="font-mono text-slate-300">{order.partNumber}</span>
                            {' | '}
                            مرحله فعلی: <span className="text-cyan-300 font-bold">مرحله {stage.stageNumber}: {stage.stageName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFinalStage ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                            🏁 مرحله پایانی (تموم‌کار - تحویل به انبار)
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-black">
                            📍 ترخیص به مرحله بعدی ({nextStageName})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* QC Report Details Strip */}
                    {stage.qcReport && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-bold text-white">
                              گزارش کنترل کیفیت شماره {stage.qcReport.reportNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              (توسط {stage.qcReport.inspectorName} - {stage.qcReport.inspectedAt})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingQcDoc({ order, stage })}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-900/50 hover:bg-blue-800/60 border border-blue-600/40 text-blue-300 text-xs font-bold transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهده برگه و فرم کامل QC</span>
                            </button>

                            {engDoc && onOpenCadViewer && (
                              <button
                                type="button"
                                onClick={() => onOpenCadViewer(engDoc, order.partName, order.orderNumber)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                              >
                                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                                <span>تطبیق با نقشه و مدل سه‌بعدی</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">انطباق ابعادی:</span>
                            <span className={stage.qcReport.dimensionalCheckPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {stage.qcReport.dimensionalCheckPassed ? '✓ تایید و درون تلورانس' : '✗ عدم انطباق'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">سختی‌سنجی:</span>
                            <span className="font-mono text-amber-300 font-bold">{stage.qcReport.hardnessRockwell || 'HRC 58'}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">زبری سطح Ra:</span>
                            <span className="font-mono text-cyan-300 font-bold">{stage.qcReport.roughnessRa || 'Ra 0.8 µm'}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">فایل پیوست برگه QC:</span>
                            <span className="font-mono text-blue-300 truncate block">{stage.qcReport.sheetFileName}</span>
                          </div>
                        </div>

                        {stage.qcReport.measuredTolerances && (
                          <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                            <span className="text-slate-400 font-bold ml-1">نتایج اندازه‌گیری:</span>
                            <span>{stage.qcReport.measuredTolerances}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Workflow Impact Note */}
                    <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/30 text-xs text-slate-300 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-400 shrink-0" />
                        {isFinalStage ? (
                          <span>
                            <strong>نتیجه تایید:</strong> قطعه به عنوان <strong>تموم‌کار</strong> ترخیص شده و جهت صدور حواله و تحویل به انبار به <strong>مدیر برنامه‌ریزی</strong> تحویل می‌گردد.
                          </span>
                        ) : (
                          <span>
                            <strong>نتیجه تایید:</strong> مرحله {stage.stageNumber} تکمیل شده و <strong>مرحله {stage.stageNumber + 1} ({nextStageName})</strong> جهت تخصیص به ماشین و اپراتور آزاد می‌گردد.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection input if open */}
                    {rejectingStageId === `${order.id}-${stage.stageNumber}` && (
                      <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-700/60 space-y-3 animate-in fade-in">
                        <label className="block text-xs font-bold text-rose-300">
                          علت رد فنی و دستور اصلاح / بازکاری برای سالن تولید:
                        </label>
                        <textarea
                          rows={2}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="علت عدم تایید ابعادی، تلورانس یا لزوم سنگ‌زنی مجدد..."
                          className="w-full bg-slate-950 border border-rose-700/50 rounded-xl p-2.5 text-xs text-white outline-none focus:border-rose-400"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectingStageId(null)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onRejectQC) {
                                onRejectQC(order.id, stage.stageNumber, approverName, rejectReason || 'نیاز به بازکاری ابعادی در سالن');
                              }
                              setRejectingStageId(null);
                              setRejectReason('');
                            }}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                          >
                            ثبت رد فنی و ارجاع به سالن
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {rejectingStageId !== `${order.id}-${stage.stageNumber}` && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setRejectingStageId(`${order.id}-${stage.stageNumber}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-bold transition"
                        >
                          <ThumbsDown className="w-4 h-4 text-rose-400" />
                          <span>رد فنی و درخواست اصلاح در سالن</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (onApproveQC) {
                              onApproveQC(order.id, stage.stageNumber, approverName, approvalFeedback);
                            }
                          }}
                          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition ${
                            isFinalStage
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          {isFinalStage ? (
                            <span>تایید نهایی برگه QC و ارجاع به مدیر برنامه‌ریزی جهت تحویل به انبار (تموم‌کار)</span>
                          ) : (
                            <span>تایید برگه QC و ترخیص جهت مرحله بعدی ساخت</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VIEW FULL QC INSPECTION SHEET (FROM ENGINEERING VIEW)               */}
      {/* ========================================================================= */}
      {viewingQcDoc && viewingQcDoc.stage.qcReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    برگه بازرسی کیفی شماره {viewingQcDoc.stage.qcReport.reportNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingQcDoc.order.orderNumber} - مرحله {viewingQcDoc.stage.stageNumber} ({viewingQcDoc.stage.stageName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingQcDoc(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[11px]">بازرس کنترل کیفی:</span>
                  <span className="font-bold text-white mt-0.5 block">{viewingQcDoc.stage.qcReport.inspectorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">زمان ثبت بازرسی:</span>
                  <span className="text-slate-300 mt-0.5 block">{viewingQcDoc.stage.qcReport.inspectedAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">سختی قطعه:</span>
                  <span className="font-mono text-amber-300 font-bold mt-0.5 block">{viewingQcDoc.stage.qcReport.hardnessRockwell || 'HRC 58'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">زبری سطح Ra:</span>
                  <span className="font-mono text-cyan-300 font-bold mt-0.5 block">{viewingQcDoc.stage.qcReport.roughnessRa || 'Ra 0.8'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-200">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-bold font-mono">{viewingQcDoc.stage.qcReport.sheetFileName}</div>
                    <div className="text-[11px] text-slate-400">بارگذاری شده: {viewingQcDoc.stage.qcReport.sheetUploadedAt || viewingQcDoc.stage.qcReport.inspectedAt}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-900/60 text-blue-300 text-[11px] font-mono border border-blue-600/30">
                  {viewingQcDoc.stage.qcReport.sheetFileSize || '1.4 MB'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">تلورانس‌ها و ابعاد اندازه‌گیری شده:</span>
                <p className="p-3 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 leading-relaxed">
                  {viewingQcDoc.stage.qcReport.measuredTolerances || 'ابعاد مطابق با تلورانس‌های نقشه فنی تایید شد.'}
                </p>
              </div>

              {viewingQcDoc.stage.qcReport.notes && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[11px]">توضیحات تکمیلی QC:</span>
                  <p className="p-3 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 leading-relaxed">
                    {viewingQcDoc.stage.qcReport.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingQcDoc(null)}
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
