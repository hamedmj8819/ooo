import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { AuditLogItem } from '../types';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Filter,
  User,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCode,
  Layers,
  Activity,
} from 'lucide-react';

interface AuditLogViewProps {
  onBack?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ onBack }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchUser, setSearchUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 25;

  // Detail modal / expanded item
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    api.audit
      .getLogs({
        userId: searchUser.trim() || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        limit,
        offset: page * limit,
      })
      .then((res) => {
        if (isMounted) {
          setLogs(res.logs || []);
          setTotal(res.total || 0);
          setErrorMessage(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'خطا در دریافت لاگ‌های ممیزی';
          setErrorMessage(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchUser, selectedAction, selectedEntityType, page, limit]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    api.audit
      .getLogs({
        userId: searchUser.trim() || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        limit,
        offset: page * limit,
      })
      .then((res) => {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'خطا در دریافت لاگ‌های ممیزی';
        setErrorMessage(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchUser, selectedAction, selectedEntityType, page, limit]);

  const getActionBadge = (action: string) => {
    if (action.includes('delete') || action.includes('reject') || action.includes('lock')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('create') || action.includes('add') || action.includes('approved') || action.includes('login')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('update') || action.includes('edit') || action.includes('change')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return ts;
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">دفتر ثبت وقایع و ممیزی سامانه (Audit Log)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                Append-Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ردیابی غیرقابل تغییر کلیه عملیات‌های سیستمی، ورود/خروج، تغییرات مهندسی، تاییدات کیفی و صدور اسناد کارخانه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی وقایع</span>
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
            >
              <span>بازگشت به داشبورد</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>فیلترها:</span>
        </div>

        {/* User Search */}
        <div className="relative min-w-[200px] flex-1 sm:flex-none">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="شناسه یا نام کاربر..."
            value={searchUser}
            onChange={(e) => {
              setSearchUser(e.target.value);
              setPage(0);
            }}
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        {/* Action Type Filter */}
        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setPage(0);
          }}
          className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400"
        >
          <option value="">کلیه عملیات‌ها</option>
          <option value="login">ورود کاربر (login)</option>
          <option value="logout">خروج کاربر (logout)</option>
          <option value="login_failed">تلاش ناموفق ورود</option>
          <option value="account_locked">قفل موقت حساب</option>
          <option value="change_password">تغییر کلمه عبور</option>
          <option value="create_order">صدور سفارش تولید</option>
          <option value="decide_quote">تصمیم پیش‌فاکتور ریخته‌گری</option>
          <option value="confirm_material">تأیید ورود شمش/متریال</option>
          <option value="assign_stage">تخصیص مرحله به ماشین</option>
          <option value="start_stage">شروع ماشین‌کاری مرحله</option>
          <option value="progress_stage">ثبت خروجی/ضایعات مرحله</option>
          <option value="submit_qc">ثبت برگه بازرسی QC</option>
          <option value="approve_qc">تأییدیه مهندسی برگه QC</option>
          <option value="reject_qc">عدم انطباق مهندسی QC</option>
          <option value="handover_warehouse">تحویل به انبار محصول/نیمه‌ساخته</option>
          <option value="adjust_stock">تعدیل موجودی انبار</option>
          <option value="delete_">حذف نرم (Soft Delete)</option>
        </select>

        {/* Entity Type Filter */}
        <select
          value={selectedEntityType}
          onChange={(e) => {
            setSelectedEntityType(e.target.value);
            setPage(0);
          }}
          className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400"
        >
          <option value="">کلیه موجودیت‌ها</option>
          <option value="order">سفارش‌های تولید (orders)</option>
          <option value="quote">پیش‌فاکتورها (quotes)</option>
          <option value="qc_report">گزارش‌های QC</option>
          <option value="machine">ماشین‌آلات کارگاه</option>
          <option value="operator">اپراتورها</option>
          <option value="part">قطعات و BOM</option>
          <option value="model">مدل‌های کمپرسور/بلوئر</option>
          <option value="warehouse">انبار و کاردکس</option>
          <option value="user">کاربران سیستم</option>
          <option value="foundry">تأمین‌کنندگان ریخته‌گری</option>
        </select>

        <div className="text-xs text-slate-400 mr-auto font-mono">
          مجموع رکوردها: <span className="text-white font-bold">{total}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-bold">
                <th className="px-4 py-3.5 w-12">#</th>
                <th className="px-4 py-3.5">زمان ثبت</th>
                <th className="px-4 py-3.5">کاربر مجری</th>
                <th className="px-4 py-3.5">نقش</th>
                <th className="px-4 py-3.5">نوع عملیات</th>
                <th className="px-4 py-3.5">موجودیت و شناسه</th>
                <th className="px-4 py-3.5">آدرس IP</th>
                <th className="px-4 py-3.5 text-center">تغییرات داده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    هیچ رکوردی منطبق با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const hasValueDiff = Boolean(log.oldValue || log.newValue || log.details);

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{log.id}</td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap font-mono text-[11px] flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </td>
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.userName || log.userId || 'سیستم'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {log.userRole || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 font-bold">{log.entityType}:</span>
                            <span className="font-mono text-[11px] text-cyan-400">{log.entityId || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap" dir="ltr">
                          {log.ipAddress || '-'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {hasValueDiff ? (
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold inline-flex items-center gap-1 transition"
                            >
                              <FileCode className="w-3 h-3 text-cyan-400" />
                              <span>{isExpanded ? 'بستن جزئیات' : 'مشاهده مقادیر'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded View for Values Diff */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={8} className="p-4 border-b border-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono" dir="ltr">
                              {log.oldValue && (
                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                  <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                                    <span>Old Value (مقدار قبلی):</span>
                                  </div>
                                  <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                                    {JSON.stringify(log.oldValue, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.newValue && (
                                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                  <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                                    <span>New Value (مقدار جدید):</span>
                                  </div>
                                  <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                                    {JSON.stringify(log.newValue, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {log.details && (
                                <div className="md:col-span-2 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                                  <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1">
                                    <span>Additional Details (جزئیات مکمل):</span>
                                  </div>
                                  <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-48">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 disabled:opacity-40"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>صفحه قبل</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              صفحه {page + 1} از {totalPages}
            </span>

            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 disabled:opacity-40"
            >
              <span>صفحه بعد</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
