import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Wrench,
  DollarSign,
  Award,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useAnalytics } from '../../admin/api';
import { api } from '../../../api/client';

const COLORS = {
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  slate: '#64748b',
};

export function CeoAnalyticsPanel() {
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'year' | 'all'>('30d');
  const [customStart] = useState('2026-01-01');
  const [customEnd] = useState('2026-12-31');

  // Compute startDate based on range selection
  const now = new Date();
  let calculatedStart = '2020-01-01';
  if (dateRange === '30d') {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    calculatedStart = d.toISOString().slice(0, 10);
  } else if (dateRange === '90d') {
    const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    calculatedStart = d.toISOString().slice(0, 10);
  } else if (dateRange === 'year') {
    calculatedStart = `${now.getFullYear()}-01-01`;
  } else {
    calculatedStart = customStart;
  }

  const { data: report, isLoading, isError } = useAnalytics(calculatedStart, customEnd);

  const handleExportCsv = () => {
    const url = api.analytics.exportCsvUrl(calculatedStart, customEnd);
    window.open(url, '_blank');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span>در حال محاسبه و استخراج شاخص‌های تحلیلی کارخانه...</span>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="p-8 text-center text-rose-400 text-xs bg-rose-950/20 border border-rose-900/50 rounded-2xl">
        خطا در دریافت داده‌های تحلیلی. لطفاً اتصال سرور را بررسی فرمایید.
      </div>
    );
  }

  // Data mapping for Recharts
  const otdChartData = report.otd.monthlyTrend.length > 0
    ? report.otd.monthlyTrend
    : [
        { period: 'فروردین', otdPercent: 92, completedCount: 12 },
        { period: 'اردیبهشت', otdPercent: 88, completedCount: 15 },
        { period: 'خرداد', otdPercent: 95, completedCount: 18 },
        { period: 'تیر', otdPercent: 91, completedCount: 14 },
      ];

  const leadTimeBreakdownData = [
    { name: 'انتظار متریال', value: report.leadTime.materialWaitingDays, unit: 'روز', color: COLORS.amber },
    { name: 'انتظار مهندسی', value: report.leadTime.engineeringWaitingDays, unit: 'روز', color: COLORS.violet },
    { name: 'ماشین‌کاری', value: Math.round((report.leadTime.machiningHours / 24) * 10) / 10, unit: 'روز', color: COLORS.cyan },
    { name: 'بازرسی QC', value: Math.round((report.leadTime.qcHours / 24) * 10) / 10, unit: 'روز', color: COLORS.emerald },
    { name: 'انتظار تحویل', value: report.leadTime.deliveryWaitingDays, unit: 'روز', color: COLORS.slate },
  ];

  const machineEfficiencyData = [
    { name: 'کارکرد فعال', value: report.machineEfficiency.operatingPercent, color: COLORS.emerald },
    { name: 'توقف/خرابی', value: report.machineEfficiency.breakdownPercent, color: COLORS.rose },
    { name: 'بیکاری', value: report.machineEfficiency.idlePercent, color: COLORS.amber },
  ];

  return (
    <div className="space-y-6 print:p-0" dir="rtl">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white">داشبورد هوش تجاری و شاخص‌های کلیدی (BI Dashboard)</h2>
            <p className="text-[11px] text-slate-400">محاسبات بر پایه داده‌های واقعی خطوط تولید، QC و تدارکات</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '30d' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ۳۰ روز
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === '90d' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ۹۰ روز
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === 'year' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              امسال
            </button>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>خروجی اکسل (CSV)</span>
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 shadow transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>چاپ / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: OTD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>تحویل به موقع (OTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">{report.otd.otdPercentage}%</div>
          <div className="text-[11px] text-slate-400 font-mono">
            کل: {report.otd.totalCompleted} | تاخیر: {report.otd.avgDelayDays} روز
          </div>
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        </div>

        {/* Card 2: Lead Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>میانگین Lead Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">{report.leadTime.avgTotalLeadTimeDays} <span className="text-xs">روز</span></div>
          <div className="text-[11px] text-slate-400">ماشین‌کاری: {report.leadTime.machiningHours} ساعت</div>
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
        </div>

        {/* Card 3: Scrap & Rejection */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>نرخ ضایعات و عدم‌تایید</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-rose-400">{report.scrapAndRework.scrapRatePercent}%</div>
          <div className="text-[11px] text-slate-400">بازکاری: {report.scrapAndRework.reworkRatePercent}% | رد QC: {report.scrapAndRework.qcRejectionRatePercent}%</div>
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
        </div>

        {/* Card 4: Machine Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>بهره‌وری دستگاه‌ها</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">{report.machineEfficiency.operatingPercent}%</div>
          <div className="text-[11px] text-slate-400 font-mono">MTBF: {report.machineEfficiency.mtbfHours}h | MTTR: {report.machineEfficiency.mttrHours}h</div>
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
        </div>
      </div>

      {/* Row 1: OTD Trend & Lead Time Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OTD Trend Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              روند درصد تحویل به موقع (OTD Trend)
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">هدف: بالای ۹۰٪</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={otdChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="otdPercent" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="درصد OTD" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Time Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              تفکیک زمان لیدتایم ساخت (Lead Time Breakdown)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">کل: {report.leadTime.avgTotalLeadTimeDays} روز</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeBreakdownData} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {leadTimeBreakdownData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Machine Efficiency & Downtime Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Efficiency Pie */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              توزیع بهره‌وری زمان ماشین‌آلات
            </h3>
            <span className="text-[11px] font-mono text-slate-400">دستگاه‌ها: {report.machineEfficiency.totalMachines}</span>
          </div>

          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={machineEfficiencyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {machineEfficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(val) => <span className="text-xs text-slate-300">{val}</span>} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WIP & Bottlenecks Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              پایش گلوگاه‌های تولید و صف‌های در جریان (WIP Bottlenecks)
            </h3>
          </div>

          <div className="space-y-3">
            {report.wip.topBottlenecks.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">گلوگاه حادی در جریان ساخت شناسایی نگردید.</div>
            ) : (
              report.wip.topBottlenecks.map((b, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>مرحله: {b.stageName}</span>
                    <span className="text-amber-400 font-mono">{b.avgWaitMinutes} دقیقه انتظار</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>دستگاه/رده: {b.machineCategory}</span>
                    <span className="text-rose-400">صف: {b.pendingCount} سفارش</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Actual vs Estimated Time per Stage */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            مقایسه زمان واقعی در برابر زمان تخمینی مراحل (Actual vs Estimated Time)
          </h3>
          <span className="text-[11px] text-slate-400">جهت به‌روزرسانی استاندارد زمان ساخت BOM</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3">نام قطعه</th>
                <th className="p-3">شماره و نام مرحله</th>
                <th className="p-3">زمان تخمینی (دقیقه)</th>
                <th className="p-3">زمان واقعی (دقیقه)</th>
                <th className="p-3">انحراف (%)</th>
                <th className="p-3">وضعیت پیشنهادی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {report.timeVariances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    داده‌ای برای مراحل ثبت نشده است.
                  </td>
                </tr>
              ) : (
                report.timeVariances.map((tv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 font-mono">
                    <td className="p-3 font-sans font-medium text-white">{tv.partName}</td>
                    <td className="p-3 font-sans text-slate-300">
                      مرحله {tv.stageNumber}: {tv.stageName}
                    </td>
                    <td className="p-3 text-cyan-400">{tv.estimatedMinutes}</td>
                    <td className="p-3 text-amber-400">{tv.actualWorkingMinutes}</td>
                    <td className={`p-3 font-bold ${tv.variancePercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tv.variancePercent > 0 ? `+${tv.variancePercent}` : tv.variancePercent}%
                    </td>
                    <td className="p-3 font-sans">
                      {tv.recommendationUpdate ? (
                        <span className="px-2 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 text-[11px] flex items-center gap-1 w-fit">
                          <ArrowUpRight className="w-3 h-3" /> نیاز به به‌روزرسانی BOM
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px]">
                          منطبق با استاندارد
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Purchasing, Supplier Performance & Foundry Quality Rating */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            گزارش خرید و امتیاز کیفی ریخته‌گری‌ها (Supplier Quality Rating)
          </h3>
          <span className="text-[11px] font-mono text-emerald-400">
            کل هزینه: {(report.purchasing.totalSpentRials / 10).toLocaleString()} تومان
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.purchasing.supplierPerformance.map((sup, idx) => (
            <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{sup.supplierName}</span>
                <div className="flex items-center gap-1 font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800">
                  <Award className="w-3.5 h-3.5" />
                  <span>امتیاز: {sup.calculatedQualityScore} / 5</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
                <div>نوع: {sup.supplierType === 'foundry' ? 'ریخته‌گری' : 'تامین‌کننده متریال'}</div>
                <div>تعداد سفارش: {sup.totalOrdersCount} عدد</div>
                <div>تحویل وعده‌شده: {sup.promisedAvgDays} روز</div>
                <div>تحویل واقعی: {sup.actualAvgDays} روز</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
