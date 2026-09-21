import React, { useState } from 'react';
import { FileCheck2, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { useOrders } from '../../orders/api';
import { useDecideQuote } from '../api';
import { useToast } from '../../../context/ToastContext';
import type { ProductionOrder, Quote } from '../../../types';

export function PendingQuotesPanel() {
  const { showToast } = useToast();
  const { data: orders = [] } = useOrders();
  const decideQuoteMutation = useDecideQuote();

  const [rejectingInfo, setRejectingInfo] = useState<{ orderId: string; quoteId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingQuotes: { order: ProductionOrder; quote: Quote }[] = [];
  orders.forEach((o) => {
    o.quotes?.forEach((q) => {
      if (q.status === 'pending_ceo') {
        pendingQuotes.push({ order: o, quote: q });
      }
    });
  });

  const handleApprove = async (orderId: string, quoteId: string) => {
    try {
      await decideQuoteMutation.mutateAsync({
        orderId,
        quoteId,
        decision: 'approved',
      });
      showToast({ type: 'success', title: 'تایید پیش‌فاکتور', message: 'پیش‌فاکتور با موفقیت تصویب شد.' });
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'تایید پیش‌فاکتور با خطا مواجه شد.' });
    }
  };

  const handleReject = async () => {
    if (!rejectingInfo) return;
    if (!rejectReason.trim()) {
      showToast({ type: 'warning', title: 'دلیل رد', message: 'لطفاً علت رد پیش‌فاکتور را مشخص کنید.' });
      return;
    }

    try {
      await decideQuoteMutation.mutateAsync({
        orderId: rejectingInfo.orderId,
        quoteId: rejectingInfo.quoteId,
        decision: 'rejected',
        rejectionReason: rejectReason,
      });
      showToast({ type: 'warning', title: 'رد پیش‌فاکتور', message: 'پیش‌فاکتور جهت بازبینی ارجاع گردید.' });
      setRejectingInfo(null);
      setRejectReason('');
    } catch {
      showToast({ type: 'error', title: 'خطا', message: 'رد پیش‌فاکتور با خطا مواجه شد.' });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-amber-400" />
          پیش‌فاکتورهای منتظر تصویب مدیرعامل ({pendingQuotes.length})
        </h3>
      </div>

      {pendingQuotes.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-slate-400 text-xs">
          هیچ پیش‌فاکتوری منتظر تصویب وجود ندارد.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingQuotes.map(({ order, quote }) => (
            <div key={quote.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="font-bold text-white text-xs">{quote.supplierName}</span>
                  <span className="text-[11px] text-slate-400 mr-2 font-mono">سفارش: {order.orderNumber}</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">
                  {(quote.amountRials / 10).toLocaleString()} تومان
                </div>
              </div>

              <div className="text-xs text-slate-300">
                زمان تحویل: <strong className="text-amber-300 font-mono">{quote.deliveryTimeDays} روز کاری</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setRejectingInfo({ orderId: order.id, quoteId: quote.id })}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/80 flex items-center gap-1 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>رد پیش‌فاکتور</span>
                </button>
                <button
                  onClick={() => handleApprove(order.id, quote.id)}
                  disabled={decideQuoteMutation.isPending}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>تصویب و ابلاغ خرید</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-800/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              دلیل عدم تصویب پیش‌فاکتور
            </h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="علت رد پیش‌فاکتور را وارد کنید..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingInfo(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300"
              >
                انصراف
              </button>
              <button
                onClick={handleReject}
                disabled={decideQuoteMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                ثبت رد پیش‌فاکتور
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
