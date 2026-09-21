import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { StageEngineeringApproval } from '../../types';

export function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: () => api.parts.getAll(),
  });
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => api.models.getAll(),
  });
}

export function useUploadEngineeringDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: Parameters<typeof api.orders.uploadEngineeringDoc>[1];
    }) => api.orders.uploadEngineeringDoc(orderId, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

export function useEngineeringApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      data,
    }: {
      orderId: string;
      stageNumber: number;
      data: Partial<StageEngineeringApproval>;
    }) => api.orders.engineeringApproval(orderId, stageNumber, data),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}
