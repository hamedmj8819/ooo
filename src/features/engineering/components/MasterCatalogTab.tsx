import React, { useState } from 'react';
import { FileCode2, Search, Save, Boxes, Layers, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useParts, useModels } from '../../admin/api';
import { useToast } from '../../../context/ToastContext';
import { api } from '../../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import type { PartDefinition, StageEngineeringDoc } from '../../../types';

interface MasterCatalogTabProps {
  onOpenCadViewer?: (doc: StageEngineeringDoc, partName: string, orderNumber: string) => void;
}

export function MasterCatalogTab({ onOpenCadViewer }: MasterCatalogTabProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: parts = [] } = useParts();
  const { data: models = [] } = useModels();

  const [selectedModelFilter, setSelectedModelFilter] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string>(parts[0]?.id || '');

  const [editingStage, setEditingStage] = useState<{
    partId: string;
    stageNumber: number;
    pdfName: string;
    stepName: string;
  } | null>(null);

  const selectedPart = parts.find((p) => p.id === selectedPartId) || parts[0];
  const [partMasterDwg, setPartMasterDwg] = useState<string>(selectedPart?.defaultDrawingName || '');
  const [partMasterStep, setPartMasterStep] = useState<string>(selectedPart?.defaultStepFileName || '');

  const filteredParts = parts.filter((p) => {
    const matchesModel = selectedModelFilter === 'all' || p.machineModelId === selectedModelFilter;
    const matchesSearch =
      p.name.includes(catalogSearch) ||
      p.partNumber.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.material.includes(catalogSearch);
    return matchesModel && matchesSearch;
  });

  const handleSelectPart = (p: PartDefinition) => {
    setSelectedPartId(p.id);
    setPartMasterDwg(p.defaultDrawingName || '');
    setPartMasterStep(p.defaultStepFileName || '');
  };

  const handleSaveMasterDrawings = async () => {
    if (!selectedPart) return;
    try {
      await api.parts.updateMasterDrawings(selectedPart.id, partMasterDwg, partMasterStep);
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      showToast({ type: 'success', title: 'موفقیت', message: 'نقشه‌های مادر قطعه با موفقیت ذخیره شد.' });
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'ذخیره نقشه‌های مادر با خطا مواجه شد.' });
    }
  };

  const handleSaveStageDrawings = async (partId: string, stageNumber: number, pdf: string, step: string) => {
    try {
      await api.parts.updateStageDrawings(partId, stageNumber, pdf, step);
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      setEditingStage(null);
      showToast({ type: 'success', title: 'موفقیت', message: `نقشه‌های مرحله ${stageNumber} بروزرسانی شد.` });
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'بروزرسانی نقشه‌ها با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header and filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="md:col-span-1">
          <label className="block text-xs text-slate-400 mb-1 font-medium">فیلتر بر اساس مدل کمپرسور:</label>
          <select
            value={selectedModelFilter}
            onChange={(e) => setSelectedModelFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">همه مدل‌های کمپرسور ({models.length})</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs text-slate-400 mb-1 font-medium">جستجو در قطعات (نام، کد فنی، متریال):</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="مثال: میل‌لنگ، DWG-102، چدن داکتیل..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parts List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Boxes className="w-4 h-4 text-cyan-400" />
            کاتالوگ قطعات تعریف‌شده ({filteredParts.length})
          </h3>

          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
            {filteredParts.map((part) => {
              const isSelected = selectedPart?.id === part.id;
              return (
                <button
                  key={part.id}
                  onClick={() => handleSelectPart(part)}
                  className={`w-full text-right p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500/80 text-white shadow-lg'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{part.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {part.partNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>جنس: {part.material}</span>
                    <span>تعداد مراحل: {part.defaultStages?.length || 0}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Part Details & Drawings */}
        {selectedPart ? (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-cyan-400" />
                  نقشه‌های مهندسی: {selectedPart.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  کد قطعه: {selectedPart.partNumber} | آلیاژ: {selectedPart.material} | وزن: {selectedPart.finishedWeightKg}kg
                </p>
              </div>
            </div>

            {/* Master Drawings Form */}
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                نقشه مادر و مدل ۳بعدی اصلی قطعه (Master CAD & Blueprint)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">فایل نقشه دو بعدی PDF مادر:</label>
                  <input
                    type="text"
                    value={partMasterDwg}
                    onChange={(e) => setPartMasterDwg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">فایل مدل ۳بعدی STEP مادر:</label>
                  <input
                    type="text"
                    value={partMasterStep}
                    onChange={(e) => setPartMasterStep(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveMasterDrawings}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  ثبت نقشه‌های مادر
                </button>
              </div>
            </div>

            {/* Manufacturing Stages Drawings Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                نقشه‌های اختصاصی مراحل ساخت ({selectedPart.defaultStages?.length || 0} مرحله)
              </h3>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      <th className="p-3">مرحله</th>
                      <th className="p-3">عنوان فرایند</th>
                      <th className="p-3">نقشه PDF مرحله</th>
                      <th className="p-3">مدل STEP مرحله</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {selectedPart.defaultStages?.map((stg: { stageNumber: number; name: string; pdfDrawingFileName?: string; stepFileName?: string }) => {
                      const isEditing =
                        editingStage?.partId === selectedPart.id && editingStage?.stageNumber === stg.stageNumber;

                      return (
                        <tr key={stg.stageNumber} className="hover:bg-slate-800/30">
                          <td className="p-3 font-mono font-bold text-cyan-400">مرحله {stg.stageNumber}</td>
                          <td className="p-3 font-medium">{stg.name}</td>
                          <td className="p-3 font-mono text-[11px]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStage.pdfName}
                                onChange={(e) =>
                                  setEditingStage({ ...editingStage, pdfName: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                              />
                            ) : (
                              stg.pdfDrawingFileName || 'تنظیم نشده'
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingStage.stepName}
                                onChange={(e) =>
                                  setEditingStage({ ...editingStage, stepName: e.target.value })
                                }
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100"
                              />
                            ) : (
                              stg.stepFileName || 'تنظیم نشده'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() =>
                                  handleSaveStageDrawings(
                                    selectedPart.id,
                                    stg.stageNumber,
                                    editingStage.pdfName,
                                    editingStage.stepName
                                  )
                                }
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px]"
                              >
                                ذخیره
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setEditingStage({
                                    partId: selectedPart.id,
                                    stageNumber: stg.stageNumber,
                                    pdfName: stg.pdfDrawingFileName || '',
                                    stepName: stg.stepFileName || '',
                                  })
                                }
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px]"
                              >
                                ویرایش
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
        ) : null}
      </div>
    </div>
  );
}
