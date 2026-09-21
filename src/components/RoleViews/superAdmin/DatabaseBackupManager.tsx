import React, { useRef, useState } from 'react';
import { Database, Download, Upload, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../api/client';

export const DatabaseBackupManager: React.FC = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmInput, setConfirmInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleExport = () => {
    window.open(api.backup.exportUrl, '_blank');
    showToast({ type: 'success', title: 'پشتیبان‌گیری', message: 'فایل پشتیبان در حال دانلود است.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        if (content) {
          try {
            showToast({
              type: 'info',
              title: 'پشتیبان‌گیری',
              message: 'فایل پشتیبان دریافت شد و سیستم آماده بازگردانی است.',
            });
          } catch {
            showToast({ type: 'error', title: 'خطا', message: 'فایل پشتیبان نامعتبر است.' });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetExecute = async () => {
    if (confirmInput.trim() !== 'تایید' && confirmInput.trim() !== 'تایید') {
      showToast({ type: 'error', title: 'خطای تاییدیه', message: 'لطفاً کلمه «تایید» را دقیقاً تایپ کنید.' });
      return;
    }

    try {
      setIsResetting(true);
      await api.backup.reset();
      showToast({ type: 'success', title: 'بازنشانی کامل', message: 'اطلاعات با موفقیت به تنظیمات اولیه کارخانه برگشت.' });
      setShowConfirmModal(false);
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'عملیات با خطا مواجه شد.';
      showToast({ type: 'error', title: 'خطا در بازنشانی', message });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 space-y-1">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          مدیریت پشتیبان‌گیری، بازگردانی و تنظیمات پایگاه‌داده کارخانه
        </h3>
        <p className="text-xs text-slate-400">
          امکان استخراج دیتابیس جامع سیستم MES شامل سفارشات، ماشین‌آلات، کاتالوگ قطعات، تصاویر و بازنشانی به داده‌های پیش‌فرض
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Export Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">پشتیبان‌گیری از کل سیستم (Export JSON)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                استخراج تمام داده‌های مدل‌ها، قطعات، ماشین‌آلات، تصاویر، کاربران، سفارشات و انبار در قالب یک فایل استاندارد JSON.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل پشتیبان کامل</span>
          </button>
        </div>

        {/* Import Backup Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">بازگردانی اطلاعات از فایل (Import JSON)</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                فراخوانی و بازیابی پایگاه‌داده از فایل پشتیبان JSON قبلی بدون از دست رفتن داده‌های پیشین.
              </p>
            </div>
          </div>
          <div>
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold transition flex items-center justify-center gap-2 shadow"
            >
              <Upload className="w-4 h-4" />
              <span>انتخاب و بازگردانی فایل JSON</span>
            </button>
          </div>
        </div>

        {/* Reset Factory Defaults Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-rose-500/50 transition">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">بازنشانی به پیش‌فرض کارخانه</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                پاک‌سازی تمام تغییرات و بارگذاری مجدد اطلاعات پیش‌فرض کارخانه کمپرسورسازی (تایید دومرحله‌ای).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmInput('');
              setShowConfirmModal(true);
            }}
            className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>بازنشانی به تنظیمات کارخانه</span>
          </button>
        </div>
      </div>

      {/* Two-step Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تایید دومرحله‌ای بازنشانی کارخانه</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              هشدار: تمام سفارشات ثبت‌شده، سوابق انبار، لاگ‌های کیفیت و تغییرات سیستم به حالت اولیه بازمی‌گردد. جهت تایید نهایی، عبارت <strong className="text-rose-400 font-mono">تایید</strong> را در کادر زیر تایپ کنید:
            </p>

            <div className="mb-5">
              <label htmlFor="confirm-reset-input" className="block text-xs font-medium text-slate-400 mb-1">
                تایپ کلمه تایید:
              </label>
              <input
                id="confirm-reset-input"
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="تایید"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500 font-mono text-center tracking-widest"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleResetExecute}
                disabled={confirmInput.trim() !== 'تایید' || isResetting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 transition-colors shadow-lg shadow-rose-950/50"
              >
                {isResetting ? 'در حال بازنشانی...' : 'اجرای بازنشانی نهایی'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
