import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useStartStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, stageNumber }: { orderId: string; stageNumber: number }) =>
      api.orders.startStage(orderId, stageNumber),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });
}
