import React, { useState } from 'react';
import { Cog, Users, Play } from 'lucide-react';
import { useOrders, useAssignStage } from '../../orders/api';
import { useMachines, useOperators } from '../../admin/api';
import { MachineStatusGrid } from '../../../components/MachineStatusGrid';
import { useToast } from '../../../context/ToastContext';

export function ProductionPage() {
  const { showToast } = useToast();
  const { data: orders = [] } = useOrders();
  const { data: machines = [] } = useMachines();
  const { data: operators = [] } = useOperators();
  const assignStageMutation = useAssignStage();

  const [activeTab, setActiveTab] = useState<'assignment' | 'shopfloor' | 'operators'>('assignment');
  const [assigningStage, setAssigningStage] = useState<{
    orderId: string;
    stageNumber: number;
    stageName: string;
    partName: string;
  } | null>(null);

  const [selectedMachineId, setSelectedMachineId] = useState<string>(machines[0]?.id || '');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>(operators[0]?.id || '');

  const productionReadyOrders = orders.filter(
    (o) => o.status === 'engineering_approved' || o.status === 'in_production' || o.status === 'assigned_to_production'
  );

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStage) return;

    try {
      await assignStageMutation.mutateAsync({
        orderId: assigningStage.orderId,
        stageNumber: assigningStage.stageNumber,
        machineId: selectedMachineId,
        operatorId: selectedOperatorId,
      });

      showToast({ type: 'success', title: 'تخصیص موفق', message: 'دستور کار با موفقیت به ماشین و اپراتور تخصیص داده شد.' });
      setAssigningStage(null);
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'تخصیص کار با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Cog className="w-5 h-5 text-rose-400" />
            میزکار سرپرست سالن تولید و ماشین‌کاری
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            تخصیص برنامه‌های ساخت به ماشین‌آلات، نظارت بر عملکرد اپراتورها و مانیتورینگ سالن
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-rose-400">
          دستگاه‌های فعال: {machines.filter((m) => m.status === 'active').length} / {machines.length}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs w-fit">
        <button
          onClick={() => setActiveTab('assignment')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'assignment' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>تخصیص کار به ماشین‌آلات</span>
        </button>

        <button
          onClick={() => setActiveTab('shopfloor')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'shopfloor' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cog className="w-4 h-4" />
          <span>وضعیت سالن تولید</span>
        </button>

        <button
          onClick={() => setActiveTab('operators')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'operators' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>پرسنل و اپراتورها ({operators.length})</span>
        </button>
      </div>

      {activeTab === 'assignment' && (
        <div className="space-y-4">
          {productionReadyOrders.map((ord) => (
            <div key={ord.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-rose-400 ml-2">{ord.orderNumber}</span>
                  <span className="text-sm font-bold text-white">{ord.partName}</span>
                </div>
                <span className="text-xs text-slate-400">تیراژ: {ord.quantity} عدد</span>
              </div>

              {/* Stages List */}
              <div className="space-y-2">
                {ord.stages?.map((stg) => (
                  <div
                    key={stg.stageNumber}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-200">
                        مرحله {stg.stageNumber}: {stg.stageName}
                      </span>
                      {stg.machineToolName && (
                        <span className="text-[11px] text-cyan-400 mr-2 font-mono">
                          ({stg.machineToolName} | اپراتور: {stg.operatorName})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setAssigningStage({
                          orderId: ord.id,
                          stageNumber: stg.stageNumber,
                          stageName: stg.stageName,
                          partName: ord.partName,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow transition-colors"
                    >
                      تخصیص دستگاه و اپراتور
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'shopfloor' && <MachineStatusGrid machines={machines} />}

      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operators.map((op) => (
            <div key={op.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white">{op.name}</span>
                <span className="font-mono text-slate-400">{op.personnelCode}</span>
              </div>
              <div className="text-slate-400">تخصص: {op.specialty}</div>
              <div className="text-emerald-400 font-mono">تولید امروز: {op.totalPartsProducedToday || 0} عدد</div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {assigningStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">
              تخصیص کار: {assigningStage.partName} - {assigningStage.stageName}
            </h3>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">انتخاب ماشین / دستگاه:</label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">انتخاب اپراتور مجری:</label>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name} ({op.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAssigningStage(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={assignStageMutation.isPending}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold"
                >
                  تخصیص نهایی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
