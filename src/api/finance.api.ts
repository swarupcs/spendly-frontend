import { request } from './client';
import type { Category } from './expenses.api';

// ─── Net Worth ────────────────────────────────────────────────────────────────

export interface NetWorthSnapshot {
  assets: number;
  liabilities: number;
  netWorth: number;
  savingsGoalsValue: number;
  totalNetWorth: number;
  breakdown: {
    manualAssets: number;
    manualLiabilities: number;
    goalsCurrentValue: number;
  };
}

// ─── Zero-Based Budget ────────────────────────────────────────────────────────

export interface ZeroBasedAllocation {
  category: Category;
  recommendedAmount: number;
  currentBudget: number | null;
  percentOfIncome: number;
}

export interface ZeroBasedBudgetResult {
  monthlyIncome: number;
  allocations: ZeroBasedAllocation[];
  totalAllocated: number;
  unallocated: number;
  method: 'historical' | 'proportional';
}

// ─── Tax Summary ──────────────────────────────────────────────────────────────

export interface TaxSummary {
  financialYear: string;
  fromDate: string;
  toDate: string;
  totalExpenses: number;
  taxDeductibleTotal: number;
  nonDeductibleTotal: number;
  deductibleByCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  deductibleExpenses: Array<{
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    merchant: string | null;
    notes: string | null;
  }>;
}

// ─── Merchant Stats ───────────────────────────────────────────────────────────

export interface MerchantStats {
  merchant: string;
  totalSpent: number;
  visitCount: number;
  avgPerVisit: number;
  lastVisit: string;
  topCategory: string;
}

// ─── Cash Flow Forecast ─────────────────────────────────────────────────────────

export interface ForecastResult {
  month: string; // YYYY-MM
  income: number;
  predictedExpenses: number;
  recurringExpenses: number;
  variableExpenses: number;
  netCashFlow: number;
  isForecast: boolean;
}

// ─── Tool Stats ───────────────────────────────────────────────────────────────

export interface ToolCallStats {
  totalCalls: number;
  byTool: Array<{
    toolName: string;
    count: number;
    successRate: number;
    avgDurationMs: number;
  }>;
  errorRate: number;
}

export interface ToolCallLog {
  id: number;
  toolName: string;
  args: Record<string, unknown>;
  success: boolean;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const financeApi = {
  getNetWorth: () => request<NetWorthSnapshot>('/finance/net-worth'),

  updateNetWorth: (data: {
    netWorthAssets?: number;
    netWorthLiabilities?: number;
    monthlyIncome?: number;
  }) =>
    request<NetWorthSnapshot>('/finance/net-worth', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getZeroBasedBudget: (income?: number) => {
    const qs = income ? `?income=${income}` : '';
    return request<ZeroBasedBudgetResult>(`/finance/zero-based-budget${qs}`);
  },

  applyZeroBasedBudget: (
    allocations: Array<{ category: Category; amount: number }>,
  ) =>
    request<{ count: number }>('/finance/zero-based-budget/apply', {
      method: 'POST',
      body: JSON.stringify({ allocations }),
    }),

  getTaxSummary: (fy?: string) => {
    const qs = fy ? `?fy=${fy}` : '';
    return request<TaxSummary>(`/finance/tax-summary${qs}`);
  },

  getTopMerchants: (params?: {
    from?: string;
    to?: string;
    limit?: number;
  }) => {
    const p = new URLSearchParams();
    if (params?.from) p.set('from', params.from);
    if (params?.to) p.set('to', params.to);
    if (params?.limit) p.set('limit', String(params.limit));
    const qs = p.toString();
    return request<MerchantStats[]>(`/finance/merchants${qs ? `?${qs}` : ''}`);
  },

  getToolStats: (days?: number) => {
    const qs = days ? `?days=${days}` : '';
    return request<ToolCallStats>(`/finance/tool-stats${qs}`);
  },

  getToolLog: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : '';
    return request<ToolCallLog[]>(`/finance/tool-log${qs}`);
  },

  getCashFlowForecast: (months?: number) => {
    const qs = months ? `?months=${months}` : '';
    return request<ForecastResult[]>(`/finance/forecast${qs}`);
  },
};
