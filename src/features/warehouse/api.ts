import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useWarehouse() {
  return useQuery({
    queryKey: ['warehouse'],
    queryFn: api.warehouse.getAll,
  });
}

export function useMovements() {
  return useQuery({
    queryKey: ['warehouse', 'movements'],
    queryFn: api.warehouse.getMovements,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      delta,
      reason,
      performedBy,
    }: {
      id: string;
      delta: number;
      reason?: string;
      performedBy?: string;
    }) => api.warehouse.adjust(id, delta, reason, performedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'movements'] });
    },
  });
}
