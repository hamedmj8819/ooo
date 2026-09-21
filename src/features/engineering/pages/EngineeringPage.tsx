import React, { useState } from 'react';
import { Layers, FileCode2, ClipboardCheck } from 'lucide-react';
import { MasterCatalogTab } from '../components/MasterCatalogTab';
import { OrdersReleaseTab } from '../components/OrdersReleaseTab';
import { QCApprovalsTab } from '../components/QCApprovalsTab';
import type { StageEngineeringDoc } from '../../../types';

interface EngineeringPageProps {
  onOpenCadViewer?: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

export function EngineeringPage({ onOpenCadViewer }: EngineeringPageProps) {
  const [activeTab, setActiveTab] = useState<'master_catalog' | 'orders_release' | 'qc_approvals'>('master_catalog');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            میزکار مهندسی مکانیک، طراحی CAD و نقشه‌های فنی
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            مدیریت نقشه‌های مادر BOM، صدور و آزادسازی نقشه‌های ساخت سفارشات و بررسی تاییدیه کیفیت
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('master_catalog')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'master_catalog'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>کاتالوگ نقشه‌های مادر BOM</span>
          </button>

          <button
            onClick={() => setActiveTab('orders_release')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'orders_release'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>صدور نقشه‌های سفارشات</span>
          </button>

          <button
            onClick={() => setActiveTab('qc_approvals')}
            className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'qc_approvals'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>تاییدیه‌های کیفیت QC</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'master_catalog' && <MasterCatalogTab onOpenCadViewer={onOpenCadViewer} />}
      {activeTab === 'orders_release' && <OrdersReleaseTab />}
      {activeTab === 'qc_approvals' && <QCApprovalsTab />}
    </div>
  );
}
