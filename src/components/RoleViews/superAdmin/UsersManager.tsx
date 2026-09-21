import React, { useState } from 'react';
import { SystemUser, UserRole } from '../../../types';
import { UserCheck, UserPlus, Search, Eye, EyeOff, Trash2, Edit3, Lock, ShieldAlert } from 'lucide-react';

interface UsersManagerProps {
  users: SystemUser[];
  onAddUser?: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (user: SystemUser) => void;
  onDeleteUser?: (userId: string) => void;
}

export const UsersManager: React.FC<UsersManagerProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [department, setDepartment] = useState('ایستگاه ماشین‌ابزار و اپراتوری سالن');
  const [personnelCode, setPersonnelCode] = useState('EMP-');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const handleRoleSelectionChange = (newRole: UserRole) => {
    setRole(newRole);
    const deptMap: Record<UserRole, string> = {
      super_admin: 'فناوری اطلاعات و مدیریت زیرساخت کارخانه',
      ceo: 'مدیریت عامل و هیئت مدیره',
      planning: 'واحد برنامه‌ریزی تولید و تدارکات خرید',
      engineering: 'تحقیق و توسعه، نقشه‌کشی و CAD/CAM',
      production: 'سالن ماشین‌کاری سنگین و خطوط ساخت',
      qc: 'واحد کنترل کیفیت (QC) و آزمایشگاه متالورژی',
      operator: 'ایستگاه ماشین‌ابزار و اپراتوری سالن',
      warehouse: 'انبار قطعات یدکی، نیمه‌ساخته و ریخته‌گری'
    };
    setDepartment(deptMap[newRole] || 'واحد فنی و تولید');
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('operator');
    setDepartment('ایستگاه ماشین‌ابزار و اپراتوری سالن');
    setPersonnelCode('EMP-' + Math.floor(1000 + Math.random() * 9000));
    setPhone('');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setUsername(u.username);
    setPassword(u.password || '');
    setRole(u.role);
    setDepartment(u.department);
    setPersonnelCode(u.personnelCode || '');
    setPhone(u.phone || '');
    setIsActive(u.isActive);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && onUpdateUser) {
      onUpdateUser({
        ...editingUser,
        fullName,
        username: username.trim().toLowerCase(),
        password,
        role,
        department,
        personnelCode,
        phone,
        isActive
      });
    } else if (onAddUser) {
      onAddUser({
        fullName,
        username: username.trim().toLowerCase(),
        password,
        role,
        department,
        personnelCode: personnelCode || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
        phone,
        isActive
      });
    }
    setShowModal(false);
  };

  const handleDelete = (u: SystemUser) => {
    if (confirm(`آیا از حذف حساب کاربری "${u.fullName}" (${u.username}) مطمئن هستید؟`)) {
      if (onDeleteUser) {
        onDeleteUser(u.id);
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.includes(searchTerm) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.includes(searchTerm) ||
    (u.personnelCode && u.personnelCode.includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            مدیریت کاربران، حساب‌ها و سطوح دسترسی واحدهای کارخانه
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تعریف حساب‌های کاربری با نام کاربری، کلمه عبور و انتساب به واحدهای سازمانی
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>تعریف کاربر جدید کارخانه</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="جستجو در نام کاربر، نام کاربری، کد پرسنلی یا واحد..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3.5">نام و پرسنلی</th>
                <th className="p-3.5">نام کاربری</th>
                <th className="p-3.5">کلمه عبور</th>
                <th className="p-3.5">واحد و سطح دسترسی</th>
                <th className="p-3.5">وضعیت حساب</th>
                <th className="p-3.5">آخرین ورود</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => {
                const isPasswordVisible = !!showPasswordMap[user.id];
                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{user.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        کد: {user.personnelCode || '---'} {user.phone ? `| ${user.phone}` : ''}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-cyan-300 font-bold">
                      {user.username}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-slate-300">
                        <span>{isPasswordVisible ? user.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 mb-0.5">
                        {user.department}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">نقش: {user.role}</div>
                    </td>

                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateUser) {
                            onUpdateUser({ ...user, isActive: !user.isActive });
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          user.isActive
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                            : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                        }`}
                      >
                        {user.isActive ? 'فعال ✓' : 'غیرفعال ✕'}
                      </button>
                    </td>

                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {user.lastLogin || 'ثبت نشده'}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition"
                          title="ویرایش کاربر"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {user.role !== 'super_admin' && onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
                            title="حذف کاربر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                {editingUser ? `ویرایش حساب کاربری ${editingUser.fullName}` : 'تعریف کاربر جدید در سامانه'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس رضوانی"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">کد پرسنلی:</label>
                  <input
                    type="text"
                    placeholder="EMP-1001"
                    value={personnelCode}
                    onChange={(e) => setPersonnelCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">نام کاربری (جهت لاگین):</label>
                  <input
                    type="text"
                    required
                    placeholder="rezvani"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">کلمه عبور (Password):</label>
                  <input
                    type="text"
                    required
                    placeholder="حداقل ۴ کاراکتر"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">واحد سازمانی / سطح دسترسی:</label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleSelectionChange(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="super_admin">سوپر ادمین (مدیر ارشد زیرساخت)</option>
                    <option value="ceo">مدیرعامل / هیئت مدیره</option>
                    <option value="planning">برنامه‌ریزی تولید و سفارشات</option>
                    <option value="engineering">مهندسی، نقشه‌کشی و R&D</option>
                    <option value="production">سرپرست سالن ماشین‌کاری</option>
                    <option value="qc">کنترل کیفیت (QC)</option>
                    <option value="operator">اپراتور ایستگاه ماشین‌ابزار</option>
                    <option value="warehouse">انبارداری و لجستیک قطعات</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">عنوان واحد سازمانی:</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">شماره تماس همراه:</label>
                  <input
                    type="text"
                    placeholder="0912..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-bold">وضعیت فعال بودن:</label>
                  <select
                    value={isActive ? 'true' : 'false'}
                    onChange={(e) => setIsActive(e.target.value === 'true')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="true">حساب کاربری فعال</option>
                    <option value="false">حساب کاربری غیرفعال (مسدود)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
                >
                  {editingUser ? 'ذخیره تغییرات کاربر' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
