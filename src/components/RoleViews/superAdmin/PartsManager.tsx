import React, { useState } from 'react';
import { PartDefinition, CompressorModel, ManufacturingStageDefinition } from '../../../types';
import { PlusCircle, Edit3, Trash2, Layers, Search, Filter, Image as ImageIcon, Plus, Trash, Eye } from 'lucide-react';
import { ImageUploader } from '../../ImageUploader';

interface PartsManagerProps {
  parts: PartDefinition[];
  models: CompressorModel[];
  onAddPart: (part: PartDefinition) => void;
  onUpdatePart?: (part: PartDefinition) => void;
  onDeletePart?: (partId: string) => void;
}

export const PartsManager: React.FC<PartsManagerProps> = ({
  parts,
  models,
  onAddPart,
  onUpdatePart,
  onDeletePart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<PartDefinition | null>(null);

  // Form State
  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [machineModelId, setMachineModelId] = useState('');
  const [category, setCategory] = useState<'manufactured' | 'imported' | 'bought_out' | 'casting'>('manufactured');
  const [material, setMaterial] = useState('');
  const [rawWeightKg, setRawWeightKg] = useState(10);
  const [finishedWeightKg, setFinishedWeightKg] = useState(8);
  const [stockQty, setStockQty] = useState(5);
  const [minStockAlert, setMinStockAlert] = useState(2);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState('');
  const [stages, setStages] = useState<ManufacturingStageDefinition[]>([]);

  const openAddModal = () => {
    setEditingPart(null);
    setPartNumber('');
    setName('');
    setNameEn('');
    setMachineModelId(models[0]?.id || '');
    setCategory('manufactured');
    setMaterial('فولاد آلیاژی Mo40');
    setRawWeightKg(15);
    setFinishedWeightKg(12);
    setStockQty(5);
    setMinStockAlert(2);
    setSupplierName('');
    setNotes('');
    setImage('');
    setStages([
      {
        stageNumber: 1,
        name: 'تراش اولیه و سنترگیری',
        description: 'پوسته‌برداری اولیه و ایجاد پخ و رفرنس',
        defaultMachineCategoryId: 'manual_lathe',
        estimatedMinutes: 60,
        requiredDrawingType: 'نقشه تراشکاری فاز ۱',
        isOutsourced: false,
        qcCheckpoints: ['کنترل ابعادی قطر با کولیس ورنیه']
      }
    ]);
    setShowModal(true);
  };

  const openEditModal = (p: PartDefinition) => {
    setEditingPart(p);
    setPartNumber(p.partNumber);
    setName(p.name);
    setNameEn(p.nameEn || '');
    setMachineModelId(p.machineModelId);
    setCategory(p.category);
    setMaterial(p.material || '');
    setRawWeightKg(p.rawWeightKg || 0);
    setFinishedWeightKg(p.finishedWeightKg || 0);
    setStockQty(p.stockQty || 0);
    setMinStockAlert(p.minStockAlert || 1);
    setSupplierName(p.supplierName || '');
    setNotes(p.notes || '');
    setImage(p.image || p.imageUrl || '');
    setStages(p.defaultStages ? JSON.parse(JSON.stringify(p.defaultStages)) : []);
    setShowModal(true);
  };

  const handleAddStage = () => {
    const nextNum = stages.length + 1;
    setStages([
      ...stages,
      {
        stageNumber: nextNum,
        name: `مرحله ${nextNum}: ماشین‌کاری نهایی`,
        description: 'عملیات تکمیلی',
        defaultMachineCategoryId: 'cnc_lathe',
        estimatedMinutes: 45,
        requiredDrawingType: 'نقشه فاز نهایی',
        isOutsourced: false,
        qcCheckpoints: ['کنترل تلرانس نهایی با میکرومتر']
      }
    ]);
  };

  const handleRemoveStage = (idx: number) => {
    setStages(stages.filter((_, i) => i !== idx).map((stg, i) => ({ ...stg, stageNumber: i + 1 })));
  };

  const handleStageChange = <K extends keyof ManufacturingStageDefinition>(
    index: number,
    field: K,
    value: ManufacturingStageDefinition[K]
  ) => {
    setStages((prev) => prev.map((stg, i) => (i === index ? { ...stg, [field]: value } : stg)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart && onUpdatePart) {
      onUpdatePart({
        ...editingPart,
        partNumber,
        name,
        nameEn,
        machineModelId,
        category,
        material,
        rawWeightKg: Number(rawWeightKg),
        finishedWeightKg: Number(finishedWeightKg),
        stockQty: Number(stockQty),
        minStockAlert: Number(minStockAlert),
        supplierName,
        notes,
        image,
        imageUrl: image,
        defaultStages: stages
      });
    } else {
      onAddPart({
        id: 'PART-' + Date.now().toString().slice(-5),
        partNumber,
        name,
        nameEn: nameEn || partNumber,
        machineModelId,
        category,
        material,
        rawWeightKg: Number(rawWeightKg),
        finishedWeightKg: Number(finishedWeightKg),
        stockQty: Number(stockQty),
        minStockAlert: Number(minStockAlert),
        supplierName,
        notes,
        image,
        imageUrl: image,
        defaultStages: stages
      });
    }
    setShowModal(false);
  };

  const handleDelete = (part: PartDefinition) => {
    if (confirm(`آیا از حذف قطعه "${part.name}" (${part.partNumber}) از پایگاه داده و BOM اطمینان دارید؟`)) {
      if (onDeletePart) {
        onDeletePart(part.id);
      }
    }
  };

  const filteredParts = parts.filter(p => {
    const matchesModel = selectedModelFilter === 'all' || p.machineModelId === selectedModelFilter;
    const matchesSearch =
      p.name.includes(searchTerm) ||
      p.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.material && p.material.includes(searchTerm));
    return matchesModel && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            کاتالوگ قطعات، ساختار شکست محصول (BOM) و مراحل ساخت
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف، ویرایش و حذف قطعات ریخته‌گری، ساخت داخل، مراحل ماشین‌کاری و تصاویر فنی
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          افزودن قطعه جدید به BOM
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="جستجو بر اساس نام قطعه، کد فنی (Part No) یا جنس متریال..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="all">همه مدل‌های دستگاه ({parts.length} قطعه)</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parts Table / Cards Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">تصویر</th>
                <th className="p-3.5">شماره فنی (Part No)</th>
                <th className="p-3.5">نام قطعه و مدل دستگاه</th>
                <th className="p-3.5">متریال و اوزان</th>
                <th className="p-3.5">نوع تامین</th>
                <th className="p-3.5">موجودی / مراحل ساخت</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    هیچ قطعه‌ای مطابق جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const displayImage = p.image || p.imageUrl;
                  const modelObj = models.find(m => m.id === p.machineModelId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* Image Thumbnail */}
                      <td className="p-3.5">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-slate-700" />
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-cyan-300">
                        {p.partNumber}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          مدل: <span className="text-indigo-300 font-medium">{modelObj?.code || p.machineModelId}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-300 font-mono font-medium">{p.material || 'تعریف نشده'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          خام: {p.rawWeightKg}kg | تمام‌شده: {p.finishedWeightKg}kg
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                            p.category === 'manufactured'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : p.category === 'casting'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          {p.category === 'manufactured'
                            ? 'تولید داخل'
                            : p.category === 'casting'
                            ? 'ریخته‌گری همکار'
                            : 'خرید / وارداتی'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-300 font-bold">
                          موجودی انبار: <span className="text-white">{p.stockQty} عدد</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.defaultStages?.length || 0} مرحله ساخت تعریف‌شده
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition"
                            title="ویرایش قطعه"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
                            title="حذف قطعه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Part */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                {editingPart ? `ویرایش قطعه ${editingPart.partNumber}` : 'تعریف قطعه جدید در کاتالوگ BOM'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">شماره فنی (Part Number):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: CP-CS-5001"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">مدل دستگاه مربوطه:</label>
                  <select
                    value={machineModelId}
                    onChange={(e) => setMachineModelId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نام فارسی قطعه:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: روتور اسکرو نری ۵ لوپ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نام انگلیسی / استاندارد:</label>
                  <input
                    type="text"
                    placeholder="مثال: Male Screw Rotor 5-Lobe"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="عکس / تصویر فنی قطعه"
                placeholderText="آپلود تصویر قطعه یا وارد کردن لینک..."
                presets={[
                  { label: 'روتور اسکرو', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
                  { label: 'پوسته چدنی', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80' },
                  { label: 'چرخ‌دنده تایمینگ', url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80' }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">دسته‌بندی تامین:</label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as 'manufactured' | 'imported' | 'bought_out' | 'casting'
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="manufactured">تولید کامل داخل کارخانه (Manufactured)</option>
                    <option value="casting">ریخته‌گری همکار + ماشین‌کاری داخل (Casting)</option>
                    <option value="imported">خرید خارجی / وارداتی (Imported)</option>
                    <option value="bought_out">خرید استاندارد بازار داخلی (Bought Out)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">جنس متریال:</label>
                  <input
                    type="text"
                    placeholder="مثال: چدن داکتیل GGG40 یا فولاد Mo40"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">وزن خام (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={rawWeightKg}
                    onChange={(e) => setRawWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">وزن نهایی (kg):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finishedWeightKg}
                    onChange={(e) => setFinishedWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">موجودی انبار:</label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نقطه سفارش:</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Manufacturing Stages Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    مراحل ساخت و ماشین‌کاری قطعه (Routing)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    افزودن مرحله
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {stages.map((stg, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400">
                          مرحله {stg.stageNumber}:
                        </span>
                        {stages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStage(idx)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">نام مرحله:</label>
                          <input
                            type="text"
                            value={stg.name}
                            onChange={(e) => handleStageChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">دستگاه مورد نیاز:</label>
                          <select
                            value={stg.defaultMachineCategoryId}
                            onChange={(e) => handleStageChange(idx, 'defaultMachineCategoryId', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="cnc_lathe">تراش CNC</option>
                            <option value="manual_lathe">تراش منوال</option>
                            <option value="gantry_mill">فرز دروازه‌ای</option>
                            <option value="boring">بورینگ</option>
                            <option value="carousel">کاروسل</option>
                            <option value="grinder">سنگ مغناطیس</option>
                            <option value="outsourced_wirecut">وایرکات برون‌سپاری</option>
                            <option value="outsourced_lap">لپینگ</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">زمان تقریبی (دقیقه):</label>
                          <input
                            type="number"
                            value={stg.estimatedMinutes}
                            onChange={(e) => handleStageChange(idx, 'estimatedMinutes', Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">توضیحات و نکات مهندسی:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  placeholder="ملاحظات متالورژی، حساسیت‌ها و تلرانس‌های ویژه..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
                >
                  {editingPart ? 'ذخیره تغییرات قطعه' : 'ثبت قطعه جدید'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
