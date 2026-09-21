import React, { useState } from 'react';
import { PlusCircle, X, Send } from 'lucide-react';
import { useModels, useParts } from '../../admin/api';
import { useCreateOrder } from '../api';
import { useToast } from '../../../context/ToastContext';
import { PersianDateTimePickerModal } from '../../../components/PersianDateTimePicker';
import type { Priority } from '../../../types';

interface NewOrderModalProps {
  onClose: () => void;
}

export function NewOrderModal({ onClose }: NewOrderModalProps) {
  const { showToast } = useToast();
  const { data: models = [] } = useModels();
  const { data: parts = [] } = useParts();
  const createOrderMutation = useCreateOrder();

  const [orderMode, setOrderMode] = useState<'standard' | 'custom'>('standard');
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(4);
  const [priority, setPriority] = useState<Priority>('urgent');
  const [deadlineDate, setDeadlineDate] = useState<string>('۱۴۰۳/۰۷/۱۵');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Custom order states
  const [customPartName, setCustomPartName] = useState('');
  const [customApplication, setCustomApplication] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const [customSampleProvided, setCustomSampleProvided] = useState(false);

  const availableParts = parts.filter((p) => p.machineModelId === selectedModelId);
  const effectivePartId = availableParts.some((p) => p.id === selectedPartId)
    ? selectedPartId
    : availableParts[0]?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (orderMode === 'standard') {
        const selectedModel = models.find((m) => m.id === selectedModelId);
        const selectedPart = parts.find((p) => p.id === effectivePartId);
        if (!selectedModel || !selectedPart) {
          showToast({ type: 'error', title: 'خطا', message: 'مدل یا قطعه انتخاب نشده است.' });
          return;
        }

        await createOrderMutation.mutateAsync({
          title: `تولید ${selectedPart.name} برای ${selectedModel.code}`,
          isCustomOrder: false,
          compressorModelId: selectedModel.id,
          compressorModelName: selectedModel.name,
          partId: selectedPart.id,
          partName: selectedPart.name,
          partNumber: selectedPart.partNumber,
          quantity,
          priority,
          deadlineDate,
          notes: orderNotes,
          createdByRole: 'ceo',
          createdByName: 'مدیرعامل (دکتر جمشیدی)',
        });
      } else {
        await createOrderMutation.mutateAsync({
          title: `سفارش ساخت سفارشی: ${customPartName}`,
          isCustomOrder: true,
          customDetails: {
            partName: customPartName,
            application: customApplication,
            material: customMaterial,
            technicalSpecs: customSpecs,
            sampleProvided: customSampleProvided,
          },
          quantity,
          priority,
          deadlineDate,
          notes: orderNotes,
          createdByRole: 'ceo',
          createdByName: 'مدیرعامل (دکتر جمشیدی)',
        });
      }

      showToast({ type: 'success', title: 'صدور موفق', message: 'دستور ساخت با موفقیت ثبت شد.' });
      onClose();
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'صدور دستور ساخت با خطا مواجه شد.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">صدور دستور ساخت جدید (Production Order)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Order Mode Toggle */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setOrderMode('standard')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                orderMode === 'standard' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              قطعه کاتالوگی (Standard)
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('custom')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                orderMode === 'custom' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              قطعه سفارشی (Custom Part)
            </button>
          </div>

          {orderMode === 'standard' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">مدل دستگاه / کمپرسور:</label>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">قطعه مورد نظر از BOM:</label>
                <select
                  value={effectivePartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {availableParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.partNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">نام قطعه سفارشی:</label>
                <input
                  type="text"
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  placeholder="مثال: شافت توربین سفارشی..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">کاربرد قطعه:</label>
                  <input
                    type="text"
                    value={customApplication}
                    onChange={(e) => setCustomApplication(e.target.value)}
                    placeholder="مثال: پتروشیمی عسلویه"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">جنس / آلیاژ:</label>
                  <input
                    type="text"
                    value={customMaterial}
                    onChange={(e) => setCustomMaterial(e.target.value)}
                    placeholder="مثال: MO40 / CK45"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quantities & Priority */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">تیراژ (تعداد):</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">اولیت تولید:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="normal">عادی (Normal)</option>
                <option value="urgent">فوریت بالا (Urgent)</option>
                <option value="emergency">اضطراری / توقف خط (Emergency)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">تاریخ تحویل (ددلاین):</label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-right font-mono focus:outline-none focus:border-amber-500"
              >
                {deadlineDate}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">دستورات ویژه مدیرعامل:</label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="توضیحات و اولویت‌بندی ویژه..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>ثبت و ابلاغ دستور ساخت</span>
            </button>
          </div>
        </form>
      </div>

      {showDatePicker && (
        <PersianDateTimePickerModal
          title="انتخاب تاریخ تحویل"
          onSelect={(date) => {
            setDeadlineDate(date);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}
