import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { StageQCReport } from '../../types';

export function useSubmitQCReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      data,
    }: {
      orderId: string;
      stageNumber: number;
      data: Partial<StageQCReport>;
    }) => api.orders.submitQCReport(orderId, stageNumber, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}
