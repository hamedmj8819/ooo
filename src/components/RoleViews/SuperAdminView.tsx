import React, { useState } from 'react';
import {
  CompressorModel,
  MachineTool,
  PartDefinition,
  FoundryPartner,
  OperatorProfile,
  SystemUser,
  UserRole
} from '../../types';
import {
  ShieldCheck,
  PlusCircle,
  Cpu,
  Layers,
  Building2,
  Users,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Edit3,
  Boxes,
  Database,
  Lock,
  Key,
  UserCheck,
  UserPlus,
  Eye,
  EyeOff,
  ShieldAlert,
  Search
} from 'lucide-react';

interface SuperAdminViewProps {
  models: CompressorModel[];
  machines: MachineTool[];
  parts: PartDefinition[];
  foundries: FoundryPartner[];
  operators: OperatorProfile[];
  users?: SystemUser[];
  onAddModel: (model: any) => void;
  onAddMachine: (machine: any) => void;
  onAddFoundry: (foundry: any) => void;
  onAddPart: (part: any) => void;
  onAddOperator: (operator: any) => void;
  onAddUser?: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onUpdateUser?: (user: SystemUser) => void;
  onDeleteUser?: (userId: string) => void;
  onExportDatabase: () => void;
  onImportDatabase: (jsonContent: string) => void;
  onResetFactoryData: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  models,
  machines,
  parts,
  foundries,
  operators,
  users = [],
  onAddModel,
  onAddMachine,
  onAddFoundry,
  onAddPart,
  onAddOperator,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onExportDatabase,
  onImportDatabase,
  onResetFactoryData
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'machines' | 'parts' | 'foundries' | 'operators' | 'users' | 'backup'>('users');

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('operator');
  const [userDepartment, setUserDepartment] = useState('ایستگاه ماشین‌ابزار و اپراتوری سالن');
  const [userPersonnelCode, setUserPersonnelCode] = useState('EMP-');
  const [userPhone, setUserPhone] = useState('');
  const [userIsActive, setUserIsActive] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const handleRoleSelectionChange = (newRole: UserRole) => {
    setUserRole(newRole);
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
    setUserDepartment(deptMap[newRole] || 'واحد فنی و تولید');
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddUser) return;
    onAddUser({
      fullName: userFullName,
      username: userUsername.trim().toLowerCase(),
      password: userPassword,
      role: userRole,
      department: userDepartment,
      personnelCode: userPersonnelCode || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      phone: userPhone,
      isActive: userIsActive
    });
    setShowUserModal(false);
    // Reset
    setUserFullName('');
    setUserUsername('');
    setUserPassword('');
    setUserPersonnelCode('EMP-');
    setUserPhone('');
  };

  // New Model Modal
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelCode, setModelCode] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelType, setModelType] = useState<'screw' | 'lobe_blower'>('screw');
  const [motorPower, setMotorPower] = useState(55);
  const [flowRate, setFlowRate] = useState(8.5);
  const [workingPressure, setWorkingPressure] = useState(8.0);
  const [modelDesc, setModelDesc] = useState('');

  // New Machine Modal
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machCode, setMachCode] = useState('');
  const [machName, setMachName] = useState('');
  const [machType, setMachType] = useState<'internal' | 'outsourced'>('internal');
  const [machCategory, setMachCategory] = useState<any>('cnc_lathe');
  const [machLocation, setMachLocation] = useState('سالن شماره ۲ - خط ماشین‌کاری سنگین');
  const [machSpecs, setMachSpecs] = useState('');

  // New Foundry Modal
  const [showFoundryModal, setShowFoundryModal] = useState(false);
  const [fndName, setFndName] = useState('');
  const [fndManager, setFndManager] = useState('');
  const [fndPhone, setFndPhone] = useState('');
  const [fndCity, setFndCity] = useState('');
  const [fndCaps, setFndCaps] = useState('ریخته‌گری دقیق داکتیل GGG40، چدن خاکستری GG25');

  const handleModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddModel({
      id: 'MODEL-' + Date.now().toString().slice(-4),
      code: modelCode,
      name: modelName,
      nameEn: modelCode,
      type: modelType === 'screw' ? 'screw' : 'lobe',
      motorPowerKw: motorPower,
      workingPressureBar: workingPressure,
      capacityM3Min: flowRate,
      coolingType: 'هوا / روغن خنک',
      description: modelDesc,
      partsCount: 8,
      inHouseRatio: 80
    });
    setShowModelModal(false);
  };

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMachine({
      code: machCode,
      name: machName,
      type: machType,
      category: machCategory,
      location: machLocation,
      specifications: machSpecs,
      status: 'idle',
      healthPercent: 100
    });
    setShowMachineModal(false);
  };

  const handleFoundrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFoundry({
      name: fndName,
      manager: fndManager,
      phone: fndPhone,
      city: fndCity,
      capabilities: fndCaps.split('،').map(s => s.trim())
    });
    setShowFoundryModal(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onImportDatabase(text);
          alert('پایگاه داده کارخانه با موفقیت بازیابی شد!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Super Admin Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              پنل مدیریت ارشد سیستم (Super Admin)
            </span>
            <span className="text-xs text-slate-400">پیکربندی کارخانه، ماشین‌آلات، BOM و دسترسی‌ها</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            تنظیمات مرکزی خطوط تولید کمپرسور و بلوئر
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            مدیریت ۵ مدل دستگاه اصلی، تعریف مراحل ساخت قطعات داخلی و وارداتی، افزودن ماشین‌آلات سالن و شرکای ریخته‌گری، و پشتیبان‌گیری آفلاین.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportDatabase}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/40 text-xs font-bold transition shadow"
          >
            <Download className="w-4 h-4" />
            پشتیبان‌گیری از دیتابیس (JSON)
          </button>
        </div>
      </div>

      {/* Main Layout: Right-hand Tabs Navigation + Left-hand Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Right Sidebar: Super Admin Tabs */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-1.5">
            <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
              <span className="text-xs font-bold text-white block">سربرگ‌های تنظیمات و تعاریف</span>
              <span className="text-[10px] text-slate-400">پنل راهبری سامانه (سوپر ادمین)</span>
            </div>

            <button
              onClick={() => setActiveTab('models')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'models'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>مدل‌های دستگاه‌های اصلی</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {models.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('machines')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'machines'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>ماشین‌آلات و تجهیزات سالن</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {machines.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('parts')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'parts'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>کاتالوگ قطعات و BOM</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {parts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('foundries')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'foundries'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>ریخته‌گری‌ها و تامین‌کنندگان</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {foundries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('operators')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'operators'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>پرسنل و اپراتورها</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {operators.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>کاربران و سطوح دسترسی</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-300 border border-indigo-500/30">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('backup')}
              className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 ${
                activeTab === 'backup'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 ring-2 ring-indigo-400/40 font-black'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>پایگاه داده و شبکه آفلاین</span>
              </div>
            </button>
          </div>
        </aside>

        {/* Left Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* Tab 1: Compressor Models */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              ۵ مدل دستگاه اصلی کارخانه (شامل کمپرسورهای اسکرو اویل‌اینجکت و خشک، و بلوئرهای لوپ تایپ):
            </p>
            <button
              onClick={() => setShowModelModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              افزودن مدل دستگاه جدید
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => (
              <div
                key={m.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 hover:border-indigo-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    {m.code}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {m.type === 'screw' ? 'کمپرسور اسکرو' : 'بلوئر لوپ‌تایپ'}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{m.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">توان موتور:</span>
                    <span className="font-bold text-white">{m.motorPowerKw} kW</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">فشار کاری:</span>
                    <span className="font-bold text-cyan-300">{m.workingPressureBar} bar</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">دبی هوا:</span>
                    <span className="font-bold text-emerald-400">{m.capacityM3Min} m³/min</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    ساخت داخل: <strong className="text-emerald-400">{m.inHouseRatio}%</strong>
                  </span>
                  <span className="text-slate-400">
                    وارداتی: <strong className="text-amber-400">{100 - m.inHouseRatio}%</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Machines */}
      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              لیست کامل ماشین‌آلات مستقر در کارخانه و ایستگاه‌های مجاز برون‌سپاری:
            </p>
            <button
              onClick={() => setShowMachineModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              افزودن دستگاه جدید به سالن
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((mach) => (
              <div
                key={mach.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {mach.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mach.type === 'internal'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {mach.type === 'internal' ? 'داخل شرکت' : 'برون‌سپاری'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{mach.name}</h4>
                <p className="text-xs text-slate-400">{mach.specifications}</p>
                <div className="text-[11px] text-slate-500">موقعیت: {mach.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Parts BOM */}
      {activeTab === 'parts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              کاتالوگ قطعات تعریف‌شده (شامل قطعات ریخته‌گری، وارداتی، و مراحل ماشین‌کاری داخلی):
            </p>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">شماره فنی (Part No)</th>
                  <th className="p-3">نام قطعه</th>
                  <th className="p-3">دستگاه مربوطه</th>
                  <th className="p-3">متریال / جنس</th>
                  <th className="p-3">دسته‌بندی تامین</th>
                  <th className="p-3">مراحل ماشین‌کاری تعریف‌شده</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {parts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-cyan-300">{p.partNumber}</td>
                    <td className="p-3 font-bold text-white">{p.name}</td>
                    <td className="p-3 text-slate-300">{models.find(m => m.id === p.machineModelId)?.name || p.machineModelId}</td>
                    <td className="p-3 text-slate-300 font-mono">{p.material}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.category === 'manufactured'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.category === 'casting'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {p.category === 'manufactured'
                          ? 'تولید داخل (۸۰٪)'
                          : p.category === 'casting'
                          ? 'ریخته‌گری همکار'
                          : 'وارداتی (۲۰٪)'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {p.defaultStages?.length || 0} مرحله ({p.defaultStages?.map((s: any) => s.name).join(' -> ')})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Foundries */}
      {activeTab === 'foundries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              لیست ریخته‌گری‌های معتبر و همکار در تامین قطعات چدن داکتیل و فولادی:
            </p>
            <button
              onClick={() => setShowFoundryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              افزودن شرکت ریخته‌گری همکار
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {foundries.map((fnd) => (
              <div
                key={fnd.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{fnd.name}</h4>
                  <span className="text-xs text-amber-400 font-bold">★ {fnd.qualityRating}</span>
                </div>
                <div className="text-xs text-slate-400">مدیریت: {fnd.manager} | {fnd.phone}</div>
                <div className="text-xs text-slate-400">شهر: {fnd.city}</div>
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <div className="text-slate-500 mb-1">قابلیت‌ها:</div>
                  <div className="flex flex-wrap gap-1">
                    {fnd.capabilities.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Operators */}
      {activeTab === 'operators' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">پرسنل تولید و اپراتورهای ماشین‌ابزار:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {operators.map((op) => (
              <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
                <div className="font-bold text-white text-sm">{op.name}</div>
                <div className="text-xs text-cyan-400 font-mono">کد: {op.personnelCode}</div>
                <div className="text-xs text-slate-400">{op.specialty}</div>
                <div className="text-xs text-slate-500">شیفت: {op.shift}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Backup & Offline LAN Info */}
      {activeTab === 'backup' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              پشتیبان‌گیری، بازیابی و معماری شبکه آفلاین (LAN)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              این نرم‌افزار به صورت کاملاً مستقل و آفلاین درون شبکه محلی کارخانه (LAN) اجرا می‌شود و هیچ نیازی به اتصال به اینترنت ندارد. برای انتقال داده‌ها یا نگهداری نسخه‌های پشتیبان هفتگی، می‌توانید از دکمه‌های زیر استفاده کنید:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  دریافت فایل پشتیبان کامل (JSON)
                </h4>
                <p className="text-[11px] text-slate-400">
                  شامل کلیه سفارشات، نقشه‌های مهندسی، پیش‌فاکتورها و وضعیت دستگاه‌ها
                </p>
                <button
                  onClick={onExportDatabase}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
                >
                  دانلود فایل بکاپ JSON
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  بازیابی از فایل پشتیبان
                </h4>
                <p className="text-[11px] text-slate-400">
                  جایگزینی پایگاه داده فعلی با فایل پشتیبان ذخیره‌شده
                </p>
                <label className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition block text-center cursor-pointer">
                  انتخاب فایل پشتیبان
                  <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-4 bg-rose-950/30 rounded-2xl border border-rose-900/50 mt-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-300">بازنشانی به تنظیمات اولیه کارخانه (Reset Data)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  تمام تغییرات پاک شده و داده‌های پیش‌فرض ۵ مدل کمپرسور و ماشین‌آلات جایگزین می‌شود.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('آیا از بازنشانی داده‌های کارخانه مطمئن هستید؟')) {
                    onResetFactoryData();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                بازنشانی پیش‌فرض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users & Access Roles (Super Admin requested feature) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                مدیریت کاربران، حساب‌ها و سطوح دسترسی واحدهای کارخانه
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تعریف حساب‌های کاربری با نام کاربری، کلمه عبور و انتساب به واحدهای سازمانی (اپراتور، برنامه‌ریزی، مهندسی و...)
              </p>
            </div>

            <button
              onClick={() => setShowUserModal(true)}
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
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
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
                  {users
                    .filter(u => 
                      u.fullName.includes(userSearchTerm) ||
                      u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      u.department.includes(userSearchTerm) ||
                      (u.personnelCode && u.personnelCode.includes(userSearchTerm))
                    )
                    .map((user) => {
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
                            {user.role !== 'super_admin' && onDeleteUser && (
                              <button
                                onClick={() => {
                                  if (confirm(`آیا از حذف حساب کاربری "${user.fullName}" مطمئن هستید؟`)) {
                                    onDeleteUser(user.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                                title="حذف کاربر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      {showModelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2 text-indigo-400">
              <PlusCircle className="w-5 h-5" />
              تعریف مدل جدید کمپرسور / بلوئر
            </h3>

            <form onSubmit={handleModelSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">کد فنی مدل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: SC-800"
                  value={modelCode}
                  onChange={(e) => setModelCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام کامل دستگاه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: کمپرسور اسکرو صنعتی مدل SC-800 دبل استیج"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">نوع تجهیز:</label>
                  <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="screw">کمپرسور اسکرو</option>
                    <option value="lobe_blower">بلوئر روتس (لوپ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">توان موتور (kW):</label>
                  <input
                    type="number"
                    value={motorPower}
                    onChange={(e) => setMotorPower(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">فشار کاری (bar):</label>
                  <input
                    type="number"
                    step={0.1}
                    value={workingPressure}
                    onChange={(e) => setWorkingPressure(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">دبی هوا (m³/min):</label>
                  <input
                    type="number"
                    step={0.1}
                    value={flowRate}
                    onChange={(e) => setFlowRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModelModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  ثبت مدل دستگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Machine */}
      {showMachineModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2 text-indigo-400">
              <PlusCircle className="w-5 h-5" />
              افزودن دستگاه یا ایستگاه ماشین‌کاری
            </h3>

            <form onSubmit={handleMachineSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">کد دستگاه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: CNC-04"
                  value={machCode}
                  onChange={(e) => setMachCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام دستگاه:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تراش سنگین CNC ۴ متری"
                  value={machName}
                  onChange={(e) => setMachName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">نوع استقرار:</label>
                  <select
                    value={machType}
                    onChange={(e) => setMachType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="internal">داخل کارخانه</option>
                    <option value="outsourced">برون‌سپاری</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">دسته‌بندی:</label>
                  <select
                    value={machCategory}
                    onChange={(e) => setMachCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="magnetic_grinder">سنگ مغناطیس</option>
                    <option value="manual_lathe">تراش منوال</option>
                    <option value="cnc_lathe">تراش CNC</option>
                    <option value="gantry_milling">فرز دروازه‌ای</option>
                    <option value="boring">بورینگ</option>
                    <option value="carousel">کاروسل</option>
                    <option value="cylindrical_grinder">سنگ محور</option>
                    <option value="lapping">لپینگ</option>
                    <option value="wirecut">وایرکات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">مشخصات و ابعاد کارگیر:</label>
                <textarea
                  rows={2}
                  value={machSpecs}
                  onChange={(e) => setMachSpecs(e.target.value)}
                  placeholder="قطر کارگیر، طول، کنترلر زیمنس/فانوک..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMachineModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  ثبت دستگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Foundry */}
      {showFoundryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2 text-indigo-400">
              <PlusCircle className="w-5 h-5" />
              افزودن شرکت ریخته‌گری همکار
            </h3>

            <form onSubmit={handleFoundrySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نام شرکت ریخته‌گری:</label>
                <input
                  type="text"
                  required
                  value={fndName}
                  onChange={(e) => setFndName(e.target.value)}
                  placeholder="مثال: صنایع ریخته‌گری چدن مشهد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">مدیر فروش / فنی:</label>
                  <input
                    type="text"
                    value={fndManager}
                    onChange={(e) => setFndManager(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">شهر:</label>
                  <input
                    type="text"
                    value={fndCity}
                    onChange={(e) => setFndCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">تلفن تماس:</label>
                <input
                  type="text"
                  value={fndPhone}
                  onChange={(e) => setFndPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">قابلیت‌ها و آلیاژها:</label>
                <textarea
                  rows={2}
                  value={fndCaps}
                  onChange={(e) => setFndCaps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFoundryModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  ثبت ریخته‌گری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New User (Super Admin requested feature) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="font-bold text-white text-base flex items-center gap-2 text-indigo-400">
              <UserPlus className="w-5 h-5" />
              تعریف کاربر جدید و تعیین سطح دسترسی سازمانی
            </h3>
            <p className="text-xs text-slate-400">
              مشخصات کاربر و واحد مربوطه (اپراتور، برنامه‌ریزی، مهندسی و...) را وارد نمایید.
            </p>

            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={userFullName}
                    onChange={(e) => setUserFullName(e.target.value)}
                    placeholder="مثال: مهندس رضوانی"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">کد پرسنلی:</label>
                  <input
                    type="text"
                    value={userPersonnelCode}
                    onChange={(e) => setUserPersonnelCode(e.target.value)}
                    placeholder="EMP-804"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">نام کاربری (Username):</label>
                  <input
                    type="text"
                    required
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    placeholder="planning_user"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">کلمه عبور (Password):</label>
                  <input
                    type="text"
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">واحد سازمانی و نقش دسترسی:</label>
                <select
                  value={userRole}
                  onChange={(e) => handleRoleSelectionChange(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                >
                  <option value="operator">اپراتور ایستگاه و ماشین‌آلات (Operator)</option>
                  <option value="planning">مدیر برنامه‌ریزی تولید و سفارشات (Planning Manager)</option>
                  <option value="engineering">واحد مهندسی مکانیک، CAD و نقشه‌کشی (Engineering)</option>
                  <option value="qc">واحد کنترل کیفی و بازرسی ابعادی (QC - Quality Control)</option>
                  <option value="production">مدیر سالن ماشین‌کاری و خطوط ساخت (Production Manager)</option>
                  <option value="warehouse">انبارداری مرکزی و قطعات (Warehouse)</option>
                  <option value="ceo">مدیرعامل و مدیریت ارشد (CEO)</option>
                  <option value="super_admin">سوپر ادمین و فناوری اطلاعات (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان تفصیلی واحد:</label>
                <input
                  type="text"
                  required
                  value={userDepartment}
                  onChange={(e) => setUserDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">شماره تماس داخلی/موبایل:</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="۰۹۱۲..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userIsActive}
                      onChange={(e) => setUserIsActive(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                    />
                    <span>حساب کاربری از بدو تعریف فعال باشد</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  ایجاد کاربر جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};
