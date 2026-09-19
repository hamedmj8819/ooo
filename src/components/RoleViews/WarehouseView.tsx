import React, { useState } from 'react';
import {
  WarehouseItem,
  ProductionOrder
} from '../../types';
import {
  PackageCheck,
  Boxes,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  TrendingDown,
  Warehouse,
  FileCheck2,
  Printer
} from 'lucide-react';

interface WarehouseViewProps {
  inventory: WarehouseItem[];
  orders: ProductionOrder[];
  onHandoverReceipt: (orderId: string, qty: number, isSemiFinished: boolean) => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({
  inventory,
  orders,
  onHandoverReceipt
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Orders completed or waiting for warehouse intake
  const readyOrders = orders.filter(
    o => (o.status === 'in_production' && o.completionPercentage >= 90) ||
         o.status === 'completed' ||
         o.status === 'semi_finished_stored'
  );

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.includes(searchQuery) ||
                          item.partNumber.includes(searchQuery) ||
                          item.shelfLocation.includes(searchQuery);
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && item.type === filterType;
  });

  const totalFinished = inventory.filter(i => i.type === 'final_product').reduce((acc, i) => acc + i.quantity, 0);
  const totalSemiFinished = inventory.filter(i => i.type === 'semi_finished').reduce((acc, i) => acc + i.quantity, 0);
  const totalRawCasting = inventory.filter(i => i.type === 'raw_material').reduce((acc, i) => acc + i.quantity, 0);
  const totalBoughtOut = inventory.filter(i => i.type === 'bought_out').reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* Warehouse Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              مدیریت انبار مرکزی و موجودی قطعات (سطح ۷)
            </span>
            <span className="text-xs text-slate-400">قطعات کامل، نیمه‌ساخته و ریخته‌گری ورودی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            انبار قطعات کمپرسور و بلوئر کارخانه
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            ثبت ورود قطعات تکمیل شده از سالن ماشین‌کاری، پذیرش قطعات نیمه‌ساخته در گردش، و پایش حد سفارش بلبرینگ‌ها و متریال خام.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-800/40 text-xs font-bold transition shadow"
        >
          <Printer className="w-4 h-4" />
          <span>چاپ کاردکس انبار</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">قطعات کامل ساخته‌شده</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{totalFinished} عدد</div>
            <div className="text-[11px] text-slate-400 mt-0.5">آماده مونتاژ در ایراند</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">قطعات نیمه‌ساخته (WIP)</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{totalSemiFinished} عدد</div>
            <div className="text-[11px] text-slate-400 mt-0.5">نیازمند عملیات تکمیلی</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">قطعات خام ریخته‌گری</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{totalRawCasting} عدد</div>
            <div className="text-[11px] text-slate-400 mt-0.5">چدن GGG40 و GG25</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">قطعات خریدنی / وارداتی (۲۰٪)</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{totalBoughtOut} عدد</div>
            <div className="text-[11px] text-slate-400 mt-0.5">بلبرینگ، کاسه‌نمد، پیچ</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Boxes className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Orders Completed / Semi-Finished Handover Hub */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-teal-400" />
            تحویل‌گیری قطعات از سالن ماشین‌کاری (ورودی به انبار)
          </h3>
          <span className="text-xs text-slate-400">{readyOrders.length} سفارش در وضعیت تحویل</span>
        </div>

        <div className="space-y-3">
          {readyOrders.map((ord) => {
            const isDelivered = ord.status === 'completed' || ord.status === 'semi_finished_stored';

            return (
              <div
                key={ord.id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 font-bold">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">{ord.partNumber}</span>
                    {isDelivered && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {ord.isDeliveredSemiFinished ? 'رسید نیمه‌ساخته صادر شد ✓' : 'رسید نهایی صادر شد ✓'}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{ord.title}</h4>
                  <p className="text-xs text-slate-400">
                    قطعه: <strong className="text-slate-200">{ord.partName}</strong> | تیراژ سفارش: <strong className="text-emerald-400">{ord.quantity} عدد</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isDelivered ? (
                    <>
                      <button
                        onClick={() => onHandoverReceipt(ord.id, ord.quantity, false)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        رسید قطعه تکمیل‌شده
                      </button>
                      <button
                        onClick={() => onHandoverReceipt(ord.id, ord.quantity, true)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5"
                      >
                        <Layers className="w-4 h-4" />
                        رسید به عنوان قطعه نیمه‌ساخته
                      </button>
                    </>
                  ) : (
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4" />
                      رسید ورود انبار شماره REC-{ord.orderNumber.replace('PO-', '')} صادر شده
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory Catalog Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در انبار (نام قطعه، شماره فنی، شماره قفسه)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> دسته‌بندی انبار:
            </span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="all">همه موجودی انبار</option>
              <option value="final_product">قطعات کامل ساخته‌شده</option>
              <option value="semi_finished">قطعات نیمه‌ساخته (WIP)</option>
              <option value="raw_material">قطعات خام ریخته‌گری</option>
              <option value="bought_out">اقلام وارداتی و خریدنی</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">شماره فنی</th>
                <th className="p-3">شرح قطعه</th>
                <th className="p-3">دسته‌بندی انبار</th>
                <th className="p-3">موجودی فعلی</th>
                <th className="p-3">موقعیت قفسه (Rack)</th>
                <th className="p-3">آخرین بروزرسانی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredInventory.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-cyan-300">{item.partNumber}</td>
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'final_product'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : item.type === 'semi_finished'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : item.type === 'raw_material'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {item.type === 'final_product'
                          ? 'قطعه کامل'
                          : item.type === 'semi_finished'
                          ? 'نیمه‌ساخته'
                          : item.type === 'raw_material'
                          ? 'ریخته‌گری خام'
                          : 'وارداتی/خریدنی'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-sm text-white">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 font-mono text-slate-300">{item.shelfLocation}</td>
                    <td className="p-3 text-slate-400 font-mono">{item.lastUpdated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
