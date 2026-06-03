import { useState } from 'react';
import {
  useAnomalies,
  useForecast,
  useComparePeriods,
  useBudgetRecommendations,
  useSpendingPatterns,
  useHealthScore,
  useWeeklySummary,
} from '@/services/insights.service';
import { useExpenses, useExpenseStats } from '@/services/expenses.service';
import { useFmt } from '@/hooks/useCurrency';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Brain,
  BarChart2,
  Calendar,
  Lightbulb,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

const COLORS = [
  '#7c5cfc', '#00d4ff', '#00ff87', '#ffb830',
  '#ff2d78', '#9d7fff', '#5b8fff', '#4a4870',
];

const CATEGORY_COLORS: Record<string, string> = {
  DINING: '#ff2d78', SHOPPING: '#9d7fff', TRANSPORT: '#00d4ff',
  ENTERTAINMENT: '#ffb830', UTILITIES: '#00ff87', HEALTH: '#ff6b9d',
  EDUCATION: '#5b8fff', OTHER: '#4a4870',
};

type Tab = 'overview' | 'forecast' | 'compare' | 'anomalies' | 'patterns' | 'health' | 'recommendations';

// ─── Tab Pill ─────────────────────────────────────────────────────────────────
function TabPill({ label, icon: Icon, active, onClick }: {
  id: Tab; label: string; icon: React.ElementType; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className='flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider whitespace-nowrap shrink-0 transition-all'
      style={{
        background: active ? 'rgba(124,92,252,0.2)' : 'transparent',
        border: `1px solid ${active ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.12)'}`,
        color: active ? '#9d7fff' : '#4a4870',
        boxShadow: active ? '0 0 12px rgba(124,92,252,0.15)' : 'none',
      }}
    >
      <Icon className='w-3 h-3' />
      {label}
    </button>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const fmt = useFmt();
  const now = new Date();
  
  // Date ranges
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  
  const firstDayThisYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const lastDayThisYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];

  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
  const monthEnd = lastDayThisMonth;

  // Fetch stats for specific periods
  const { data: thisMonthStats, isLoading: tmLoading } = useExpenseStats(firstDayThisMonth, lastDayThisMonth);
  const { data: lastMonthStats, isLoading: lmLoading } = useExpenseStats(firstDayLastMonth, lastDayLastMonth);
  const { data: thisYearStats, isLoading: tyLoading } = useExpenseStats(firstDayThisYear, lastDayThisYear);

  // Fetch 6-month trend data
  const { isLoading: statsLoading } = useExpenseStats(sixAgo, monthEnd);
  const { data: expData, isLoading: expLoading } = useExpenses({ from: sixAgo, to: monthEnd });
  const { data: weekly } = useWeeklySummary();

  const isLoading = statsLoading || expLoading || tmLoading || lmLoading || tyLoading;
  // statsData is already used directly via destructuring; no intermediate variable needed
  const expenses = expData?.expenses ?? [];

  const monthlyMap: Record<string, number> = {};
  for (const exp of expenses) {
    const key = exp.date.slice(0, 7);
    monthlyMap[key] = (monthlyMap[key] ?? 0) + exp.convertedAmount;
  }
  const trendData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleString('en', { month: 'short' }),
      amount: Math.round(amount),
    }));

  const pieData = (thisMonthStats?.byCategory ?? []).map((c, i) => ({
    name: c.category,
    value: Math.round(c.amount),
    color: CATEGORY_COLORS[c.category] ?? COLORS[i % COLORS.length],
  }));

  const tooltipStyle = {
    contentStyle: {
      background: '#0d0d1a',
      border: '1px solid rgba(124,92,252,0.2)',
      borderRadius: '10px',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      color: '#f0efff',
    },
  };

  const currentDay = Math.max(1, now.getDate());
  const dailyAvg = (thisMonthStats?.total ?? 0) / currentDay;

  return (
    <div className='space-y-4'>
      {/* Summary cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        {[
          { label: 'This Month', value: fmt(thisMonthStats?.total ?? 0), color: '#00d4ff' },
          { label: 'Last Month', value: fmt(lastMonthStats?.total ?? 0), color: '#7c5cfc' },
          { label: 'This Year', value: fmt(thisYearStats?.total ?? 0), color: '#ffb830' },
          { label: 'Daily Avg (Mo)', value: fmt(Math.round(dailyAvg)), color: '#00ff87' },
          { label: 'Transactions (Mo)', value: String(thisMonthStats?.count ?? 0), color: '#9d7fff' },
          { label: 'Avg / Txn (Mo)', value: fmt(Math.round(thisMonthStats?.average ?? 0)), color: '#ff2d78' },
          { label: 'Top Category (Mo)', value: thisMonthStats?.byCategory[0]?.category ?? '—', color: '#ffb830' },
          { label: 'Top Category (Yr)', value: thisYearStats?.byCategory[0]?.category ?? '—', color: '#00d4ff' },
        ].map((card) => (
          <Card
            key={card.label}
            className='relative overflow-hidden'
            style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${card.color}20` }}
          >
            <div className='absolute top-[-20px] right-[-20px] w-20 h-20 rounded-full pointer-events-none'
              style={{ background: `radial-gradient(circle, ${card.color}25, transparent 70%)` }} />
            <CardContent className='p-3 sm:p-4'>
              <p className='font-mono text-[9px] text-[#4a4870] uppercase tracking-wider mb-2'>{card.label}</p>
              {isLoading ? (
                <div className='h-7 rounded-lg bg-[rgba(124,92,252,0.08)] shimmer' />
              ) : (
                <p className='font-display text-lg font-extrabold tracking-tight truncate'
                  style={{ color: card.color }}>{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly summary strip */}
      {weekly && (
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <Calendar className='w-3.5 h-3.5 text-[#7c5cfc]' />
              <span className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                This Week · {weekly.fromDate} – {weekly.toDate}
              </span>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              <div>
                <p className='font-mono text-[9px] text-[#4a4870]'>Spent</p>
                <p className='font-display text-xl font-bold text-[#7c5cfc]'>{fmt(weekly.total)}</p>
              </div>
              <div>
                <p className='font-mono text-[9px] text-[#4a4870]'>Transactions</p>
                <p className='font-display text-xl font-bold text-[#00d4ff]'>{weekly.count}</p>
              </div>
              {weekly.topCategory && (
                <div>
                  <p className='font-mono text-[9px] text-[#4a4870]'>Top Category</p>
                  <p className='font-display text-sm font-bold text-[#ffb830]'>{weekly.topCategory}</p>
                  <p className='font-mono text-[10px] text-[#4a4870]'>{fmt(weekly.topCategoryAmount)}</p>
                </div>
              )}
              {weekly.vsLastWeekPct !== null && (
                <div>
                  <p className='font-mono text-[9px] text-[#4a4870]'>vs Last Week</p>
                  <p className='font-display text-xl font-bold flex items-center gap-1'
                    style={{ color: weekly.vsLastWeekPct > 0 ? '#ff2d78' : '#00ff87' }}>
                    {weekly.vsLastWeekPct > 0 ? <ArrowUpRight className='w-4 h-4' /> : <ArrowDownRight className='w-4 h-4' />}
                    {Math.abs(weekly.vsLastWeekPct)}%
                  </p>
                </div>
              )}
            </div>
            {weekly.budgetWarnings.length > 0 && (
              <div className='mt-3 flex flex-wrap gap-2'>
                {weekly.budgetWarnings.map((w) => (
                  <span key={w.category}
                    className='font-mono text-[9px] px-2 py-1 rounded-full flex items-center gap-1'
                    style={{ background: 'rgba(255,184,48,0.1)', border: '1px solid rgba(255,184,48,0.25)', color: '#ffb830' }}>
                    <AlertTriangle className='w-2.5 h-2.5' />
                    {w.category} {w.percentage}%
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='flex items-center gap-2 text-[#f0efff] font-display text-sm'>
              <div className='w-0.5 h-4 rounded-sm' style={{ background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)' }} />
              6-Month Trend
            </CardTitle>
          </CardHeader>
          <CardContent className='px-2 pb-4'>
            {isLoading ? (
              <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />
            ) : trendData.length === 0 ? (
              <div className='h-48 flex items-center justify-center text-[#4a4870] text-sm'>No data yet</div>
            ) : (
              <ResponsiveContainer width='100%' height={190}>
                <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='rgba(124,92,252,0.08)' />
                  <XAxis dataKey='month' tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono"' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono"' }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
                  <Tooltip {...tooltipStyle} />
                  <Line type='monotone' dataKey='amount' stroke='#7c5cfc' strokeWidth={2.5}
                    dot={{ fill: '#7c5cfc', r: 3, strokeWidth: 2, stroke: '#080810' }}
                    activeDot={{ r: 5, fill: '#9d7fff', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='flex items-center gap-2 text-[#f0efff] font-display text-sm'>
              <div className='w-0.5 h-4 rounded-sm' style={{ background: 'linear-gradient(180deg, #ff2d78, #ffb830)' }} />
              This Month By Category
            </CardTitle>
          </CardHeader>
          <CardContent className='px-2 pb-4'>
            {pieData.length === 0 ? (
              <div className='h-48 flex items-center justify-center text-[#4a4870] text-sm'>No data yet</div>
            ) : (
              <>
                <ResponsiveContainer width='100%' height={150}>
                  <PieChart>
                    <Pie data={pieData} cx='50%' cy='50%' innerRadius={40} outerRadius={65} dataKey='value' paddingAngle={2}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className='space-y-1.5 mt-1 px-2'>
                  {pieData.slice(0, 4).map((d) => (
                    <div key={d.name} className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 rounded-sm shrink-0' style={{ background: d.color }} />
                        <span className='font-mono text-[10px] text-[#8b89b0]'>{d.name}</span>
                      </div>
                      <span className='font-mono text-[10px]' style={{ color: d.color }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      {thisMonthStats && thisMonthStats.byCategory.length > 0 && (
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='flex items-center gap-2 text-[#f0efff] font-display text-sm'>
              <div className='w-0.5 h-4 rounded-sm' style={{ background: 'linear-gradient(180deg, #00ff87, #00d4ff)' }} />
              This Month Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-5 space-y-4'>
            {thisMonthStats.byCategory.map((cat, i) => {
              const pct = thisMonthStats.total > 0 ? (cat.amount / thisMonthStats.total) * 100 : 0;
              const color = CATEGORY_COLORS[cat.category] ?? COLORS[i % COLORS.length];
              return (
                <div key={cat.category}>
                  <div className='flex items-center justify-between mb-1.5'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-sm shrink-0' style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                      <span className='font-sans text-sm text-[#d4d2f0]'>{cat.category}</span>
                      <span className='font-mono text-[10px] text-[#4a4870]'>{cat.count} txns</span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span className='font-mono text-[10px] text-[#4a4870]'>{Math.round(pct)}%</span>
                      <span className='font-display text-sm font-bold' style={{ color }}>{fmt(Math.round(cat.amount))}</span>
                    </div>
                  </div>
                  <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'rgba(124,92,252,0.08)' }}>
                    <div className='h-full rounded-full transition-all duration-700'
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}90)` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Forecast Tab ─────────────────────────────────────────────────────────────
function ForecastTab() {
  const fmt = useFmt();
  const { data: forecast, isLoading } = useForecast();

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;
  if (!forecast) return <div className='text-center py-12 text-[#4a4870]'>No forecast data</div>;

  const pctElapsed = Math.round((forecast.daysElapsed / forecast.daysInMonth) * 100);
  const vsLastMonth = forecast.vsLastMonthPct;
  const vsBudget = forecast.projectedVsBudgetPct;

  return (
    <div className='space-y-4'>
      {/* Main forecast card */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.15)' }}>
        <CardContent className='p-5'>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5'>
            <div>
              <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>Spent So Far</p>
              <p className='font-display text-2xl font-black text-[#7c5cfc]'>{fmt(forecast.spentSoFar)}</p>
            </div>
            <div>
              <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>Projected Total</p>
              <p className='font-display text-2xl font-black text-[#f0efff]'>{fmt(forecast.projectedTotal)}</p>
            </div>
            <div>
              <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>Daily Average</p>
              <p className='font-display text-2xl font-black text-[#00d4ff]'>{fmt(forecast.dailyAverage)}</p>
            </div>
          </div>

          {/* Month progress */}
          <div className='mb-4'>
            <div className='flex justify-between mb-1'>
              <span className='font-mono text-[10px] text-[#4a4870]'>Day {forecast.daysElapsed} of {forecast.daysInMonth}</span>
              <span className='font-mono text-[10px] text-[#4a4870]'>{forecast.daysRemaining} days remaining</span>
            </div>
            <div className='h-2 rounded-full overflow-hidden' style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className='h-full rounded-full' style={{ width: `${pctElapsed}%`, background: 'linear-gradient(90deg, #7c5cfc, #00d4ff)' }} />
            </div>
          </div>

          {/* Comparisons */}
          <div className='grid grid-cols-2 gap-3'>
            {vsLastMonth !== null && (
              <div className='p-3 rounded-xl' style={{ background: vsLastMonth > 0 ? 'rgba(255,45,120,0.06)' : 'rgba(0,255,135,0.06)', border: `1px solid ${vsLastMonth > 0 ? 'rgba(255,45,120,0.2)' : 'rgba(0,255,135,0.2)'}` }}>
                <p className='font-mono text-[9px] text-[#4a4870] mb-1'>vs Last Month</p>
                <p className='font-display text-lg font-bold flex items-center gap-1'
                  style={{ color: vsLastMonth > 0 ? '#ff2d78' : '#00ff87' }}>
                  {vsLastMonth > 0 ? <ArrowUpRight className='w-4 h-4' /> : <ArrowDownRight className='w-4 h-4' />}
                  {Math.abs(vsLastMonth)}%
                </p>
                <p className='font-mono text-[9px] text-[#4a4870]'>Last month: {fmt(forecast.lastMonthTotal)}</p>
              </div>
            )}
            {forecast.totalBudget > 0 && vsBudget !== null && (
              <div className='p-3 rounded-xl' style={{ background: vsBudget > 0 ? 'rgba(255,184,48,0.06)' : 'rgba(0,255,135,0.06)', border: `1px solid ${vsBudget > 0 ? 'rgba(255,184,48,0.2)' : 'rgba(0,255,135,0.2)'}` }}>
                <p className='font-mono text-[9px] text-[#4a4870] mb-1'>vs Total Budget</p>
                <p className='font-display text-lg font-bold flex items-center gap-1'
                  style={{ color: vsBudget > 0 ? '#ffb830' : '#00ff87' }}>
                  {vsBudget > 0 ? <ArrowUpRight className='w-4 h-4' /> : <ArrowDownRight className='w-4 h-4' />}
                  {Math.abs(vsBudget)}%
                </p>
                <p className='font-mono text-[9px] text-[#4a4870]'>Budget: {fmt(forecast.totalBudget)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Compare Tab ──────────────────────────────────────────────────────────────
function CompareTab() {
  const fmt = useFmt();
  const now = new Date();
  const currMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [p1From, setP1From] = useState(`${prevMonth}-01`);
  const [p1To, setP1To] = useState(`${prevMonth}-${new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate()}`);
  const [p2From, setP2From] = useState(`${currMonth}-01`);
  const [p2To, setP2To] = useState(now.toISOString().split('T')[0]);

  const { mutate: compare, data: result, isPending } = useComparePeriods();

  const run = () => compare({ period1From: p1From, period1To: p1To, period2From: p2From, period2To: p2To });

  return (
    <div className='space-y-4'>
      {/* Date inputs */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardContent className='p-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <p className='font-mono text-[10px] text-[#7c5cfc] uppercase tracking-widest'>Period 1</p>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='font-mono text-[9px] text-[#4a4870]'>From</Label>
                  <Input type='date' value={p1From} onChange={(e) => setP1From(e.target.value)}
                    className='h-9 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <Label className='font-mono text-[9px] text-[#4a4870]'>To</Label>
                  <Input type='date' value={p1To} onChange={(e) => setP1To(e.target.value)}
                    className='h-9 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <p className='font-mono text-[10px] text-[#00d4ff] uppercase tracking-widest'>Period 2</p>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='font-mono text-[9px] text-[#4a4870]'>From</Label>
                  <Input type='date' value={p2From} onChange={(e) => setP2From(e.target.value)}
                    className='h-9 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <Label className='font-mono text-[9px] text-[#4a4870]'>To</Label>
                  <Input type='date' value={p2To} onChange={(e) => setP2To(e.target.value)}
                    className='h-9 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]' style={{ colorScheme: 'dark' }} />
                </div>
              </div>
            </div>
          </div>
          <Button onClick={run} disabled={isPending} className='mt-4 w-full h-10 gap-2 font-display font-bold text-white'
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}>
            {isPending ? 'Comparing…' : 'Compare Periods'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className='space-y-4'>
          {/* Summary */}
          <div className='grid grid-cols-2 gap-3'>
            <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.2)' }}>
              <CardContent className='p-3'>
                <p className='font-mono text-[9px] text-[#7c5cfc] uppercase mb-1'>Period 1</p>
                <p className='font-display text-xl font-black text-[#f0efff]'>{fmt(result.period1.total)}</p>
                <p className='font-mono text-[10px] text-[#4a4870]'>{result.period1.count} transactions</p>
                <p className='font-mono text-[9px] text-[#4a4870]'>{result.period1.from} → {result.period1.to}</p>
              </CardContent>
            </Card>
            <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <CardContent className='p-3'>
                <p className='font-mono text-[9px] text-[#00d4ff] uppercase mb-1'>Period 2</p>
                <p className='font-display text-xl font-black text-[#f0efff]'>{fmt(result.period2.total)}</p>
                <p className='font-mono text-[10px] text-[#4a4870]'>{result.period2.count} transactions</p>
                <p className='font-mono text-[9px] text-[#4a4870]'>{result.period2.from} → {result.period2.to}</p>
              </CardContent>
            </Card>
          </div>

          {/* Overall diff */}
          <Card style={{
            background: result.direction === 'increased' ? 'rgba(255,45,120,0.05)' : result.direction === 'decreased' ? 'rgba(0,255,135,0.05)' : 'rgba(124,92,252,0.05)',
            border: `1px solid ${result.direction === 'increased' ? 'rgba(255,45,120,0.2)' : result.direction === 'decreased' ? 'rgba(0,255,135,0.2)' : 'rgba(124,92,252,0.2)'}`,
          }}>
            <CardContent className='p-4 flex items-center justify-between'>
              <div>
                <p className='font-mono text-[10px] text-[#4a4870] mb-1'>Overall Change</p>
                <p className='font-display text-2xl font-black flex items-center gap-2'
                  style={{ color: result.direction === 'increased' ? '#ff2d78' : result.direction === 'decreased' ? '#00ff87' : '#9d7fff' }}>
                  {result.direction === 'increased' ? <TrendingUp className='w-5 h-5' /> : result.direction === 'decreased' ? <TrendingDown className='w-5 h-5' /> : <Minus className='w-5 h-5' />}
                  {fmt(Math.abs(result.totalDiff))}
                </p>
              </div>
              {result.totalPctChange !== null && (
                <div className='text-right'>
                  <p className='font-mono text-[9px] text-[#4a4870]'>Change</p>
                  <p className='font-display text-3xl font-black'
                    style={{ color: result.direction === 'increased' ? '#ff2d78' : result.direction === 'decreased' ? '#00ff87' : '#9d7fff' }}>
                    {result.totalPctChange > 0 ? '+' : ''}{result.totalPctChange}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category breakdown */}
          <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
            <CardHeader className='pb-2 px-4 pt-4'>
              <CardTitle className='text-sm font-display text-[#f0efff]'>Category Changes</CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-4 space-y-3'>
              {result.categoryBreakdown.map((cat) => {
                const isUp = cat.diff > 0;
                const color = isUp ? '#ff2d78' : '#00ff87';
                return (
                  <div key={cat.category} className='flex items-center justify-between'>
                    <span className='font-sans text-sm text-[#f0efff]'>{cat.category}</span>
                    <div className='flex items-center gap-3 text-right'>
                      <span className='font-mono text-[10px] text-[#4a4870]'>{fmt(cat.period1)} → {fmt(cat.period2)}</span>
                      <span className='font-mono text-[10px] font-bold flex items-center gap-0.5' style={{ color, minWidth: 50 }}>
                        {isUp ? <ArrowUpRight className='w-3 h-3' /> : <ArrowDownRight className='w-3 h-3' />}
                        {cat.pctChange !== null ? `${Math.abs(cat.pctChange)}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Anomalies Tab ────────────────────────────────────────────────────────────
function AnomaliesTab() {
  const fmt = useFmt();
  const { data, isLoading } = useAnomalies();

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;

  const anomalies = data?.anomalies ?? [];

  if (anomalies.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='w-16 h-16 rounded-2xl flex items-center justify-center mb-4'
          style={{ background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.2)' }}>
          <ShieldCheck className='w-8 h-8 text-[#00ff87]' />
        </div>
        <p className='font-display text-lg font-bold text-[#f0efff] mb-2'>No Anomalies Detected</p>
        <p className='text-[#4a4870] text-sm'>Your spending looks normal compared to recent months.</p>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <p className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
        Compared to last 3-month average
      </p>
      {anomalies.map((a) => {
        const isCrit = a.severity === 'HIGH';
        const color = isCrit ? '#ff2d78' : '#ffb830';
        return (
          <Card key={a.category} style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${color}30` }}>
            <CardContent className='p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <AlertTriangle className='w-5 h-5' style={{ color }} />
                  </div>
                  <div>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='font-sans text-sm font-semibold text-[#f0efff]'>{a.category}</span>
                      <Badge className='font-mono text-[8px]'
                        style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {a.severity}
                      </Badge>
                    </div>
                    <p className='font-mono text-[10px] text-[#4a4870]'>
                      Current: {fmt(a.currentSpend)} · Avg: {fmt(a.historicalAvg)}
                    </p>
                  </div>
                </div>
                <div className='text-right shrink-0'>
                  <p className='font-display text-2xl font-black' style={{ color }}>+{a.percentageIncrease}%</p>
                  <p className='font-mono text-[9px] text-[#4a4870]'>above average</p>
                </div>
              </div>
              <div className='mt-3 h-1.5 rounded-full overflow-hidden' style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className='h-full rounded-full' style={{ width: `${Math.min((a.currentSpend / (a.historicalAvg * 2)) * 100, 100)}%`, background: color }} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Patterns Tab ─────────────────────────────────────────────────────────────
function PatternsTab() {
  const fmt = useFmt();
  const { data: patterns, isLoading } = useSpendingPatterns();

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;
  if (!patterns) return <div className='text-center py-12 text-[#4a4870]'>No pattern data</div>;

  return (
    <div className='space-y-4'>
      {/* Summary metrics */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        {[
          { label: 'Top Spending Day', value: patterns.topSpendingDayOfWeek, color: '#7c5cfc' },
          { label: 'Top Week of Month', value: `Week ${patterns.topSpendingWeekOfMonth}`, color: '#00d4ff' },
          { label: 'Daily Average', value: fmt(patterns.averageDailySpend), color: '#ffb830' },
        ].map((m) => (
          <Card key={m.label} style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${m.color}20` }}>
            <CardContent className='p-3'>
              <p className='font-mono text-[9px] text-[#4a4870] uppercase mb-1'>{m.label}</p>
              <p className='font-display text-lg font-bold' style={{ color: m.color }}>{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* High-spend days */}
      {patterns.highSpendDays.length > 0 && (
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='text-sm font-display text-[#f0efff] flex items-center gap-2'>
              <Zap className='w-4 h-4 text-[#ffb830]' /> High Spend Days
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 space-y-2'>
            {patterns.highSpendDays.map((d) => (
              <div key={d.date} className='flex items-center justify-between p-2.5 rounded-xl'
                style={{ background: 'rgba(255,184,48,0.05)', border: '1px solid rgba(255,184,48,0.12)' }}>
                <span className='font-mono text-[11px] text-[#f0efff]'>{d.date}</span>
                <span className='font-display text-sm font-bold text-[#ffb830]'>{fmt(d.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category trends */}
      {patterns.categoryTrends.length > 0 && (
        <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
          <CardHeader className='pb-2 px-4 pt-4'>
            <CardTitle className='text-sm font-display text-[#f0efff] flex items-center gap-2'>
              <Activity className='w-4 h-4 text-[#7c5cfc]' /> Category Trends
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 space-y-2'>
            {patterns.categoryTrends.map((t) => {
              const color = t.trend === 'INCREASING' ? '#ff2d78' : '#00ff87';
              const Icon = t.trend === 'INCREASING' ? TrendingUp : TrendingDown;
              return (
                <div key={t.category} className='flex items-center justify-between p-2.5 rounded-xl'
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className='flex items-center gap-2'>
                    <Icon className='w-4 h-4' style={{ color }} />
                    <span className='font-sans text-sm text-[#f0efff]'>{t.category}</span>
                  </div>
                  <span className='font-mono text-[11px] font-bold' style={{ color }}>
                    {t.trend === 'INCREASING' ? '+' : ''}{t.trendPct}%
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Health Score Tab ─────────────────────────────────────────────────────────
function HealthScoreTab() {
  const { data: health, isLoading } = useHealthScore();

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;
  if (!health) return <div className='text-center py-12 text-[#4a4870]'>No health data</div>;

  const gradeColors: Record<string, string> = {
    A: '#00ff87', B: '#00d4ff', C: '#ffb830', D: '#ff6b30', F: '#ff2d78',
  };
  const gradeColor = gradeColors[health.grade] ?? '#9d7fff';
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (health.score / 100) * circumference;

  return (
    <div className='space-y-4'>
      {/* Big score */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: `1px solid ${gradeColor}20` }}>
        <CardContent className='p-6 flex flex-col sm:flex-row items-center gap-6'>
          <div className='relative w-32 h-32 shrink-0'>
            <svg className='w-full h-full -rotate-90' viewBox='0 0 120 120'>
              <circle cx='60' cy='60' r='52' fill='none' stroke='rgba(255,255,255,0.06)' strokeWidth='10' />
              <circle cx='60' cy='60' r='52' fill='none' stroke={gradeColor} strokeWidth='10'
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap='round' style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 8px ${gradeColor}60)` }} />
            </svg>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <span className='font-display text-3xl font-black' style={{ color: gradeColor }}>{health.score}</span>
              <span className='font-mono text-[10px] text-[#4a4870]'>/ 100</span>
            </div>
          </div>
          <div className='flex-1 min-w-0 text-center sm:text-left'>
            <div className='flex items-center gap-3 justify-center sm:justify-start mb-2'>
              <span className='font-display text-4xl font-black' style={{ color: gradeColor }}>Grade {health.grade}</span>
            </div>
            <div className='space-y-1'>
              {health.recommendations.slice(0, 3).map((r, i) => (
                <p key={i} className='font-sans text-xs text-[#8b89b0] flex items-start gap-1.5'>
                  <Lightbulb className='w-3 h-3 text-[#ffb830] shrink-0 mt-0.5' /> {r}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <Card style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
        <CardHeader className='pb-2 px-4 pt-4'>
          <CardTitle className='text-sm font-display text-[#f0efff]'>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4 space-y-4'>
          {health.breakdown.map((b) => {
            const pct = Math.round((b.score / b.maxScore) * 100);
            const color = pct >= 80 ? '#00ff87' : pct >= 60 ? '#00d4ff' : pct >= 40 ? '#ffb830' : '#ff2d78';
            return (
              <div key={b.metric}>
                <div className='flex items-center justify-between mb-1'>
                  <div>
                    <span className='font-sans text-sm font-semibold text-[#f0efff]'>{b.metric}</span>
                    <p className='font-mono text-[10px] text-[#4a4870]'>{b.description}</p>
                  </div>
                  <span className='font-mono text-[11px] font-bold' style={{ color }}>{b.score}/{b.maxScore}</span>
                </div>
                <div className='h-1.5 rounded-full overflow-hidden' style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className='h-full rounded-full' style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Recommendations Tab ──────────────────────────────────────────────────────
function RecommendationsTab() {
  const fmt = useFmt();
  const { data: recs, isLoading } = useBudgetRecommendations();

  if (isLoading) return <div className='h-48 rounded-xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />;
  if (!recs || recs.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='text-4xl mb-3'>💡</div>
        <p className='font-display text-base font-bold text-[#f0efff] mb-1'>No Recommendations Yet</p>
        <p className='text-[#4a4870] text-sm'>Add expenses for at least 1 month to get budget recommendations.</p>
      </div>
    );
  }

  const actionConfig = {
    SET_NEW: { label: 'Set Budget', color: '#7c5cfc', icon: Target },
    INCREASE: { label: 'Increase', color: '#ffb830', icon: ArrowUpRight },
    DECREASE: { label: 'Decrease', color: '#00ff87', icon: ArrowDownRight },
    MAINTAIN: { label: 'Maintain', color: '#00d4ff', icon: ShieldCheck },
  };

  return (
    <div className='space-y-3'>
      <p className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>Based on 3 months of history</p>
      {recs.map((rec) => {
        const cfg = actionConfig[rec.action];
        const color = CATEGORY_COLORS[rec.category] ?? '#9d7fff';
        return (
          <Card key={rec.category} style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between mb-3'>
                <span className='font-sans text-sm font-semibold text-[#f0efff]'>{rec.category}</span>
                <span className='font-mono text-[9px] px-2 py-1 rounded-full flex items-center gap-1'
                  style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                  <cfg.icon className='w-2.5 h-2.5' /> {cfg.label}
                </span>
              </div>
              <div className='grid grid-cols-3 gap-2 text-center'>
                <div>
                  <p className='font-mono text-[9px] text-[#4a4870] mb-0.5'>Avg Spend</p>
                  <p className='font-mono text-xs text-[#f0efff]'>{fmt(rec.averageSpend)}</p>
                </div>
                <div>
                  <p className='font-mono text-[9px] text-[#4a4870] mb-0.5'>Current Budget</p>
                  <p className='font-mono text-xs' style={{ color }}>{rec.currentBudget !== null ? fmt(rec.currentBudget) : '—'}</p>
                </div>
                <div>
                  <p className='font-mono text-[9px] text-[#4a4870] mb-0.5'>Recommended</p>
                  <p className='font-mono text-xs font-bold' style={{ color: cfg.color }}>{fmt(rec.recommendedBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { data: health } = useHealthScore();
  const { data: weekly } = useWeeklySummary();
  const fmt = useFmt();

  const gradeColor = health
    ? ({ A: '#00ff87', B: '#00d4ff', C: '#ffb830', D: '#ff6b30', F: '#ff2d78' }[health.grade] ?? '#9d7fff')
    : '#4a4870';

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'compare', label: 'Compare', icon: Calendar },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
    { id: 'patterns', label: 'Patterns', icon: Activity },
    { id: 'health', label: 'Health', icon: Brain },
    { id: 'recommendations', label: 'Budget Tips', icon: Lightbulb },
  ];

  return (
    <div className='flex flex-col h-full' style={{ background: '#080810', overflow: 'hidden' }}>
      {/* Sticky header + tab pills */}
      <div className='shrink-0' style={{ borderBottom: '1px solid rgba(124,92,252,0.1)', background: 'rgba(8,8,16,0.97)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <div className='px-4 sm:px-8 py-4'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight flex items-center gap-2'>
                <Brain className='w-5 h-5 text-[#7c5cfc]' /> AI Insights
              </h1>
              <p className='font-mono text-[10px] text-[#4a4870] mt-0.5'>Powered by AI · Based on your real spending data</p>
            </div>
            {/* Quick KPI row */}
            <div className='flex items-center gap-3 shrink-0'>
              {health && (
                <div
                  className='flex items-center gap-2 px-3 py-1.5 rounded-xl'
                  style={{ background: `${gradeColor}10`, border: `1px solid ${gradeColor}25` }}
                >
                  <div
                    className='w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black'
                    style={{ background: gradeColor, color: '#080810' }}
                  >
                    {health.grade}
                  </div>
                  <div>
                    <p className='font-mono text-[8px] text-[#4a4870] uppercase leading-none'>Health</p>
                    <p className='font-display text-sm font-black leading-none' style={{ color: gradeColor }}>{health.score}/100</p>
                  </div>
                </div>
              )}
              {weekly && (
                <div
                  className='flex items-center gap-2 px-3 py-1.5 rounded-xl'
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}
                >
                  <Calendar className='w-4 h-4 text-[#00d4ff]' />
                  <div>
                    <p className='font-mono text-[8px] text-[#4a4870] uppercase leading-none'>This Week</p>
                    <p className='font-display text-sm font-black text-[#00d4ff] leading-none'>{fmt(weekly.total)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide'>
          {tabs.map((t) => (
            <TabPill key={t.id} id={t.id} label={t.label} icon={t.icon} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 min-h-0' style={{ overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div className='p-4 sm:p-6 pb-8'>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'forecast' && <ForecastTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'anomalies' && <AnomaliesTab />}
          {activeTab === 'patterns' && <PatternsTab />}
          {activeTab === 'health' && <HealthScoreTab />}
          {activeTab === 'recommendations' && <RecommendationsTab />}
        </div>
      </div>
    </div>
  );
}