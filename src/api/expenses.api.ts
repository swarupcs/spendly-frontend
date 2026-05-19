import { request, fetchWithAuth, BASE_URL } from './client';

export type Category =
  | 'DINING'
  | 'SHOPPING'
  | 'TRANSPORT'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'HEALTH'
  | 'EDUCATION'
  | 'OTHER';

export interface Expense {
  id: number;
  title: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  convertedAmount: number;
  category: Category;
  date: string;
  notes?: string;
  merchant?: string; // ← was missing
  isTaxDeductible?: boolean; // ← was missing
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface ExpenseStats {
  total: number;
  count: number;
  average: number;
  max: number;
  min: number;
  byCategory: Array<{ category: Category; amount: number; count: number }>;
}

export interface ExpenseFilters {
  from?: string;
  to?: string;
  category?: Category;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateExpenseInput {
  title: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  category?: Category;
  date?: string;
  notes?: string;
  merchant?: string; // ← was missing
  isTaxDeductible?: boolean; // ← was missing
}

export interface UpdateExpenseInput {
  title?: string;
  amount?: number;
  currency?: string;
  exchangeRate?: number;
  category?: Category;
  date?: string;
  notes?: string;
  merchant?: string; // ← was missing
  isTaxDeductible?: boolean; // ← was missing
}

// ─── Budget types ─────────────────────────────────────────────────────────────

export interface Budget {
  id: number;
  category: Category;
  amount: number;
  updatedAt: string;
}

export interface BudgetOverviewItem {
  id: number;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface UpsertBudgetInput {
  category: Category;
  amount: number;
}

export const budgetApi = {
  list: () => request<Budget[]>('/budgets'),
  overview: (month?: string) => {
    const qs = month ? `?month=${month}` : '';
    return request<BudgetOverviewItem[]>(`/budgets/overview${qs}`);
  },
  upsert: (data: UpsertBudgetInput) =>
    request<Budget>('/budgets', { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
};

// ─── Recurring Expense types ──────────────────────────────────────────────────

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurringExpense {
  id: number;
  title: string;
  amount: number;
  category: Category;
  frequency: Frequency;
  startDate: string;
  nextDueDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface CreateRecurringInput {
  title: string;
  amount: number;
  category?: Category;
  frequency: Frequency;
  startDate: string;
  notes?: string;
}

export interface UpdateRecurringInput {
  title?: string;
  amount?: number;
  category?: Category;
  frequency?: Frequency;
  isActive?: boolean;
  notes?: string;
}

export const recurringApi = {
  list: () => request<RecurringExpense[]>('/recurring'),
  create: (data: CreateRecurringInput) =>
    request<RecurringExpense>('/recurring', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateRecurringInput) =>
    request<RecurringExpense>(`/recurring/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/recurring/${id}`, { method: 'DELETE' }),
};

export const expensesApi = {
  list: (filters?: ExpenseFilters) => {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return request<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  },
  stats: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request<ExpenseStats>(`/expenses/stats${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => request<Expense>(`/expenses/${id}`),
  create: (data: CreateExpenseInput) =>
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: UpdateExpenseInput) =>
    request<Expense>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/expenses/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: number[]) =>
    request<{ count: number }>('/expenses', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
  exportCsv: (filters?: {
    from?: string;
    to?: string;
    category?: Category;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return fetchWithAuth(`${BASE_URL}/expenses/export${qs ? `?${qs}` : ''}`);
  },
  suggestCategory: (title: string, merchant?: string) =>
    request<{ suggestedCategory: Category; confidence: string; source: string }>(
      '/expenses/suggest-category',
      {
        method: 'POST',
        body: JSON.stringify({ title, merchant }),
      }
    ),
};
