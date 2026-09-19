import React, { useState } from 'react';
import { SystemUser, UserRole } from '../types';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Factory,
  Cpu,
  LogIn,
  AlertCircle,
  CheckCircle2,
  HardHat,
  Briefcase,
  Layers,
  Wrench,
  Boxes,
  Compass,
  ClipboardCheck
} from 'lucide-react';

interface LoginScreenProps {
  users: SystemUser[];
  onLogin: (username: string, password: string) => { success: boolean; message?: string };
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('لطفاً نام کاربری و کلمه عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = onLogin(username.trim(), password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'خطا در احراز هویت.');
      }
    }, 250);
  };

  const handleQuickLogin = (uName: string, pass: string) => {
    setUsername(uName);
    setPassword(pass);
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      const res = onLogin(uName, pass);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'خطا در ورود.');
      }
    }, 200);
  };

  const roleIcons: Record<UserRole, { icon: React.ReactNode; color: string; label: string; badge: string }> = {
    super_admin: {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/40 bg-indigo-950/30 hover:bg-indigo-950/60',
      label: 'سوپر ادمین',
      badge: 'مدیر کل و تعریف دسترسی‌ها'
    },
    ceo: {
      icon: <Briefcase className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/60',
      label: 'مدیرعامل',
      badge: 'صدور سفارش و تصمیم پیش‌فاکتور'
    },
    planning: {
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-950/60',
      label: 'مدیر برنامه‌ریزی',
      badge: 'استعلام ریخته‌گری و صدور PO'
    },
    engineering: {
      icon: <Compass className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/40 bg-purple-950/30 hover:bg-purple-950/60',
      label: 'واحد مهندسی',
      badge: 'نقشه‌های ساخت و فایل‌های STEP'
    },
    production: {
      icon: <Wrench className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-950/60',
      label: 'مدیر سالن تولید',
      badge: 'تخصیص ماشین‌ها و تایید QC'
    },
    operator: {
      icon: <HardHat className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/40 bg-orange-950/30 hover:bg-orange-950/60',
      label: 'اپراتور ماشین‌آلات',
      badge: 'شمارنده قطعات و اعلام توقف'
    },
    warehouse: {
      icon: <Boxes className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/40 bg-teal-950/30 hover:bg-teal-950/60',
      label: 'انبارداری و کاردکس',
      badge: 'رسید قطعه کامل و نیمه‌ساخته'
    },
    qc: {
      icon: <ClipboardCheck className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 bg-blue-950/30 hover:bg-blue-950/60',
      label: 'واحد کنترل کیفیت (QC)',
      badge: 'بازرسی ابعادی، فرم QC و ترخیص'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Decorative background grid elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Branding */}
      <header className="relative z-10 w-full px-6 py-4 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-black">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-wide">
                سامانه یکپارچه MES کارخانه ساخت کمپرسور و بلوئر
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                تولید کمپرسورهای اسکرو، بلوئرهای روتس لوپ‌تایپ و ماشین‌کاری دقیق
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>شبکه داخلی کارخانه (LAN / Offline Mode)</span>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Login Form Box (Left/Right) */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>درگاه ورود امن کاربران</span>
              </div>
              <h1 className="text-2xl font-black text-white pt-2">
                ورود به سامانه تولید
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                لطفاً نام کاربری و کلمه عبور تعریف‌شده توسط سوپر ادمین کارخانه را وارد نمایید.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  نام کاربری (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: admin یا engineering"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    کلمه عبور (Password)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    رمز پیش‌فرض حساب‌ها: <code className="text-cyan-400 font-mono">123</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pr-10 pl-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-cyan-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>در حال اعتبارسنجی...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به سامانه کارخانه</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>مدیریت کاربران:</span>
              <span className="text-cyan-400 font-bold">پنل سوپر ادمین</span>
            </div>
          </div>

          {/* Quick Login Roster for Easy Access & Demonstration */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  ورود سریع بر اساس نقش‌های سازمانی کارخانه:
                </h2>
                <span className="text-[10px] text-slate-400">یک کلیک برای ورود آزمایشی</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                برای سهولت دسترسی، روی هر یک از کاربران زیر کلیک کنید تا با اطلاعات احراز هویت آن واحد وارد سامانه شوید:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {users.map((u) => {
                  const roleCfg = roleIcons[u.role] || roleIcons.operator;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickLogin(u.username, u.password)}
                      className={`text-right p-3 rounded-2xl border transition flex items-start gap-2.5 group ${roleCfg.color}`}
                    >
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {roleCfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                            {roleCfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {u.username}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {roleCfg.badge}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hardware & Process Overview Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>پشتیبانی از ماشین‌آلات داخلی کارخانه (سنگ مغناطیس، تراش CNC، فرز دروازه‌ای، بورینگ و کاروسل)</span>
              </div>
              <span className="font-mono text-cyan-400 font-bold shrink-0">BOM 80/20</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-3 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <div>سامانه برنامه‌ریزی منابع سازمانی و مانیتورینگ خطوط ساخت (MES)</div>
        <div className="font-mono text-[11px] text-slate-400">نسخه کارخانه‌ای ۲.۵.۰ - شبکه داخلی کارخانه</div>
      </footer>

    </div>
  );
};
