import React, { useState } from 'react';
import { ClipboardCheck, Search } from 'lucide-react';
import { useOrders } from '../../orders/api';
import { QCMetricsHeader } from '../components/QCMetricsHeader';
import { QCStageCard } from '../components/QCStageCard';
import { QCInspectionModal } from '../components/QCInspectionModal';
import type { ProductionOrder, StageExecutionProgress } from '../../../types';

export function QCPage() {
  const { data: orders = [] } = useOrders();

  const [filterTab, setFilterTab] = useState<'pending_qc' | 'pending_eng' | 'all' | 'completed'>('pending_qc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<{
    order: ProductionOrder;
    stage: StageExecutionProgress;
  } | null>(null);

  // Flatten stages
  const allStages: { order: ProductionOrder; stage: StageExecutionProgress }[] = [];
  orders.forEach((o) => {
    (o.stages || []).forEach((stg) => {
      allStages.push({ order: o, stage: stg });
    });
  });

  const pendingQCStages = allStages.filter((i) => i.stage.status === 'qc_pending');
  const pendingEngStages = allStages.filter((i) => i.stage.status === 'engineering_qc_pending');
  const completedStages = allStages.filter((i) => i.stage.status === 'completed');
  const rejectedStages = allStages.filter((i) => i.stage.status === 'qc_rejected');

  const filteredList = allStages.filter((item) => {
    if (filterTab === 'pending_qc' && item.stage.status !== 'qc_pending') return false;
    if (filterTab === 'pending_eng' && item.stage.status !== 'engineering_qc_pending') return false;
    if (filterTab === 'completed' && item.stage.status !== 'completed') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.order.orderNumber.toLowerCase().includes(q) ||
      item.order.partName.toLowerCase().includes(q) ||
      item.stage.stageName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-cyan-400" />
            میزکار کنترل کیفیت (QC) و برگه بازرسی فنی
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            ثبت اندازه‌گیری‌های ابعادی، سختی‌سنجی، صافی سطح و صدور تاییدیه‌های کیفی مراحل ساخت
          </p>
        </div>
      </div>

      {/* Metrics Header */}
      <QCMetricsHeader
        pendingCount={pendingQCStages.length}
        pendingEngCount={pendingEngStages.length}
        completedCount={completedStages.length}
        rejectedCount={rejectedStages.length}
        activeTab={filterTab}
        onTabChange={setFilterTab}
      />

      {/* Search Bar */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو بر اساس کد سفارش، نام قطعه، نام مرحله یا اپراتور..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Stages List */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
          هیچ موردی مطابق فیلترهای انتخابی یافت نشد.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(({ order, stage }) => (
            <QCStageCard
              key={`${order.id}-${stage.stageNumber}`}
              order={order}
              stage={stage}
              onOpenInspection={(o, s) => setSelectedInspection({ order: o, stage: s })}
            />
          ))}
        </div>
      )}

      {/* Inspection Form Modal */}
      {selectedInspection && (
        <QCInspectionModal
          order={selectedInspection.order}
          stage={selectedInspection.stage}
          onClose={() => setSelectedInspection(null)}
        />
      )}
    </div>
  );
}
