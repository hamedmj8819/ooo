import React, { useState } from 'react';
import { DollarSign, X, Send } from 'lucide-react';
import { useAddQuote } from '../api';
import { useToast } from '../../../context/ToastContext';

interface QuoteRegistrationModalProps {
  orderId: string;
  onClose: () => void;
}

export function QuoteRegistrationModal({ orderId, onClose }: QuoteRegistrationModalProps) {
  const { showToast } = useToast();
  const addQuoteMutation = useAddQuote();

  const [supplierName, setSupplierName] = useState('صنایع ریخته‌گری اصفهان');
  const [supplierType, setSupplierType] = useState<'foundry' | 'raw_material' | 'outsourcing' | 'importer'>('foundry');
  const [quoteAmount, setQuoteAmount] = useState<number>(1200000000);
  const [deliveryDays, setDeliveryDays] = useState<number>(12);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteFileName, setQuoteFileName] = useState('Pishfactor-Rikhtegari.pdf');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addQuoteMutation.mutateAsync({
        orderId,
        data: {
          supplierName,
          supplierType,
          amountRials: quoteAmount,
          deliveryTimeDays: deliveryDays,
          notes: quoteNotes,
          attachmentFileName: quoteFileName,
        },
      });

      showToast({ type: 'success', title: 'ثبت شد', message: 'پیش‌فاکتور با موفقیت ثبت شد.' });
      onClose();
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'ثبت پیش‌فاکتور با خطا مواجه شد.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">ثبت استعلام و پیش‌فاکتور جدید</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">نام تامین‌کننده / ریخته‌گر:</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">مبلغ (تومان):</label>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">مدت تحویل (روز کاری):</label>
              <input
                type="number"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">توضیحات و مشخصات آلیاژ:</label>
            <input
              type="text"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="مثال: آنالیز شیمیایی مطابق ASTM A536..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
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
              disabled={addQuoteMutation.isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>ثبت و ارسال جهت تصویب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
