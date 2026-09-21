import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Factory,
  LogIn,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<{
    success: boolean;
    message?: string;
    mustChangePassword?: boolean;
  }>;
  onChangePassword?: (oldPassword: string, newPassword: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onChangePassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forced password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMessage('لطفاً نام کاربری و کلمه عبور را وارد نمایید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onLogin(trimmedUser, password);
      if (!res.success) {
        setErrorMessage(res.message || 'نام کاربری یا کلمه عبور نادرست است.');
      } else if (res.mustChangePassword) {
        setIsChangingPassword(true);
        setCurrentPasswordInput(password);
      }
    } catch {
      setErrorMessage('خطای شبکه یا عدم برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('کلمه عبور جدید باید حداقل ۸ نویسه باشد.');
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMessage('کلمه عبور جدید باید ترکیبی از حروف و اعداد انگلیسی باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('تکرار کلمه عبور جدید با کلمه عبور همخوانی ندارد.');
      return;
    }
    if (newPassword === currentPasswordInput) {
      setErrorMessage('کلمه عبور جدید نباید مشابه کلمه عبور فعلی باشد.');
      return;
    }

    if (!onChangePassword) {
      setErrorMessage('سرویس تغییر کلمه عبور در دسترس نیست.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await onChangePassword(currentPasswordInput, newPassword);
      if (res.success) {
        setPasswordChangeSuccess(true);
      } else {
        setErrorMessage(res.message || 'خطا در تغییر کلمه عبور.');
      }
    } catch {
      setErrorMessage('خطا در برقراری ارتباط با سرور هنگام تغییر رمز.');
    } finally {
      setIsLoading(false);
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
                سامانه یکپارچه مدیریت عملیات تولید (MES)
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                کارخانه ساخت کمپرسورهای اسکرو، بلوئرهای روتس لوپ‌تایپ و ماشین‌کاری دقیق سنگین
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>شبکه کارگاهی امن (LAN / Offline Mode)</span>
          </div>
        </div>
      </header>

      {/* Main Login / Password Change Box */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Mode A: Mandatory Password Change Modal */}
            {isChangingPassword ? (
              <div className="space-y-5">
                <div className="space-y-1 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>تغییر اجباری کلمه عبور در اولین ورود</span>
                  </div>
                  <h1 className="text-xl font-black text-white pt-2">تعریف رمز عبور اختصاصی</h1>
                  <p className="text-xs text-slate-400 leading-relaxed text-right">
                    به دلایل امنیتی و بر اساس خط‌مشی محرمانگی کارخانه، استفاده از رمز پیش‌فرض مجاز نیست. لطفاً یک کلمه عبور امن و جدید برای حساب کاربری خود تعیین کنید.
                  </p>
                </div>

                {passwordChangeSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex flex-col items-center text-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <span className="font-bold">رمز عبور با موفقیت به‌روزرسانی شد.</span>
                    <span className="text-[11px] text-emerald-200">
                      در حال هدایت به محیط کاربری سامانه...
                    </span>
                  </div>
                ) : (
                  <>
                    {errorMessage && (
                      <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          کلمه عبور فعلی (موقت)
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          کلمه عبور جدید (حداقل ۸ نویسه، ترکیب حرف و عدد)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                            dir="ltr"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          تکرار کلمه عبور جدید
                        </label>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            <span>در حال ثبت رمز جدید...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>تأیید و ذخیره رمز جدید</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setErrorMessage(null);
                        }}
                        className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition text-center"
                      >
                        بازگشت به صفحه ورود
                      </button>
                    </form>
                  </>
                )}
              </div>
            ) : (
              /* Mode B: Standard Secure Login Form */
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>درگاه احراز هویت امن کاربران</span>
                  </div>
                  <h1 className="text-2xl font-black text-white pt-2">ورود به سامانه کارخانه</h1>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    لطفاً نام کاربری و کلمه عبور اختصاصی خود را وارد نمایید.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
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
                        placeholder="نام کاربری سیستم"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      کلمه عبور (Password)
                    </label>
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
                        <span>در حال اعتبارسنجی نشست...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>ورود به سامانه کارخانه</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>نشست امن با کوکی رمزنگاری‌شده HttpOnly</span>
                  </div>
                </div>
              </div>
            )}

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
