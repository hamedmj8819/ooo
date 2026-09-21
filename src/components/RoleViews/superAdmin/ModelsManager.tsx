import React, { useState } from 'react';
import { CompressorModel } from '../../../types';
import { PlusCircle, Edit3, Trash2, Boxes, Activity, Zap, Wind, Gauge, Sparkles } from 'lucide-react';
import { ImageUploader } from '../../ImageUploader';

interface ModelsManagerProps {
  models: CompressorModel[];
  onAddModel: (model: CompressorModel) => void;
  onUpdateModel?: (model: CompressorModel) => void;
  onDeleteModel?: (modelId: string) => void;
}

export const ModelsManager: React.FC<ModelsManagerProps> = ({
  models,
  onAddModel,
  onUpdateModel,
  onDeleteModel
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<CompressorModel | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [type, setType] = useState<'screw' | 'lobe' | 'booster'>('screw');
  const [motorPower, setMotorPower] = useState(45);
  const [flowRate, setFlowRate] = useState(8.5);
  const [workingPressure, setWorkingPressure] = useState(10.0);
  const [coolingType, setCoolingType] = useState('روغنی با رادیاتور آلومینیومی');
  const [description, setDescription] = useState('');
  const [inHouseRatio, setInHouseRatio] = useState(80);
  const [partsCount, setPartsCount] = useState(40);
  const [image, setImage] = useState('');

  const openAddModal = () => {
    setEditingModel(null);
    setCode('');
    setName('');
    setNameEn('');
    setType('screw');
    setMotorPower(45);
    setFlowRate(8.5);
    setWorkingPressure(10.0);
    setCoolingType('روغنی با رادیاتور آلومینیومی');
    setDescription('');
    setInHouseRatio(80);
    setPartsCount(40);
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (m: CompressorModel) => {
    setEditingModel(m);
    setCode(m.code);
    setName(m.name);
    setNameEn(m.nameEn || m.code);
    setType(m.type);
    setMotorPower(m.motorPowerKw);
    setFlowRate(m.capacityM3Min);
    setWorkingPressure(m.workingPressureBar);
    setCoolingType(m.coolingType || 'روغنی با رادیاتور آلومینیومی');
    setDescription(m.description || '');
    setInHouseRatio(m.inHouseRatio || 80);
    setPartsCount(m.partsCount || 40);
    setImage(m.image || m.imageUrl || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModel && onUpdateModel) {
      onUpdateModel({
        ...editingModel,
        code,
        name,
        nameEn,
        type,
        motorPowerKw: Number(motorPower),
        capacityM3Min: Number(flowRate),
        workingPressureBar: Number(workingPressure),
        coolingType,
        description,
        inHouseRatio: Number(inHouseRatio),
        partsCount: Number(partsCount),
        image,
        imageUrl: image
      });
    } else {
      onAddModel({
        id: 'MOD-' + Date.now().toString().slice(-5),
        code,
        name,
        nameEn: nameEn || code,
        type,
        motorPowerKw: Number(motorPower),
        capacityM3Min: Number(flowRate),
        workingPressureBar: Number(workingPressure),
        coolingType,
        description,
        inHouseRatio: Number(inHouseRatio),
        partsCount: Number(partsCount),
        image,
        imageUrl: image
      });
    }
    setShowModal(false);
  };

  const handleDelete = (model: CompressorModel) => {
    if (confirm(`آیا از حذف مدل دستگاه "${model.name}" (${model.code}) اطمینان دارید؟`)) {
      if (onDeleteModel) {
        onDeleteModel(model.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-400" />
            مدل‌های دستگاه‌های اصلی کارخانه (اسکرو، بلوئر، بوستر)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف، ویرایش مشخصات فنی، تصویر و حذف مدل‌های ماشین‌آلات تولیدی
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          افزودن مدل دستگاه جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => {
          const displayImage = m.image || m.imageUrl;
          return (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Image and Header */}
                <div className="relative w-full h-36 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={m.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                      <Boxes className="w-10 h-10 text-slate-700" />
                      <span className="text-[10px]">بدون تصویر اختصاصی</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-950/90 text-indigo-300 border border-indigo-700 font-bold backdrop-blur-sm">
                    {m.code}
                  </span>
                  <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 backdrop-blur-sm border border-slate-700">
                    {m.type === 'screw' ? 'کمپرسور اسکرو' : m.type === 'lobe' ? 'بلوئر لوپ‌تایپ' : 'بوستر پرفشار'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{m.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.description || 'بدون توضیحات فنی تکمیلی'}
                  </p>
                </div>

                {/* Technical specs pill */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">توان موتور:</span>
                    <span className="font-bold text-white">{m.motorPowerKw} kW</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">فشار کاری:</span>
                    <span className="font-bold text-cyan-300">{m.workingPressureBar} bar</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">دبی هوا:</span>
                    <span className="font-bold text-emerald-400">{m.capacityM3Min} m³/min</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    ساخت داخل: <strong className="text-emerald-400">{m.inHouseRatio}%</strong>
                  </span>
                  <span className="text-slate-400">
                    تعداد قطعات: <strong className="text-slate-200">{m.partsCount}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit and Delete */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(m)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add or Edit Model */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                {editingModel ? 'ویرایش مدل دستگاه' : 'تعریف مدل دستگاه جدید'}
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
                  <label className="text-slate-300 block mb-1 font-bold">کد مدل (Model Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: SC-500 HD"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نوع دستگاه:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'screw' | 'lobe' | 'booster')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="screw">کمپرسور اسکرو (Screw Compressor)</option>
                    <option value="lobe">بلوئر هوادهی لوپ‌تایپ (Roots Blower)</option>
                    <option value="booster">بوستر تراکم گاز (Gas Booster)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">نام کامل فارسی دستگاه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: کمپرسور اسکرو فشار قوی دائم‌کار صنعتی"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image Uploader */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="عکس / تصویر مدل دستگاه"
                placeholderText="آپلود تصویر یا وارد کردن لینک URL..."
                presets={[
                  { label: 'کمپرسور اسکرو صنعتی', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
                  { label: 'بلوئر هوادهی', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80' },
                  { label: 'بوستر پرفشار', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80' }
                ]}
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">توان موتور (kW):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={motorPower}
                    onChange={(e) => setMotorPower(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">فشار کاری (bar):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={workingPressure}
                    onChange={(e) => setWorkingPressure(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">دبی هوا (m³/min):</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={flowRate}
                    onChange={(e) => setFlowRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">سیستم خنک‌کاری:</label>
                  <input
                    type="text"
                    value={coolingType}
                    onChange={(e) => setCoolingType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">درصد ساخت داخل (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inHouseRatio}
                    onChange={(e) => setInHouseRatio(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">توضیحات و کاربرد فنی:</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  placeholder="شرح مشخصات و استانداردهای این مدل..."
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
                  {editingModel ? 'ذخیره تغییرات مدل' : 'افزودن مدل به سیستم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
