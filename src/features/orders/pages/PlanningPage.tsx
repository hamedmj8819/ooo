import React, { useState } from 'react';
import { ClipboardList, PlusCircle, Search, DollarSign, PackageCheck } from 'lucide-react';
import { useOrders, useMaterialReceivedAndIssuePO, useHandoverWarehouse } from '../api';
import { useMachines } from '../../admin/api';
import { MachineStatusGrid } from '../../../components/MachineStatusGrid';
import { NewOrderModal } from '../components/NewOrderModal';
import { QuoteRegistrationModal } from '../../quotes/components/QuoteRegistrationModal';
import { WorkflowStepper } from '../../../components/WorkflowStepper';
import type { StageEngineeringDoc } from '../../../types';

interface PlanningPageProps {
  onOpenCadViewer?: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

export function PlanningPage({ onOpenCadViewer }: PlanningPageProps) {
  const { data: orders = [] } = useOrders();
  const { data: machines = [] } = useMachines();

  const materialPoMutation = useMaterialReceivedAndIssuePO();
  const handoverMutation = useHandoverWarehouse();

  const [activeTab, setActiveTab] = useState<'orders' | 'machines'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [quoteModalOrderId, setQuoteModalOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    return (
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            میزکار واحد برنامه‌ریزی تولید و صدور PO
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            استعلام ریخته‌گری، ثبت پیش‌فاکتورها، اعلام تحویل ماده اولیه و نظارت بر وضعیت ماشین‌ها
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 flex items-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>صدور دستور ساخت جدید</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'orders' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>سفارشات ساخت ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('machines')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'machines' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>پایش ماشین‌آلات ({machines.length})</span>
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در کد سفارش، نام قطعه یا عنوان..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.map((ord) => (
              <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-400 ml-2">{ord.orderNumber}</span>
                    <span className="text-sm font-bold text-white">{ord.partName}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      تیراژ: {ord.quantity} عدد | تحویل: {ord.deadlineDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Actions */}
                    {ord.status === 'planning_inquiry' && (
                      <button
                        onClick={() => setQuoteModalOrderId(ord.id)}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>ثبت پیش‌فاکتور جدید</span>
                      </button>
                    )}

                    {ord.status === 'material_ordered' && (
                      <button
                        onClick={() => materialPoMutation.mutate(ord.id)}
                        disabled={materialPoMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>اعلام دریافت بار خام و صدور PO</span>
                      </button>
                    )}
                  </div>
                </div>

                <WorkflowStepper status={ord.status} isDeliveredSemiFinished={ord.isDeliveredSemiFinished} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'machines' && <MachineStatusGrid machines={machines} />}

      {showNewOrderModal && <NewOrderModal onClose={() => setShowNewOrderModal(false)} />}
      {quoteModalOrderId && (
        <QuoteRegistrationModal orderId={quoteModalOrderId} onClose={() => setQuoteModalOrderId(null)} />
      )}
    </div>
  );
}
