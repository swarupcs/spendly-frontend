import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  expensesApi,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseFilters,
} from '@/api/expenses.api';
import { useAuthStore } from '@/store/auth.store';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  stats: (from?: string, to?: string) =>
    [...expenseKeys.all, 'stats', from, to] as const,
  detail: (id: number) => [...expenseKeys.all, id] as const,
};

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters ?? {}),
    queryFn: async () => {
      const res = await expensesApi.list(filters);
      if (!res.success)
        throw new Error(res.error ?? 'Failed to fetch expenses');
      return { expenses: res.data ?? [], pagination: res.pagination };
    },
    staleTime: 30 * 1000,
  });
}

export function useExpenseStats(from?: string, to?: string) {
   const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: expenseKeys.stats(from, to),
    queryFn: async () => {
      const res = await expensesApi.stats(from, to);
      if (!res.success) throw new Error(res.error ?? 'Failed to fetch stats');
      return res.data!;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const res = await expensesApi.get(id);
      if (!res.success) throw new Error(res.error ?? 'Failed to fetch expense');
      return res.data!;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await expensesApi.create(data);
      if (!res.success)
        throw new Error(res.error ?? 'Failed to create expense');
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateExpenseInput;
    }) => {
      const res = await expensesApi.update(id, data);
      if (!res.success)
        throw new Error(res.error ?? 'Failed to update expense');
      return res.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await expensesApi.delete(id);
      if (!res.success)
        throw new Error(res.error ?? 'Failed to delete expense');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useBulkDeleteExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await expensesApi.bulkDelete(ids);
      if (!res.success)
        throw new Error(res.error ?? 'Failed to delete expenses');
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useEmailExpenseReport() {
  return useMutation({
    mutationFn: async (filters?: { from?: string; to?: string }) => {
      const res = await expensesApi.emailExpenseReport(filters);
      if (!res.success) {
        throw new Error(res.error ?? 'Failed to send email report');
      }
      return res;
    },
  });
}
