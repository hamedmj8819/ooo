import React from 'react';
import { ClipboardCheck, Clock, CheckCircle2, ShieldCheck, BadgeAlert } from 'lucide-react';

interface QCMetricsHeaderProps {
  pendingCount: number;
  pendingEngCount: number;
  completedCount: number;
  rejectedCount: number;
  activeTab: 'pending_qc' | 'pending_eng' | 'all' | 'completed';
  onTabChange: (tab: 'pending_qc' | 'pending_eng' | 'all' | 'completed') => void;
}

export function QCMetricsHeader({
  pendingCount,
  pendingEngCount,
  completedCount,
  rejectedCount,
  activeTab,
  onTabChange,
}: QCMetricsHeaderProps) {
  return (
    <div className="space-y-4" dir="rtl">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => onTabChange('pending_qc')}
          className={`p-3.5 rounded-2xl border text-right transition-all ${
            activeTab === 'pending_qc'
              ? 'bg-amber-950/80 border-amber-500 text-amber-100 shadow-lg ring-1 ring-amber-500/50'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">منتظر بازرسی QC</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-300">{pendingCount}</div>
        </button>

        <button
          onClick={() => onTabChange('pending_eng')}
          className={`p-3.5 rounded-2xl border text-right transition-all ${
            activeTab === 'pending_eng'
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-100 shadow-lg ring-1 ring-cyan-500/50'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">منتظر تایید مهندسی</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black font-mono text-cyan-300">{pendingEngCount}</div>
        </button>

        <button
          onClick={() => onTabChange('completed')}
          className={`p-3.5 rounded-2xl border text-right transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-lg ring-1 ring-emerald-500/50'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">تایید شده کیفیت</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-300">{completedCount}</div>
        </button>

        <button
          onClick={() => onTabChange('all')}
          className={`p-3.5 rounded-2xl border text-right transition-all ${
            activeTab === 'all'
              ? 'bg-slate-800 border-slate-600 text-white shadow-lg'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">دارای عدم انطباق</span>
            <BadgeAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-400">{rejectedCount}</div>
        </button>
      </div>
    </div>
  );
}
