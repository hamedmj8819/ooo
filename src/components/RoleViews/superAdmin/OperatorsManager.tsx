import React, { useState } from 'react';
import { OperatorProfile, MachineTool } from '../../../types';
import { PlusCircle, Edit3, Trash2, Users, User, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { ImageUploader } from '../../ImageUploader';

interface OperatorsManagerProps {
  operators: OperatorProfile[];
  machines: MachineTool[];
  onAddOperator: (operator: OperatorProfile) => void;
  onUpdateOperator?: (operator: OperatorProfile) => void;
  onDeleteOperator?: (operatorId: string) => void;
}

export const OperatorsManager: React.FC<OperatorsManagerProps> = ({
  operators,
  machines,
  onAddOperator,
  onUpdateOperator,
  onDeleteOperator
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorProfile | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [personnelCode, setPersonnelCode] = useState('');
  const [specialty, setSpecialty] = useState('تراشکاری CNC و برنامه‌نویسی G-Code');
  const [assignedMachineId, setAssignedMachineId] = useState('');
  const [shift, setShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [status, setStatus] = useState<'working' | 'idle' | 'on_break'>('working');
  const [image, setImage] = useState('');

  const openAddModal = () => {
    setEditingOperator(null);
    setName('');
    setPersonnelCode('OP-' + Math.floor(100 + Math.random() * 900));
    setSpecialty('تراشکاری CNC و برنامه‌نویسی G-Code');
    setAssignedMachineId(machines[0]?.id || '');
    setShift('morning');
    setStatus('working');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (op: OperatorProfile) => {
    setEditingOperator(op);
    setName(op.name);
    setPersonnelCode(op.personnelCode);
    setSpecialty(op.specialty);
    setAssignedMachineId(op.assignedMachineId || '');
    setShift(op.shift);
    setStatus(op.status);
    setImage(op.image || op.imageUrl || op.avatarUrl || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOperator && onUpdateOperator) {
      onUpdateOperator({
        ...editingOperator,
        name,
        personnelCode,
        specialty,
        assignedMachineId,
        shift,
        status,
        image,
        imageUrl: image,
        avatarUrl: image
      });
    } else {
      onAddOperator({
        id: 'OP-' + Date.now().toString().slice(-4),
        name,
        personnelCode,
        specialty,
        assignedMachineId,
        shift,
        status,
        totalPartsProducedToday: 0,
        image,
        imageUrl: image,
        avatarUrl: image
      });
    }
    setShowModal(false);
  };

  const handleDelete = (op: OperatorProfile) => {
    if (confirm(`آیا از حذف پرسنل/اپراتور "${op.name}" (${op.personnelCode}) اطمینان دارید؟`)) {
      if (onDeleteOperator) {
        onDeleteOperator(op.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            پرسنل فنی، استادکاران و اپراتورهای ماشین‌ابزار
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف، ویرایش شیفت کاری، عکس پرسنلی، انتساب دستگاه و حذف اپراتورها
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          افزودن اپراتور جدید
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((op) => {
          const displayImage = op.image || op.imageUrl || op.avatarUrl;
          const assignedMach = machines.find(m => m.id === op.assignedMachineId);

          return (
            <div
              key={op.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header & Photo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={op.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{op.name}</h4>
                      <span className="text-[11px] font-mono text-cyan-300 block mt-0.5">
                        کد: {op.personnelCode}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      op.status === 'working'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : op.status === 'on_break'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {op.status === 'working' ? 'در حال کار' : op.status === 'on_break' ? 'استراحت' : 'آماده به کار'}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">تخصص و مهارت:</span>
                    <span className="text-slate-200 font-medium">{op.specialty}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400">
                      شیفت: <strong className="text-slate-200">{op.shift === 'morning' ? 'صبح' : op.shift === 'evening' ? 'عصر' : 'شب'}</strong>
                    </span>
                    <span className="text-slate-400">
                      دستگاه: <strong className="text-indigo-300">{assignedMach ? assignedMach.code : 'نامشخص'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(op)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(op)}
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

      {/* Modal: Add or Edit Operator */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                {editingOperator ? 'ویرایش مشخصات اپراتور' : 'افزودن اپراتور جدید'}
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
                  <label className="text-slate-300 block mb-1 font-bold">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: علی کریمی"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">کد پرسنلی:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: OP-104"
                    value={personnelCode}
                    onChange={(e) => setPersonnelCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="عکس پرسنلی اپراتور"
                placeholderText="آپلود تصویر پرسنلی یا لینک URL..."
                presets={[
                  { label: 'اپراتور فنی کارگاه', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80' },
                  { label: 'مهندس ماشین‌کاری', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80' }
                ]}
              />

              <div>
                <label className="text-slate-300 block mb-1 font-bold">تخصص و مهارت‌های فنی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تراشکاری CNC دقیق، بورینگ‌کاری، اپراتوری فرز"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">دستگاه اختصاص‌یافته:</label>
                  <select
                    value={assignedMachineId}
                    onChange={(e) => setAssignedMachineId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">بدون دستگاه ثابت</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">شیفت کاری:</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as 'morning' | 'evening' | 'night')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="morning">شیفت صبح (۰۷:۰۰ الی ۱۵:۰۰)</option>
                    <option value="evening">شیفت عصر (۱۵:۰۰ الی ۲۳:۰۰)</option>
                    <option value="night">شیفت شب (۲۳:۰۰ الی ۰۷:۰۰)</option>
                  </select>
                </div>
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
                  {editingOperator ? 'ذخیره تغییرات' : 'افزودن اپراتور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
