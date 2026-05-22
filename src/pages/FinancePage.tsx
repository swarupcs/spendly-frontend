import { useState } from 'react';
import {
  useNetWorth, useUpdateNetWorth,
  useZeroBasedBudget, useApplyZeroBasedBudget,
  useTaxSummary, useTopMerchants,
  useToolStats, useToolLog,
  useCashFlowForecast
} from '@/services/finance.service';
import { useFmt } from '@/hooks/useCurrency';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useUserSettings } from '@/services/auth.service';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Wallet, FileText,
  Store, Cpu, CheckCircle2,
  AlertCircle, BarChart2, Loader2,
  LineChart, TrendingUp,
} from 'lucide-react';

type Tab = 'networth' | 'zero-budget' | 'tax' | 'merchants' | 'forecast' | 'ai-stats';

function TabPill({ label, icon: Icon, active, onClick }: {
  id: Tab; label: string; icon: React.ElementType; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className='flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 transition-all'
      style={{
        background: active ? 'rgba(124,92,252,0.2)' : 'transparent',
        border: `1px solid ${active ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.12)'}`,
        color: active ? '#9d7fff' : '#4a4870',
      }}>
      <Icon className='w-3 h-3' /> {label}
    </button>
  );
}

// ─── Net Worth Tab ────────────────────────────────────────────────────────────
function NetWorthTab() {
  const fmt = useFmt();
  const { data: nw, isLoading } = useNetWorth();
  const { mutate: update, isPending } = useUpdateNetWorth();
  const [assets, setAssets] = useState('');
  const [liabilities, setLiabilities] = useState('');
  const [income, setIncome] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const payload: Record<string, number> = {};
    if (assets) payload.netWorthAssets = parseFloat(assets);
    if (liabilities) payload.netWorthLiabilities = parseFloat(liabilities);
    if (income) payload.monthlyIncome = parseFloat(income);
    update(payload, {
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    });
  };

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;

  return (
    <div className='space-y-4'>
      {/* Net worth summary */}
      {nw && (
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {[
            { label: 'Total Net Worth', value: fmt(nw.totalNetWorth), color: nw.totalNetWorth >= 0 ? '#00ff87' : '#ff2d78' },
            { label: 'Assets', value: fmt(nw.assets), color: '#00d4ff' },
            { label: 'Liabilities', value: fmt(nw.liabilities), color: '#ff2d78' },
            { label: 'Savings Goals', value: fmt(nw.savingsGoalsValue), color: '#9d7fff' },
            { label: 'Net Position', value: fmt(nw.netWorth), color: nw.netWorth >= 0 ? '#00ff87' : '#ff2d78' },
          ].map((m) => (
            <Card key={m.label} style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${m.color}20` }}>
              <CardContent className='p-3'>
                <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>{m.label}</p>
                <p className='font-display text-lg font-black' style={{ color: m.color }}>{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update form */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardHeader className='pb-2 px-4 pt-4'>
          <CardTitle className='text-sm font-display text-[#f0efff]'>Update Net Worth</CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4 space-y-3'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            {[
              { label: 'Total Assets (₹)', placeholder: 'e.g. 500000', value: assets, setValue: setAssets, hint: `Current: ${nw ? fmt(nw.assets) : '—'}` },
              { label: 'Total Liabilities (₹)', placeholder: 'e.g. 200000', value: liabilities, setValue: setLiabilities, hint: `Current: ${nw ? fmt(nw.liabilities) : '—'}` },
              { label: 'Monthly Income (₹)', placeholder: 'e.g. 80000', value: income, setValue: setIncome, hint: 'For zero-based budgeting' },
            ].map((f) => (
              <div key={f.label} className='space-y-1.5'>
                <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>{f.label}</Label>
                <Input type='number' placeholder={f.placeholder} value={f.value}
                  onChange={(e) => f.setValue(e.target.value)}
                  className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]' />
                <p className='font-mono text-[9px] text-[#4a4870]'>{f.hint}</p>
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={isPending}
            className='h-10 gap-2 text-white font-display font-bold'
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}>
            {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : saved ? <><CheckCircle2 className='w-4 h-4' /> Saved!</> : 'Update'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Zero-Based Budget Tab ────────────────────────────────────────────────────
function ZeroBudgetTab() {
  const fmt = useFmt();
  const { data: settings } = useUserSettings();
  const [incomeOverride, setIncomeOverride] = useState('');
  const [applied, setApplied] = useState(false);

  const income = incomeOverride ? parseFloat(incomeOverride) : undefined;
  const { data: zbResult, isLoading, error } = useZeroBasedBudget(income);
  const { mutate: applyBudget, isPending: applying } = useApplyZeroBasedBudget();
  const [editedAmounts, setEditedAmounts] = useState<Record<string, string>>({});

  const handleApply = () => {
    if (!zbResult) return;
    const allocations = zbResult.allocations.map((a) => ({
      category: a.category,
      amount: editedAmounts[a.category] !== undefined
        ? parseFloat(editedAmounts[a.category]) || a.recommendedAmount
        : a.recommendedAmount,
    }));
    applyBudget(allocations, {
      onSuccess: () => { setApplied(true); setTimeout(() => setApplied(false), 3000); }
    });
  };

  return (
    <div className='space-y-4'>
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardContent className='p-4'>
          <div className='flex items-end gap-3'>
            <div className='flex-1 space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>Monthly Income Override (₹)</Label>
              <Input type='number' placeholder='Leave blank to use saved income'
                value={incomeOverride} onChange={(e) => setIncomeOverride(e.target.value)}
                className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' />
            </div>
          </div>
          {settings && (
            <p className='font-mono text-[10px] text-[#4a4870] mt-2'>
              Saved monthly income: {settings.currency} — set this in Settings
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />}

      {error && (
        <div className='flex items-center gap-2 p-4 rounded-xl' style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.2)' }}>
          <AlertCircle className='w-5 h-5 text-[#ff3b5c] shrink-0' />
          <p className='font-sans text-sm text-[#ff6b6b]'>{(error as Error).message}</p>
        </div>
      )}

      {zbResult && (
        <>
          <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='font-mono text-[10px] text-[#4a4870]'>Monthly Income</p>
                <p className='font-display text-2xl font-black text-[#f0efff]'>{fmt(zbResult.monthlyIncome)}</p>
              </div>
              <div className='text-right'>
                <p className='font-mono text-[10px] text-[#4a4870]'>Unallocated</p>
                <p className='font-display text-2xl font-black' style={{ color: zbResult.unallocated >= 0 ? '#00ff87' : '#ff2d78' }}>
                  {fmt(zbResult.unallocated)}
                </p>
              </div>
              <Badge className='font-mono text-[9px]' style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                {zbResult.method === 'historical' ? 'Historical' : 'Proportional'}
              </Badge>
            </CardContent>
          </Card>

          <div className='space-y-2'>
            {zbResult.allocations.map((a) => {
              const CATEGORY_COLORS_MAP: Record<string, string> = {
                DINING: '#ff2d78', SHOPPING: '#9d7fff', TRANSPORT: '#00d4ff',
                ENTERTAINMENT: '#ffb830', UTILITIES: '#00ff87', HEALTH: '#ff6b9d',
                EDUCATION: '#5b8fff', OTHER: '#4a4870',
              };
              const color = CATEGORY_COLORS_MAP[a.category] ?? '#9d7fff';
              const pct = zbResult.monthlyIncome > 0
                ? Math.round((a.recommendedAmount / zbResult.monthlyIncome) * 100) : 0;
              return (
                <div key={a.category} className='flex items-center gap-3 p-3 rounded-xl'
                  style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${color}18` }}>
                  <div className='w-2 h-8 rounded-sm shrink-0' style={{ background: color }} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <span className='font-sans text-sm font-semibold text-[#f0efff]'>{a.category}</span>
                      <span className='font-mono text-[9px] text-[#4a4870]'>{pct}% of income</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      {a.currentBudget !== null && (
                        <span className='font-mono text-[9px] text-[#4a4870]'>Current: {fmt(a.currentBudget)}</span>
                      )}
                      <span className='font-mono text-[9px]' style={{ color }}>→ Recommended: {fmt(a.recommendedAmount)}</span>
                    </div>
                  </div>
                  <Input type='number' value={editedAmounts[a.category] ?? Math.round(a.recommendedAmount)}
                    onChange={(e) => setEditedAmounts((p) => ({ ...p, [a.category]: e.target.value }))}
                    className='w-24 h-8 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' />
                </div>
              );
            })}
          </div>

          <Button onClick={handleApply} disabled={applying} className='w-full h-11 gap-2 text-white font-display font-bold'
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}>
            {applying ? <Loader2 className='w-4 h-4 animate-spin' /> : applied ? <><CheckCircle2 className='w-4 h-4' /> Applied!</> : 'Apply as Budget'}
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Tax Summary Tab ──────────────────────────────────────────────────────────
function TaxTab() {
  const fmt = useFmt();
  const currentYear = new Date().getFullYear();
  const [fy, setFy] = useState(String(currentYear - 1));
  const { data: tax, isLoading, refetch } = useTaxSummary(fy);

  return (
    <div className='space-y-4'>
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardContent className='p-4 flex items-end gap-3'>
          <div className='flex-1 space-y-1.5'>
            <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>Financial Year Starting</Label>
            <Input type='number' value={fy} onChange={(e) => setFy(e.target.value)} min={2020} max={currentYear}
              className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' />
            <p className='font-mono text-[9px] text-[#4a4870]'>FY {fy}-{String(parseInt(fy) + 1).slice(-2)} (Apr–Mar)</p>
          </div>
          <Button onClick={() => refetch()} className='h-10 gap-2 text-white font-semibold'
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}>
            Load
          </Button>
        </CardContent>
      </Card>

      {isLoading && <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />}

      {tax && (
        <>
          {/* Summary */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {[
              { label: 'Total Expenses', value: fmt(tax.totalExpenses), color: '#f0efff' },
              { label: 'Tax Deductible', value: fmt(tax.taxDeductibleTotal), color: '#00ff87' },
              { label: 'Non-Deductible', value: fmt(tax.nonDeductibleTotal), color: '#4a4870' },
            ].map((m) => (
              <Card key={m.label} style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
                <CardContent className='p-3'>
                  <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>{m.label}</p>
                  <p className='font-display text-lg font-black' style={{ color: m.color }}>{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {tax.deductibleByCategory.length > 0 && (
            <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(0,255,135,0.15)' }}>
              <CardHeader className='pb-2 px-4 pt-4'>
                <CardTitle className='text-sm font-display text-[#f0efff]'>Deductible by Category</CardTitle>
              </CardHeader>
              <CardContent className='px-4 pb-4 space-y-2'>
                {tax.deductibleByCategory.map((c) => (
                  <div key={c.category} className='flex items-center justify-between'>
                    <span className='font-sans text-sm text-[#f0efff]'>{c.category}</span>
                    <div className='flex items-center gap-3'>
                      <span className='font-mono text-[10px] text-[#4a4870]'>{c.count} txns</span>
                      <span className='font-mono text-sm font-bold text-[#00ff87]'>{fmt(c.amount)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tax.deductibleExpenses.length > 0 && (
            <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
              <CardHeader className='pb-2 px-4 pt-4'>
                <CardTitle className='text-sm font-display text-[#f0efff]'>Deductible Expenses ({tax.deductibleExpenses.length})</CardTitle>
              </CardHeader>
              <CardContent className='px-4 pb-4 space-y-1.5'>
                {tax.deductibleExpenses.map((e) => (
                  <div key={e.id} className='flex items-center justify-between p-2.5 rounded-xl hover:bg-[rgba(124,92,252,0.05)] transition-colors'>
                    <div className='min-w-0 flex-1'>
                      <p className='font-sans text-sm text-[#f0efff] truncate'>{e.title}</p>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-[9px] text-[#4a4870]'>{e.date}</span>
                        {e.merchant && <span className='font-mono text-[9px] text-[#4a4870]'>· {e.merchant}</span>}
                      </div>
                    </div>
                    <span className='font-mono text-sm font-bold text-[#00ff87] shrink-0 ml-2'>{fmt(e.amount)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tax.deductibleExpenses.length === 0 && (
            <div className='text-center py-10 text-[#4a4870] text-sm'>
              No tax-deductible expenses for {tax.financialYear}. Mark expenses as tax-deductible via AI Chat.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Merchants Tab ────────────────────────────────────────────────────────────
function MerchantsTab() {
  const fmt = useFmt();
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const defaultTo = now.toISOString().split('T')[0];
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const { data: merchants, isLoading, refetch } = useTopMerchants({ from, to, limit: 15 });

  const CATEGORY_COLORS_MAP: Record<string, string> = {
    DINING: '#ff2d78', SHOPPING: '#9d7fff', TRANSPORT: '#00d4ff',
    ENTERTAINMENT: '#ffb830', UTILITIES: '#00ff87', HEALTH: '#ff6b9d',
    EDUCATION: '#5b8fff', OTHER: '#4a4870',
  };

  return (
    <div className='space-y-4'>
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardContent className='p-4'>
          <div className='flex items-end gap-3 flex-wrap'>
            <div className='space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>From</Label>
              <Input type='date' value={from} onChange={(e) => setFrom(e.target.value)}
                className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
            </div>
            <div className='space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>To</Label>
              <Input type='date' value={to} onChange={(e) => setTo(e.target.value)}
                className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
            </div>
            <Button onClick={() => refetch()} className='h-10 gap-2 text-white font-semibold'
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}>
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />}

      {merchants && merchants.length === 0 && (
        <div className='text-center py-12 text-[#4a4870] text-sm'>
          No merchant data found. Set merchants on expenses via AI Chat ("that was from Zomato").
        </div>
      )}

      {merchants && merchants.map((m, i) => {
        const color = CATEGORY_COLORS_MAP[m.topCategory] ?? '#9d7fff';
        return (
          <Card key={m.merchant} style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.1)' }}>
            <CardContent className='p-3.5'>
              <div className='flex items-center gap-3'>
                <div className='w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shrink-0'
                  style={{ background: `${color}15`, border: `1px solid ${color}30`, color, fontFamily: '"Syne", sans-serif' }}>
                  {i + 1}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-sans text-sm font-semibold text-[#f0efff] truncate'>{m.merchant}</p>
                  <div className='flex items-center gap-2 mt-0.5'>
                    <span className='font-mono text-[9px] px-1.5 py-0.5 rounded' style={{ background: `${color}15`, color }}>
                      {m.topCategory}
                    </span>
                    <span className='font-mono text-[9px] text-[#4a4870]'>{m.visitCount} visits</span>
                    <span className='font-mono text-[9px] text-[#4a4870]'>avg {fmt(m.avgPerVisit)}</span>
                  </div>
                </div>
                <div className='text-right shrink-0'>
                  <p className='font-display text-base font-bold' style={{ color }}>{fmt(m.totalSpent)}</p>
                  <p className='font-mono text-[9px] text-[#4a4870]'>last {m.lastVisit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── AI Forecast Tab ──────────────────────────────────────────────────────────
function ForecastTab() {
  const fmt = useFmt();
  const { data: forecast, isLoading } = useCashFlowForecast(6);
  const [incomeModifier, setIncomeModifier] = useState<number>(0);

  if (isLoading) return <div className='h-64 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;

  if (!forecast || forecast.length === 0) {
    return <div className='text-center py-10 text-[#4a4870]'>Not enough data to generate forecast.</div>;
  }

  // Apply What-If modifier
  const chartData = forecast.map((f) => {
    const adjustedIncome = f.income + (f.income * incomeModifier) / 100;
    const adjustedNetFlow = adjustedIncome - f.predictedExpenses;
    return {
      month: f.month,
      income: adjustedIncome,
      expenses: f.predictedExpenses,
      recurring: f.recurringExpenses,
      variable: f.variableExpenses,
      netFlow: adjustedNetFlow,
      isForecast: f.isForecast,
    };
  });

  const tooltipStyle = {
    contentStyle: {
      background: '#0d0d1a', border: '1px solid rgba(124,92,252,0.2)',
      borderRadius: '10px', fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px', color: '#f0efff',
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={tooltipStyle.contentStyle} className='p-3'>
          <p className='font-bold mb-2 text-[#7c5cfc]'>
            {label} {data.isForecast ? '(Predicted)' : ''}
          </p>
          <div className='space-y-1'>
            <p className='flex justify-between gap-4'><span className='text-[#00ff87]'>Income:</span> <span>{fmt(data.income)}</span></p>
            <p className='flex justify-between gap-4'><span className='text-[#ff3b5c]'>Expenses:</span> <span>{fmt(data.expenses)}</span></p>
            <div className='pl-2 border-l border-[rgba(255,255,255,0.1)] my-1'>
              <p className='flex justify-between gap-4 text-[9px] text-[#8b89b0]'><span>Recurring:</span> <span>{fmt(data.recurring)}</span></p>
              <p className='flex justify-between gap-4 text-[9px] text-[#8b89b0]'><span>Variable:</span> <span>{fmt(data.variable)}</span></p>
            </div>
            <p className='flex justify-between gap-4 pt-1 border-t border-[rgba(255,255,255,0.1)] mt-1 font-bold'>
              <span className={data.netFlow >= 0 ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}>Net Flow:</span> 
              <span className={data.netFlow >= 0 ? 'text-[#00ff87]' : 'text-[#ff3b5c]'}>{fmt(data.netFlow)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className='space-y-4'>
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardHeader className='pb-2 px-4 pt-4'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-display text-[#f0efff] flex items-center gap-2'>
              <TrendingUp className='w-4 h-4 text-[#7c5cfc]' /> 6-Month Cash Flow Forecast
            </CardTitle>
            <Badge className='font-mono text-[9px]' style={{ background: 'rgba(124,92,252,0.1)', color: '#9d7fff', border: '1px solid rgba(124,92,252,0.2)' }}>
              AI Regression Model
            </Badge>
          </div>
        </CardHeader>
        <CardContent className='px-2 pb-4'>
          <div className='h-64 w-full mt-4'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id='colorNetFlowPos' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#00ff87' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#00ff87' stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id='colorNetFlowNeg' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#ff3b5c' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#ff3b5c' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='rgba(124,92,252,0.08)' vertical={false} />
                <XAxis dataKey='month' tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke='rgba(255,255,255,0.1)' />
                {/* Find the boundary index where prediction starts */}
                {chartData.findIndex(d => d.isForecast) !== -1 && (
                  <ReferenceLine x={chartData[chartData.findIndex(d => d.isForecast)].month} stroke='#9d7fff' strokeDasharray='3 3' label={{ position: 'top', value: 'Prediction', fill: '#9d7fff', fontSize: 10 }} />
                )}
                
                <Area type='monotone' dataKey='netFlow' 
                  stroke='#7c5cfc' 
                  fill='url(#colorNetFlowPos)' strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* What-if scenario builder */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <CardHeader className='pb-2 px-4 pt-4'>
          <CardTitle className='text-sm font-display text-[#00d4ff] flex items-center gap-2'>
            <LineChart className='w-4 h-4' /> "What-if" Scenario Planner
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4 space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>Simulate Income Change</Label>
              <span className='font-mono text-xs font-bold' style={{ color: incomeModifier > 0 ? '#00ff87' : incomeModifier < 0 ? '#ff3b5c' : '#f0efff' }}>
                {incomeModifier > 0 ? '+' : ''}{incomeModifier}%
              </span>
            </div>
            <input type='range' min='-50' max='50' step='5' value={incomeModifier} onChange={(e) => setIncomeModifier(parseInt(e.target.value, 10))}
              className='w-full accent-[#00d4ff]' />
            <div className='flex justify-between text-[9px] text-[#4a4870] font-mono'>
              <span>-50%</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
            <p className='text-xs text-[#8b89b0]'>Adjust the slider to see how a change in your income affects your future net cash flow.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── AI Stats Tab ─────────────────────────────────────────────────────────────
function AIStatsTab() {
  const { data: stats, isLoading: statsLoading } = useToolStats(30);
  const { data: log, isLoading: logLoading } = useToolLog(15);

  return (
    <div className='space-y-4'>
      {statsLoading ? (
        <div className='h-32 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />
      ) : stats && (
        <>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {[
              { label: 'Total Tool Calls', value: String(stats.totalCalls), color: '#7c5cfc' },
              { label: 'Error Rate', value: `${stats.errorRate}%`, color: stats.errorRate > 5 ? '#ff2d78' : '#00ff87' },
              { label: 'Unique Tools', value: String(stats.byTool.length), color: '#00d4ff' },
            ].map((m) => (
              <Card key={m.label} style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${m.color}20` }}>
                <CardContent className='p-3'>
                  <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>{m.label}</p>
                  <p className='font-display text-xl font-black' style={{ color: m.color }}>{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {stats.byTool.length > 0 && (
            <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
              <CardHeader className='pb-2 px-4 pt-4'>
                <CardTitle className='text-sm font-display text-[#f0efff]'>Tool Usage (30 days)</CardTitle>
              </CardHeader>
              <CardContent className='px-4 pb-4 space-y-2'>
                {stats.byTool.map((t) => (
                  <div key={t.toolName} className='flex items-center justify-between p-2.5 rounded-xl'
                    style={{ background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.1)' }}>
                    <div>
                      <p className='font-mono text-xs text-[#f0efff]'>{t.toolName}</p>
                      <p className='font-mono text-[9px] text-[#4a4870]'>{t.avgDurationMs}ms avg</p>
                    </div>
                    <div className='flex items-center gap-3 text-right'>
                      <span className='font-mono text-[10px] text-[#4a4870]'>{t.count}×</span>
                      <span className='font-mono text-[10px]' style={{ color: t.successRate >= 95 ? '#00ff87' : '#ffb830' }}>
                        {t.successRate}% ok
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {logLoading ? (
        <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />
      ) : log && log.length > 0 && (
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='text-sm font-display text-[#f0efff]'>Recent AI Tool Calls</CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 space-y-1.5'>
            {log.map((entry) => (
              <div key={entry.id} className='flex items-center justify-between p-2 rounded-xl hover:bg-[rgba(124,92,252,0.04)]'>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='w-1.5 h-1.5 rounded-full shrink-0'
                    style={{ background: entry.success ? '#00ff87' : '#ff3b5c', boxShadow: `0 0 5px ${entry.success ? '#00ff87' : '#ff3b5c'}` }} />
                  <span className='font-mono text-[10px] text-[#f0efff] truncate'>{entry.toolName}</span>
                </div>
                <div className='flex items-center gap-3 shrink-0'>
                  {entry.durationMs !== null && (
                    <span className='font-mono text-[9px] text-[#4a4870]'>{entry.durationMs}ms</span>
                  )}
                  <span className='font-mono text-[9px] text-[#4a4870]'>
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('networth');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'networth', label: 'Net Worth', icon: Wallet },
    { id: 'zero-budget', label: 'Zero Budget', icon: BarChart2 },
    { id: 'tax', label: 'Tax Summary', icon: FileText },
    { id: 'merchants', label: 'Merchants', icon: Store },
    { id: 'forecast', label: 'Forecast', icon: LineChart },
    { id: 'ai-stats', label: 'AI Stats', icon: Cpu },
  ];

  return (
    <div className='flex flex-col h-full' style={{ background: '#080810', overflow: 'hidden' }}>
      <div className='shrink-0' style={{ borderBottom: '1px solid rgba(124,92,252,0.1)', background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <div className='px-4 sm:px-8 py-4'>
          <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>Finance</h1>
          <p className='font-mono text-[10px] text-[#4a4870]'>Advanced financial tools &amp; analytics</p>
        </div>
        <div className='flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide'>
          {tabs.map((t) => (
            <TabPill key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
          ))}
        </div>
      </div>

      <div className='flex-1 min-h-0' style={{ overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div className='p-4 sm:p-6 pb-8'>
          {activeTab === 'networth' && <NetWorthTab />}
          {activeTab === 'zero-budget' && <ZeroBudgetTab />}
          {activeTab === 'tax' && <TaxTab />}
          {activeTab === 'merchants' && <MerchantsTab />}
          {activeTab === 'forecast' && <ForecastTab />}
          {activeTab === 'ai-stats' && <AIStatsTab />}
        </div>
      </div>
    </div>
  );
}