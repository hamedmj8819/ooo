import React, { useState } from 'react';
import { MachineTool, MachineType, MachineStatus } from '../../../types';
import { PlusCircle, Edit3, Trash2, Cpu, MapPin, Activity, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from '../../ImageUploader';

type MachineCategory = MachineTool['category'];

interface MachinesManagerProps {
  machines: MachineTool[];
  onAddMachine: (machine: MachineTool) => void;
  onUpdateMachine?: (machine: MachineTool) => void;
  onDeleteMachine?: (machineId: string) => void;
}

export const MachinesManager: React.FC<MachinesManagerProps> = ({
  machines,
  onAddMachine,
  onUpdateMachine,
  onDeleteMachine
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineTool | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<MachineType>('internal');
  const [category, setCategory] = useState<MachineCategory>('cnc_lathe');
  const [location, setLocation] = useState('سالن شماره ۲ - خط ماشین‌کاری سنگین');
  const [specifications, setSpecifications] = useState('');
  const [healthPercent, setHealthPercent] = useState(95);
  const [status, setStatus] = useState<MachineStatus>('idle');
  const [image, setImage] = useState('');

  const openAddModal = () => {
    setEditingMachine(null);
    setCode('');
    setName('');
    setType('internal');
    setCategory('cnc_lathe');
    setLocation('سالن شماره ۲ - خط ماشین‌کاری سنگین');
    setSpecifications('');
    setHealthPercent(95);
    setStatus('idle');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (mach: MachineTool) => {
    setEditingMachine(mach);
    setCode(mach.code);
    setName(mach.name);
    setType(mach.type);
    setCategory(mach.category);
    setLocation(mach.location || '');
    setSpecifications(mach.specifications || '');
    setHealthPercent(mach.healthPercent || 90);
    setStatus(mach.status || 'idle');
    setImage(mach.image || mach.imageUrl || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMachine && onUpdateMachine) {
      onUpdateMachine({
        ...editingMachine,
        code,
        name,
        type,
        category,
        location,
        specifications,
        healthPercent: Number(healthPercent),
        status,
        image,
        imageUrl: image
      });
    } else {
      onAddMachine({
        id: 'MC-' + Date.now().toString().slice(-5),
        code,
        name,
        type,
        category,
        location,
        specifications,
        healthPercent: Number(healthPercent),
        status,
        lastMaintenanceDate: new Date().toLocaleDateString('fa-IR'),
        image,
        imageUrl: image
      });
    }
    setShowModal(false);
  };

  const handleDelete = (mach: MachineTool) => {
    if (confirm(`آیا از حذف دستگاه "${mach.name}" (${mach.code}) از کارگاه مطمئن هستید؟`)) {
      if (onDeleteMachine) {
        onDeleteMachine(mach.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            ماشین‌آلات، تجهیزات سالن ساخت و ایستگاه‌های برون‌سپاری
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف، ویرایش مشخصات، آپلود عکس، بررسی سلامت و حذف تجهیزات صنعتی کارخانه
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          افزودن دستگاه جدید به سالن
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((mach) => {
          const displayImage = mach.image || mach.imageUrl;
          return (
            <div
              key={mach.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Image & Badges Header */}
                <div className="relative w-full h-32 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={mach.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                      <Cpu className="w-9 h-9 text-slate-700" />
                      <span className="text-[10px]">بدون تصویر اختصاصی</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-900/90 text-cyan-300 border border-slate-700 font-bold backdrop-blur-sm">
                    {mach.code}
                  </span>
                  <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm border ${
                      mach.type === 'internal'
                        ? 'bg-blue-950/90 text-blue-300 border-blue-700'
                        : 'bg-amber-950/90 text-amber-300 border-amber-700'
                    }`}
                  >
                    {mach.type === 'internal' ? 'داخل شرکت' : 'برون‌سپاری'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{mach.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {mach.specifications || 'بدون مشخصات فنی'}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {mach.location}
                    </span>
                    <span className="font-bold text-slate-300">
                      سلامت: <strong className="text-emerald-400">{mach.healthPercent}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit and Delete */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(mach)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(mach)}
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

      {/* Modal: Add or Edit Machine */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                {editingMachine ? 'ویرایش اطلاعات دستگاه سالن' : 'افزودن دستگاه جدید به سالن'}
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
                  <label className="text-slate-300 block mb-1 font-bold">کد دستگاه (Machine Code):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: LT-CNC-301"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">استقرار و مالکیت:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MachineType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="internal">مستقر در سالن کارخانه (Internal)</option>
                    <option value="outsourced">ایستگاه پیمانکار برون‌سپاری (Outsourced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">نام و مدل کامل دستگاه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تراش CNC دقیق ۲ محور مجهز به سروو درایو"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image Uploader */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="عکس / تصویر دستگاه یا ماشین‌ابزار"
                placeholderText="آپلود تصویر دستگاه یا وارد کردن لینک..."
                presets={[
                  { label: 'تراش CNC دقیق', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' },
                  { label: 'فرز دروازه‌ای سنگین', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80' },
                  { label: 'دستگاه بورینگ اسکودا', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80' }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">دسته‌بندی فرآیندی:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MachineCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="cnc_lathe">تراش CNC</option>
                    <option value="manual_lathe">تراش دستی سنگین (منوال)</option>
                    <option value="gantry_mill">فرز دروازه‌ای سنگین (Gantry)</option>
                    <option value="boring">دستگاه بورینگ افقی</option>
                    <option value="carousel">دستگاه کاروسل عمودی</option>
                    <option value="grinder">سنگ مغناطیس و سنگ‌زنی</option>
                    <option value="outsourced_wirecut">وایرکات برون‌سپاری</option>
                    <option value="outsourced_lap">لپینگ تخصصی</option>
                    <option value="outsourced_cylindrical_grind">سنگ محور برون‌سپاری</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">درصد سلامت دستگاه (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={healthPercent}
                    onChange={(e) => setHealthPercent(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">موقعیت و ایستگاه استقرار:</label>
                <input
                  type="text"
                  placeholder="مثال: سالن شماره ۱ - خط CNC قطعات دقیق"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">مشخصات فنی، ظرفیت کارگیر و ابزارها:</label>
                <textarea
                  rows={3}
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  placeholder="سیستم کنترل، دور اسپیندل، کارگیر و..."
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
                  {editingMachine ? 'ذخیره تغییرات دستگاه' : 'افزودن دستگاه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
