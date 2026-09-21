import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'بروز خطا در دریافت داده‌ها',
  message = 'برقراری ارتباط با سرور برقرار نشد یا خطایی رخ داد.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-rose-900/40 rounded-2xl bg-rose-950/20" dir="rtl">
      <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-bold text-rose-200 mb-1">{title}</h3>
      <p className="text-xs text-rose-300/80 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-100 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-700/60 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}
