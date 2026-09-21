import React, { useState } from 'react';
import { FoundryPartner } from '../../../types';
import { PlusCircle, Edit3, Trash2, Building2, Phone, User, Star, MapPin, Sparkles } from 'lucide-react';
import { ImageUploader } from '../../ImageUploader';

interface FoundriesManagerProps {
  foundries: FoundryPartner[];
  onAddFoundry: (foundry: FoundryPartner) => void;
  onUpdateFoundry?: (foundry: FoundryPartner) => void;
  onDeleteFoundry?: (foundryId: string) => void;
}

export const FoundriesManager: React.FC<FoundriesManagerProps> = ({
  foundries,
  onAddFoundry,
  onUpdateFoundry,
  onDeleteFoundry
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingFoundry, setEditingFoundry] = useState<FoundryPartner | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('تهران');
  const [qualityRating, setQualityRating] = useState(4.8);
  const [capabilitiesStr, setCapabilitiesStr] = useState('چدن نشکن GGG40, چدن خاکستری GG25, عملیات حرارتی');
  const [image, setImage] = useState('');

  const openAddModal = () => {
    setEditingFoundry(null);
    setName('');
    setManager('');
    setPhone('');
    setCity('تهران');
    setQualityRating(4.8);
    setCapabilitiesStr('چدن نشکن GGG40, چدن خاکستری GG25, عملیات حرارتی');
    setImage('');
    setShowModal(true);
  };

  const openEditModal = (f: FoundryPartner) => {
    setEditingFoundry(f);
    setName(f.name);
    setManager(f.manager);
    setPhone(f.phone);
    setCity(f.city);
    setQualityRating(f.qualityRating);
    setCapabilitiesStr(f.capabilities ? f.capabilities.join(', ') : '');
    setImage(f.image || f.imageUrl || f.logoUrl || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capabilities = capabilitiesStr.split(',').map(c => c.trim()).filter(Boolean);

    if (editingFoundry && onUpdateFoundry) {
      onUpdateFoundry({
        ...editingFoundry,
        name,
        manager,
        phone,
        city,
        qualityRating: Number(qualityRating),
        capabilities,
        image,
        imageUrl: image,
        logoUrl: image
      });
    } else {
      onAddFoundry({
        id: 'FND-' + Date.now().toString().slice(-4),
        name,
        manager,
        phone,
        city,
        qualityRating: Number(qualityRating),
        capabilities,
        activeOrdersCount: 0,
        image,
        imageUrl: image,
        logoUrl: image
      });
    }
    setShowModal(false);
  };

  const handleDelete = (f: FoundryPartner) => {
    if (confirm(`آیا از حذف شرکت ریخته‌گری "${f.name}" اطمینان دارید؟`)) {
      if (onDeleteFoundry) {
        onDeleteFoundry(f.id);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            شرکای ریخته‌گری همکار و تامین‌کنندگان متالورژی
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف، ویرایش اطلاعات تماس، ارزیابی کیفی، آپلود لوگو/تصویر و حذف شرکای ریخته‌گری
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          افزودن شرکت ریخته‌گری
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foundries.map((f) => {
          const displayImage = f.image || f.imageUrl || f.logoUrl;
          return (
            <div
              key={f.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 hover:border-indigo-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header & Logo */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={f.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{f.name}</h4>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {f.city}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {f.qualityRating}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <User className="w-3 h-3 text-slate-500" />
                      مدیر / رابط:
                    </span>
                    <span className="font-bold">{f.manager}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-500" />
                      شماره تماس:
                    </span>
                    <span className="font-mono text-cyan-300">{f.phone}</span>
                  </div>
                </div>

                {/* Capabilities tags */}
                <div className="flex flex-wrap gap-1">
                  {f.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(f)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  ویرایش
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
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

      {/* Modal: Add or Edit Foundry */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                {editingFoundry ? 'ویرایش شرکت ریخته‌گری' : 'افزودن شرکت ریخته‌گری جدید'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-bold">نام شرکت / ریخته‌گری:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شرکت صنایع ریخته‌گری دقیق اصفهان"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image / Logo Uploader */}
              <ImageUploader
                value={image}
                onChange={setImage}
                label="لوگو یا تصویر کارخانه ریخته‌گری"
                placeholderText="آپلود تصویر کارخانه یا لینک URL..."
                presets={[
                  { label: 'کوره ریخته‌گری ذوب', url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80' },
                  { label: 'کارگاه متالورژی', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80' }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">مدیر یا مسئول پیگیری:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس رضوانی"
                    value={manager}
                    onChange={(e) => setManager(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">شماره تماس مستقیم:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 031-33801234"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">شهر یا شهرک صنعتی:</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">امتیاز کیفی (از ۵):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">قابلیت‌ها و آلیاژها (با ویرگول جدا کنید):</label>
                <input
                  type="text"
                  value={capabilitiesStr}
                  onChange={(e) => setCapabilitiesStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  placeholder="مثال: چدن داکتیل GGG50, فولاد نسوز, آنالیز کوانتومتری"
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
                  {editingFoundry ? 'ذخیره تغییرات ریخته‌گری' : 'افزودن شرکت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
