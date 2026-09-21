import React, { useState } from 'react';
import {
  CompressorModel,
  MachineTool,
  PartDefinition,
  FoundryPartner,
  OperatorProfile,
  SystemUser
} from '../../types';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Building2,
  Users,
  Boxes,
  Database,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { ModelsManager } from './superAdmin/ModelsManager';
import { MachinesManager } from './superAdmin/MachinesManager';
import { PartsManager } from './superAdmin/PartsManager';
import { FoundriesManager } from './superAdmin/FoundriesManager';
import { OperatorsManager } from './superAdmin/OperatorsManager';
import { UsersManager } from './superAdmin/UsersManager';
import { DatabaseBackupManager } from './superAdmin/DatabaseBackupManager';
import { AuditLogView } from '../AuditLogView';

interface SuperAdminViewProps {
  models: CompressorModel[];
  machines: MachineTool[];
  parts: PartDefinition[];
  foundries: FoundryPartner[];
  operators: OperatorProfile[];
  users?: SystemUser[];
  onAddModel: (model: CompressorModel) => void;
  onUpdateModel?: (model: CompressorModel) => void;
  onDeleteModel?: (modelId: string) => void;
  onAddMachine: (machine: MachineTool) => void;
  onUpdateMachine?: (machine: MachineTool) => void;
  onDeleteMachine?: (machineId: string) => void;
  onAddPart: (part: PartDefinition) => void;
  onUpdatePart?: (part: PartDefinition) => void;
  onDeletePart?: (partId: string) => void;
  onAddFoundry: (foundry: FoundryPartner) => void;
  onUpdateFoundry?: (foundry: FoundryPartner) => void;
  onDeleteFoundry?: (foundryId: string) => void;
  onAddOperator: (operator: OperatorProfile) => void;
  onUpdateOperator?: (operator: OperatorProfile) => void;
  onDeleteOperator?: (operatorId: string) => void;
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
  onUpdateModel,
  onDeleteModel,
  onAddMachine,
  onUpdateMachine,
  onDeleteMachine,
  onAddPart,
  onUpdatePart,
  onDeletePart,
  onAddFoundry,
  onUpdateFoundry,
  onDeleteFoundry,
  onAddOperator,
  onUpdateOperator,
  onDeleteOperator,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onExportDatabase,
  onImportDatabase,
  onResetFactoryData
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'models' | 'machines' | 'parts' | 'foundries' | 'operators' | 'backup' | 'audit'>('users');

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-l from-indigo-900/50 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              پنل مدیریت ارشد زیرساخت کارخانه (Super Admin Console)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              پیکربندی جامع دارایی‌ها، کاتالوگ قطعات و دسترسی‌های سیستم
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              مدیریت کامل (افزودن، ویرایش، حذف و تخصیص تصویر) برای مدل‌های دستگاه، تجهیزات سالن، قطعات BOM، ریخته‌گری‌ها و اپراتورها
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <div className="text-center px-2.5 py-1">
              <span className="text-[10px] text-slate-400 block">مدل‌ها</span>
              <span className="text-xs font-bold text-indigo-300">{models.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center px-2.5 py-1">
              <span className="text-[10px] text-slate-400 block">دستگاه‌ها</span>
              <span className="text-xs font-bold text-cyan-300">{machines.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center px-2.5 py-1">
              <span className="text-[10px] text-slate-400 block">قطعات BOM</span>
              <span className="text-xs font-bold text-emerald-300">{parts.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center px-2.5 py-1">
              <span className="text-[10px] text-slate-400 block">کاربران</span>
              <span className="text-xs font-bold text-amber-300">{users.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Right Sidebar Navigation + Left Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Navigation Sidebar (in RTL this naturally renders on the right side) */}
        <aside className="lg:col-span-3 space-y-3 lg:sticky lg:top-24">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 shadow-xl space-y-1.5 backdrop-blur-sm">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-800/80 mb-2 flex items-center justify-between">
              <span>منوی تنظیمات زیرساخت</span>
              <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-mono">۷ بخش</span>
            </div>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>کاربران و سطوح دسترسی</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'users' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'models'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>مدل‌های دستگاه‌های اصلی</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'models' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {models.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('machines')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'machines'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 shrink-0" />
                <span>ماشین‌آلات و تجهیزات سالن</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'machines' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {machines.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('parts')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'parts'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>کاتالوگ قطعات و BOM</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'parts' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {parts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('foundries')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'foundries'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>ریخته‌گری‌های همکار</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'foundries' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {foundries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('operators')}
              className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                activeTab === 'operators'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>اپراتورها و پرسنل</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'operators' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {operators.length}
              </span>
            </button>

            <div className="pt-2 border-t border-slate-800/80 mt-2 space-y-1.5">
              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                  activeTab === 'audit'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span>گزارش ممیزی (Audit Log)</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">امنیت</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                  activeTab === 'backup'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>پشتیبان‌گیری و دیتابیس</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">JSON</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Left Content Area (fills remaining space) */}
        <main className="lg:col-span-9 min-w-0">
          {activeTab === 'users' && (
            <UsersManager
              users={users}
              onAddUser={onAddUser}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
            />
          )}

          {activeTab === 'models' && (
            <ModelsManager
              models={models}
              onAddModel={onAddModel}
              onUpdateModel={onUpdateModel}
              onDeleteModel={onDeleteModel}
            />
          )}

          {activeTab === 'machines' && (
            <MachinesManager
              machines={machines}
              onAddMachine={onAddMachine}
              onUpdateMachine={onUpdateMachine}
              onDeleteMachine={onDeleteMachine}
            />
          )}

          {activeTab === 'parts' && (
            <PartsManager
              parts={parts}
              models={models}
              onAddPart={onAddPart}
              onUpdatePart={onUpdatePart}
              onDeletePart={onDeletePart}
            />
          )}

          {activeTab === 'foundries' && (
            <FoundriesManager
              foundries={foundries}
              onAddFoundry={onAddFoundry}
              onUpdateFoundry={onUpdateFoundry}
              onDeleteFoundry={onDeleteFoundry}
            />
          )}

          {activeTab === 'operators' && (
            <OperatorsManager
              operators={operators}
              machines={machines}
              onAddOperator={onAddOperator}
              onUpdateOperator={onUpdateOperator}
              onDeleteOperator={onDeleteOperator}
            />
          )}

          {activeTab === 'backup' && <DatabaseBackupManager />}

          {activeTab === 'audit' && <AuditLogView />}
        </main>
      </div>
    </div>
  );
};
