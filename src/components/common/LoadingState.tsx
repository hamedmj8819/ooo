import React from 'react';

export function LoadingState({ message = 'در حال دریافت اطلاعات...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4" dir="rtl">
      <div className="relative w-10 h-10 mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-xs text-slate-400 animate-pulse font-medium">{message}</p>
    </div>
  );
}
