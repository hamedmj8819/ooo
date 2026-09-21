import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useAssignStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      machineToolId,
      machineToolName,
      operatorId,
      operatorName,
    }: {
      orderId: string;
      stageNumber: number;
      machineToolId: string;
      machineToolName: string;
      operatorId: string;
      operatorName: string;
    }) =>
      api.orders.assignStage(
        orderId,
        stageNumber,
        machineToolId,
        machineToolName,
        operatorId,
        operatorName
      ),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
}

export function useReportProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      producedQty,
      scrapQty,
      status,
    }: {
      orderId: string;
      stageNumber: number;
      producedQty: number;
      scrapQty: number;
      status?: string;
    }) => api.orders.reportProgress(orderId, stageNumber, producedQty, scrapQty, status),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}
