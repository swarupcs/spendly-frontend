import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/api/finance.api';
import type { Category } from '@/api/expenses.api';

export const financeKeys = {
  netWorth: ['finance', 'net-worth'] as const,
  zeroBased: (income?: number) => ['finance', 'zero-based', income] as const,
  taxSummary: (fy?: string) => ['finance', 'tax-summary', fy] as const,
  merchants: (params?: object) => ['finance', 'merchants', params] as const,
  toolStats: (days?: number) => ['finance', 'tool-stats', days] as const,
  toolLog: (limit?: number) => ['finance', 'tool-log', limit] as const,
  cashFlow: (months?: number) => ['finance', 'cashflow', months] as const,
};

export function useNetWorth() {
  return useQuery({
    queryKey: financeKeys.netWorth,
    queryFn: async () => {
      const res = await financeApi.getNetWorth();
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load net worth');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateNetWorth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      netWorthAssets?: number;
      netWorthLiabilities?: number;
      monthlyIncome?: number;
    }) => {
      const res = await financeApi.updateNetWorth(data);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to update net worth');
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.netWorth }),
  });
}

export function useZeroBasedBudget(income?: number) {
  return useQuery({
    queryKey: financeKeys.zeroBased(income),
    queryFn: async () => {
      const res = await financeApi.getZeroBasedBudget(income);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to generate budget');
      return res.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useApplyZeroBasedBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      allocations: Array<{ category: Category; amount: number }>,
    ) => {
      const res = await financeApi.applyZeroBasedBudget(allocations);
      if (!res.success) throw new Error(res.error ?? 'Failed to apply budget');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useTaxSummary(fy?: string) {
  return useQuery({
    queryKey: financeKeys.taxSummary(fy),
    queryFn: async () => {
      const res = await financeApi.getTaxSummary(fy);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load tax summary');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useTopMerchants(params?: {
  from?: string;
  to?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: financeKeys.merchants(params),
    queryFn: async () => {
      const res = await financeApi.getTopMerchants(params);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load merchants');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useToolStats(days?: number) {
  return useQuery({
    queryKey: financeKeys.toolStats(days),
    queryFn: async () => {
      const res = await financeApi.getToolStats(days);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load tool stats');
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useToolLog(limit?: number) {
  return useQuery({
    queryKey: financeKeys.toolLog(limit),
    queryFn: async () => {
      const res = await financeApi.getToolLog(limit);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load tool log');
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCashFlowForecast(months?: number) {
  return useQuery({
    queryKey: financeKeys.cashFlow(months),
    queryFn: async () => {
      const res = await financeApi.getCashFlowForecast(months);
      if (!res.success || !res.data)
        throw new Error(res.error ?? 'Failed to load cash flow forecast');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}
