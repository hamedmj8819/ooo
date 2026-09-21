import React, { useState } from 'react';
import { PlusCircle, FileCheck2, BarChart3, Boxes } from 'lucide-react';
import { useOrders } from '../../orders/api';
import { NewOrderModal } from '../../orders/components/NewOrderModal';
import { PendingQuotesPanel } from '../../quotes/components/PendingQuotesPanel';
import { CeoAnalyticsPanel } from '../../orders/components/CeoAnalyticsPanel';

export function CeoPage() {
  const { data: orders = [] } = useOrders();
  const [activeTab, setActiveTab] = useState<'orders' | 'quotes' | 'analytics'>('orders');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            میزکار مدیریت ارشد و مدیرعامل
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            صدور دستور ساخت (PO)، تصویب پیش‌فاکتورهای تدارکات و نظارت بر شاخص‌های تولید کارخانه
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>صدور دستور ساخت جدید</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'orders' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>سفارشات ساخت ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'quotes' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>پیش‌فاکتورها</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'analytics' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>داشبورد آماری</span>
        </button>
      </div>

      {/* Panels */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 pb-2 border-b border-slate-800">
            لیست دستورات ساخت جاری ({orders.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orders.map((o) => (
              <div key={o.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{o.partName}</span>
                  <span className="font-mono text-cyan-400 text-[11px]">{o.orderNumber}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>تعداد: {o.quantity} عدد</span>
                  <span>اولویت: {o.priority === 'urgent' ? 'فوریت' : o.priority === 'emergency' ? 'اضطراری' : 'عادی'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'quotes' && <PendingQuotesPanel />}
      {activeTab === 'analytics' && <CeoAnalyticsPanel />}

      {/* New Order Modal */}
      {showNewOrderModal && <NewOrderModal onClose={() => setShowNewOrderModal(false)} />}
    </div>
  );
}
