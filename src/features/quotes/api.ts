import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { CreateQuoteParams } from '../../types';

export function useAddQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: CreateQuoteParams }) =>
      api.orders.addQuote(orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

export function useDecideQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      quoteId,
      decision,
      rejectionReason,
      decidedBy,
    }: {
      orderId: string;
      quoteId: string;
      decision: 'approved' | 'rejected';
      rejectionReason?: string;
      decidedBy?: string;
    }) => api.orders.decideQuote(orderId, quoteId, decision, rejectionReason, decidedBy),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}
