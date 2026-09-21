import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { CreateOrderParams, ProductionOrder } from '../../types';

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: () => api.orders.getAll(status),
  });
}

export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => (id ? api.orders.getById(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderParams) => api.orders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.orders.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useConfirmMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.orders.confirmMaterial(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}

export function useHandoverWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.orders.handoverWarehouse>[1] }) =>
      api.orders.handoverWarehouse(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    },
  });
}

export function useMaterialReceivedAndIssuePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.orders.confirmMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAssignStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      machineId,
      machineName,
      operatorId,
      operatorName,
    }: {
      orderId: string;
      stageNumber: number;
      machineId: string;
      machineName?: string;
      operatorId: string;
      operatorName?: string;
    }) =>
      api.orders.assignStage(
        orderId,
        stageNumber,
        machineId,
        machineName || 'دستگاه کارگاه',
        operatorId,
        operatorName || 'اپراتور مجری'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });
}

export function useFinishStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      stageNumber,
      producedQty,
    }: {
      orderId: string;
      stageNumber: number;
      producedQty: number;
    }) =>
      api.orders.reportProgress(
        orderId,
        stageNumber,
        producedQty,
        0,
        'qc_pending'
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

