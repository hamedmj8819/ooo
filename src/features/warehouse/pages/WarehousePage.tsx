import React, { useState } from 'react';
import { PackageCheck, Search, Boxes, ArrowLeftRight } from 'lucide-react';
import { useOrders } from '../../orders/api';

export function WarehousePage() {
  const { data: orders = [] } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');

  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'semi_finished_stored');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-400" />
            میزکار انبار مرکزی و موجودی قطعات (کاردکس انبار)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            تحویل‌گیری قطعات نهایی و نیمه‌ساخته، مشاهده سوابق ورود/خروج و کاردکس
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کاردکس انبار..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {completedOrders.map((ord) => (
          <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white">{ord.partName}</span>
              <span className="font-mono text-teal-400">{ord.orderNumber}</span>
            </div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>تعداد موجودی انبار: <strong className="text-white font-mono">{ord.quantity} عدد</strong></span>
              <span>وضعیت: {ord.status === 'completed' ? 'محصول نهایی' : 'نیمه‌ساخته'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
