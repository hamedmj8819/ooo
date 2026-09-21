import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Link as LinkIcon, Camera } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholderText?: string;
  presets?: { label: string; url: string }[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'عکس / تصویر فنی',
  placeholderText = 'آپلود تصویر از حافظه یا وارد کردن لینک URL...',
  presets = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate max size 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم تصویر بیش از ۵ مگابایت است. لطفاً تصویر کم‌حجم‌تری انتخاب فرمایید.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>حذف عکس</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {/* Preview Box */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700/80 overflow-hidden flex items-center justify-center relative group">
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1"
                >
                  <Camera className="w-3 h-3" />
                  تغییر
                </button>
              </div>
            </>
          ) : (
            <div className="text-center p-2 text-slate-500 flex flex-col items-center">
              <Camera className="w-6 h-6 mb-1 text-slate-600" />
              <span className="text-[10px]">بدون عکس</span>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>انتخاب فایل عکس از کامپیوتر / گوشی</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <input
              type="url"
              placeholder={placeholderText}
              value={value?.startsWith('data:') ? 'تصویر ذخیره شده در سیستم' : (value || '')}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500">تصاویر نمونه:</span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(preset.url)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
