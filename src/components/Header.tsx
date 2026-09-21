import React, { useState } from 'react';
import { UserRole } from '../types';
import {
  Bell,
  Cpu,
  UserCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  Calendar,
} from 'lucide-react';
import { getCurrentJalali, formatFullPersianDate } from '../utils/persianDate';
import { PersianDateTimePickerModal } from './PersianDateTimePicker';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../features/notifications/api';

export const ROLE_LABELS: Record<UserRole, { title: string; subtitle: string; color: string; badge: string }> = {
  super_admin: {
    title: 'سوپر ادمین (پشتیبانی سیستم)',
    subtitle: 'مدیریت داده‌های پایه، ماشین‌آلات، کاربران و BOM',
    color: 'from-purple-600 to-indigo-600',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  ceo: {
    title: 'مدیرعامل (مدیریت ارشد)',
    subtitle: 'صدور دستور ساخت، بررسی پیش‌فاکتور و آمار',
    color: 'from-amber-600 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  planning: {
    title: 'مدیر برنامه‌ریزی و تولید',
    subtitle: 'صدور PO، استعلام پیش‌فاکتور و رهگیری مراحل',
    color: 'from-blue-600 to-cyan-600',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  engineering: {
    title: 'واحد مهندسی مکانیک و CAD',
    subtitle: 'بارگذاری نقشه‌ها و فایل‌های STEP مراحل',
    color: 'from-emerald-600 to-teal-600',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  production: {
    title: 'مدیر سالن تولید و ماشین‌کاری',
    subtitle: 'تخصیص کار به ماشین‌ها و نظارت بر اپراتورها',
    color: 'from-rose-600 to-pink-600',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  operator: {
    title: 'اپراتور دستگاه و ماشین‌کار',
    subtitle: 'ثبت کارکرد، تولید قطعه و اعلام خرابی دستگاه',
    color: 'from-yellow-600 to-amber-600',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  warehouse: {
    title: 'انبار مرکزی و موجودی قطعات',
    subtitle: 'تحویل‌گیری قطعات نهایی و نیمه‌ساخته، کاردکس',
    color: 'from-teal-600 to-emerald-600',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  qc: {
    title: 'واحد کنترل کیفیت (QC)',
    subtitle: 'اندازه‌برداری، آپلود برگه و فرم QC، ارسال به مهندسی',
    color: 'from-blue-600 to-indigo-600',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
};

export function Header() {
  const { currentUser, currentUserRole, setCurrentUserRole, logout } = useAuth();
  const { data: notifications = [] } = useNotifications(currentUserRole);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const currentJalali = getCurrentJalali();
  const unreadNotifs = notifications.filter((n) => !n.isRead);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white">
                  MES کارخانه ساخت کمپرسور و بلوئر
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  LAN 100% Offline
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium line-clamp-1">
                {ROLE_LABELS[currentUserRole]?.title || 'سامانه یکپارچه برنامه‌ریزی تولید'}
              </p>
            </div>
          </div>

          {/* Persian Calendar Button */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 text-xs text-slate-300 hover:text-white transition group"
              title="مشاهده و انتخاب تاریخ در تقویم ایرانی شمسی"
            >
              <Calendar className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              <span className="font-mono text-cyan-300 font-bold">{currentJalali.formatted}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                تقویم شمسی
              </span>
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 text-slate-300 hover:text-white transition"
                title="پیام‌ها و اعلان‌های سیستم"
                aria-label="اعلان‌ها"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-cyan-400" />
                      اعلان‌های لحظه‌ای کارخانه ({notifications.length})
                    </span>
                    <button
                      onClick={() => markAllReadMutation.mutate()}
                      className="text-[11px] text-cyan-400 hover:underline disabled:opacity-50"
                      disabled={markAllReadMutation.isPending}
                    >
                      خوانده شدن همه
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">اعلانی وجود ندارد</p>
                    ) : (
                      notifications.slice(0, 15).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markReadMutation.mutate(n.id)}
                          className={`p-2.5 rounded-xl text-xs cursor-pointer border transition ${
                            n.isRead
                              ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                              : 'bg-slate-800/90 border-slate-700 text-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold flex items-center gap-1.5 text-slate-200">
                              {n.type === 'error' && <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                              {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                              {n.type === 'info' && <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                              <span className="line-clamp-1">{n.title}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                              {formatFullPersianDate(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-300 mb-1">{n.message}</p>
                          {n.linkOrderId && (
                            <div className="mt-1 flex items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                                شناسه سفارش: {n.linkOrderId}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher (for super_admin) */}
            {currentUser?.role === 'super_admin' && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition shadow-sm text-right"
                  aria-label="تغییر میزکار"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      {ROLE_LABELS[currentUserRole]?.title.split(' ')[0]} {ROLE_LABELS[currentUserRole]?.title.split(' ')[1]}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-slate-400">تغییر میزکار (Role)</div>
                  </div>
                </button>

                {showRoleMenu && (
                  <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-300">جابجایی بین ۸ میزکار سازمانی کارخانه:</p>
                    </div>
                    <div className="space-y-1">
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setCurrentUserRole(role);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-right p-2.5 rounded-xl text-xs flex flex-col gap-0.5 transition ${
                            currentUserRole === role
                              ? 'bg-cyan-950/80 border border-cyan-600/60 text-white'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{ROLE_LABELS[role].title}</span>
                            {currentUserRole === role && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                          </div>
                          <span className="text-[10px] text-slate-400 leading-tight">
                            {ROLE_LABELS[role].subtitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Logged-in User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1 border-r border-slate-800 pr-2">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-white leading-tight">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.username} | {currentUser.personnelCode}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700/80 text-slate-400 transition flex items-center gap-1 text-xs"
                  title="خروج از حساب کاربری"
                  aria-label="خروج"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">خروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCalendarModal && (
        <PersianDateTimePickerModal
          title="تقویم شمسی کارخانه و ساعت رسمی"
          includeTime={true}
          onSelect={() => setShowCalendarModal(false)}
          onClose={() => setShowCalendarModal(false)}
        />
      )}
    </header>
  );
}
