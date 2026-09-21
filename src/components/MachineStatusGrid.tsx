import React, { useState } from 'react';
import { MachineTool, MachineStatus } from '../types';
import {
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Flame,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface MachineStatusGridProps {
  machines: MachineTool[];
  onReportBreakdown?: (machineId: string, reason: string) => void;
  onResolveBreakdown?: (machineId: string) => void;
  canManageBreakdowns?: boolean;
}

const STATUS_CONFIG: Record<MachineStatus, { label: string; bg: string; text: string; border: string; badge: string }> = {
  active: {
    label: 'در حال کار (Active)',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    border: 'border-emerald-600/40',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  idle: {
    label: 'آماده به کار (Idle)',
    bg: 'bg-slate-900/60',
    text: 'text-cyan-400',
    border: 'border-cyan-600/30',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
  },
  breakdown: {
    label: 'خراب / توقف خط (Down)',
    bg: 'bg-rose-950/50',
    text: 'text-rose-400',
    border: 'border-rose-500/60',
    badge: 'bg-rose-500/30 text-rose-200 border-rose-500/50 animate-pulse'
  },
  maintenance: {
    label: 'تعمیرات دوره‌ای (PM)',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    border: 'border-amber-600/40',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }
};

export const MachineStatusGrid: React.FC<MachineStatusGridProps> = ({
  machines,
  onReportBreakdown,
  onResolveBreakdown,
  canManageBreakdowns = true
}) => {
  const [selectedMachineForBreakdown, setSelectedMachineForBreakdown] = useState<string | null>(null);
  const [breakdownReasonInput, setBreakdownReasonInput] = useState('');

  const activeCount = machines.filter(m => m.status === 'active').length;
  const idleCount = machines.filter(m => m.status === 'idle').length;
  const breakdownCount = machines.filter(m => m.status === 'breakdown').length;

  const handleBreakdownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMachineForBreakdown && breakdownReasonInput.trim() && onReportBreakdown) {
      onReportBreakdown(selectedMachineForBreakdown, breakdownReasonInput.trim());
      setSelectedMachineForBreakdown(null);
      setBreakdownReasonInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            وضعیت زنده ماشین‌آلات کارخانه و ایستگاه‌های برون‌سپاری
          </h3>
          <p className="text-xs text-slate-400">مانیتورینگ برخط پارامترهای تولید، خرابی‌ها و تخصیص قطعات</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {activeCount} دستگاه فعال
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-600/40 text-cyan-400 font-medium">
            {idleCount} آماده به کار
          </span>
          {breakdownCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {breakdownCount} دستگاه متوقف/خراب
            </span>
          )}
        </div>
      </div>

      {/* Grid of Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((machine) => {
          const cfg = STATUS_CONFIG[machine.status];
          const isOutsourced = machine.type === 'outsourced';

          return (
            <div
              key={machine.id}
              className={`rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${cfg.bg} ${cfg.border} shadow-lg hover:shadow-cyan-500/5`}
            >
              {/* Corner Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {machine.code}
                    </span>
                    {isOutsourced ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                        برون‌سپاری
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60">
                        داخل شرکت
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                    {machine.name}
                  </h4>
                </div>

                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                  {cfg.label.split(' ')[0]}
                </span>
              </div>

              {/* Specs & Location */}
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                {machine.specifications}
              </p>

              {/* Status details */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                {machine.status === 'breakdown' ? (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/50 text-rose-200">
                    <div className="font-bold flex items-center gap-1 text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      علت توقف و خرابی:
                    </div>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{machine.breakdownReason}</p>
                    <span className="text-[10px] text-rose-400 block mt-1">
                      زمان ثبت: {machine.breakdownReportedAt}
                    </span>
                  </div>
                ) : machine.status === 'active' ? (
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">سفارش جاری:</span>
                      <span className="font-mono text-cyan-300 font-bold">{machine.currentWorkOrderId}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      <span className="text-slate-500">قطعه: </span>
                      {machine.currentPartName}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-cyan-400" />
                        {machine.currentOperatorName || 'اپراتور شیفت'}
                      </span>
                      <span className="text-emerald-400 font-medium">{machine.currentStageName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-800/50 text-slate-400 text-center py-3 text-[11px]">
                    دستگاه آزاد و آماده تخصیص کار جدید است
                  </div>
                )}

                {/* Health Meter & Location */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {machine.location.split('-')[0]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>سلامت:</span>
                    <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          (machine.healthPercent ?? 100) > 80
                            ? 'bg-emerald-500'
                            : (machine.healthPercent ?? 100) > 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${machine.healthPercent ?? 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-slate-300">{machine.healthPercent ?? 100}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Breakdown resolution or report */}
              {canManageBreakdowns && !isOutsourced && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2">
                  {machine.status === 'breakdown' ? (
                    <button
                      onClick={() => onResolveBreakdown && onResolveBreakdown(machine.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      اعلام پایان تعمیر و آماده‌به‌کار شدن
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedMachineForBreakdown(machine.id)}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700/80 transition flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5 text-rose-400" />
                      گزارش نقص فنی یا توقف اضطراری
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for reporting breakdown */}
      {selectedMachineForBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">اعلام خرابی و توقف دستگاه کارخانه</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              با ثبت خرابی، وضعیت دستگاه در تمام شبکه کارخانه به رنگ قرمز درمی‌آید و به مدیران تولید و برنامه‌ریزی هشدار ارسال می‌شود.
            </p>

            <form onSubmit={handleBreakdownSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  دلیل توقف و شرح عیب (مکانیکی / برقی / هیدرولیک / شکست ابزار):
                </label>
                <textarea
                  rows={3}
                  required
                  value={breakdownReasonInput}
                  onChange={(e) => setBreakdownReasonInput(e.target.value)}
                  placeholder="مثال: لرزش شدید اسپیندل در دور بالا، نشت روغن هیدرولیک، سوختن درایو محور Z..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMachineForBreakdown(null);
                    setBreakdownReasonInput('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  ثبت توقف اضطراری و هشدار به خط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
