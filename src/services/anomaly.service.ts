import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { anomalyApi } from '@/api/anomaly.api';
import { useAuthStore } from '@/store/auth.store';

export const anomalyKeys = {
  all: ['anomalies'] as const,
};

export function useAnomalies() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: anomalyKeys.all,
    queryFn: async () => {
      const res = await anomalyApi.list();
      if (!res.success) throw new Error(res.error || 'Failed to fetch anomalies');
      return res.data || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDismissAnomaly() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await anomalyApi.dismiss(id);
      if (!res.success) throw new Error(res.error || 'Failed to dismiss anomaly');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: anomalyKeys.all });
    },
  });
}
