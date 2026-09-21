import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: api.users.getAll });
}

export function useModels() {
  return useQuery({ queryKey: ['models'], queryFn: api.models.getAll });
}

export function useParts(modelId?: string) {
  return useQuery({ queryKey: ['parts', modelId], queryFn: () => api.parts.getAll(modelId) });
}

export function useMachines() {
  return useQuery({ queryKey: ['machines'], queryFn: api.machines.getAll });
}

export function useFoundries() {
  return useQuery({ queryKey: ['foundries'], queryFn: api.foundries.getAll });
}

export function useOperators() {
  return useQuery({ queryKey: ['operators'], queryFn: api.operators.getAll });
}

export function useAuditLogs(params?: Parameters<typeof api.audit.getLogs>[0]) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.audit.getLogs(params),
  });
}

export function useReportBreakdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, reportedBy }: { id: string; reason: string; reportedBy?: string }) =>
      api.machines.reportBreakdown(id, reason, reportedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });
}

export function useResolveBreakdown() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.machines.resolveBreakdown(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });
}

export function useAnalytics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', startDate, endDate],
    queryFn: () => api.analytics.getReport(startDate, endDate),
  });
}
