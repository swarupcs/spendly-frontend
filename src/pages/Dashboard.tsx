import { useExpenses, useExpenseStats } from '@/services/expenses.service';
import { useBudgetOverview } from '@/services/budget.service';
import { useGoals } from '@/services/goals.service';
import { useAnomalies, useDismissAnomaly } from '@/services/anomaly.service';
import { useAuthStore } from '@/store/auth.store';
import { useFmt } from '@/hooks/useCurrency';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  BarChart2,
  Activity,
  Sparkles,
  Target,
  Trophy,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ListOrdered,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  FastForward,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'weekly' | 'monthly' | 'last_monthly' | 'yearly';

// ─── Period helpers ───────────────────────────────────────────────────────────

function getDateRange(period: Period): {
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  label: string;
  monthParam: string;
} {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'weekly') {
    const dayOfWeek = now.getDay(); // 0 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const prevMonday = new Date(monday);
    prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(sunday);
    prevSunday.setDate(sunday.getDate() - 7);
    
    return {
      from: fmt(monday),
      to: fmt(sunday),
      prevFrom: fmt(prevMonday),
      prevTo: fmt(prevSunday),
      label: `${monday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
      monthParam: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    };
  }

  if (period === 'yearly') {
    const jan1 = new Date(now.getFullYear(), 0, 1);
    const dec31 = new Date(now.getFullYear(), 11, 31);
    const prevJan1 = new Date(now.getFullYear() - 1, 0, 1);
    const prevDec31 = new Date(now.getFullYear() - 1, 11, 31);
    
    return {
      from: fmt(jan1),
      to: fmt(dec31),
      prevFrom: fmt(prevJan1),
      prevTo: fmt(prevDec31),
      label: String(now.getFullYear()),
      monthParam: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
    };
  }

  if (period === 'last_monthly') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevFirstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const prevLastDay = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    
    return {
      from: fmt(firstDay),
      to: fmt(lastDay),
      prevFrom: fmt(prevFirstDay),
      prevTo: fmt(prevLastDay),
      label: firstDay.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      monthParam: `${firstDay.getFullYear()}-${pad(firstDay.getMonth() + 1)}`,
    };
  }

  // monthly (default)
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevLastDay = new Date(now.getFullYear(), now.getMonth(), 0);
  
  return {
    from: fmt(firstDay),
    to: fmt(lastDay),
    prevFrom: fmt(prevFirstDay),
    prevTo: fmt(prevLastDay),
    label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    monthParam: `${now.getFullYear()}-${pad(now.getMonth() + 1)}`,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  DINING: '#ff2d78',
  SHOPPING: '#9d7fff',
  TRANSPORT: '#00d4ff',
  ENTERTAINMENT: '#ffb830',
  UTILITIES: '#00ff87',
  HEALTH: '#ff6b9d',
  EDUCATION: '#5b8fff',
  OTHER: '#4a4870',
};

const CATEGORY_EMOJI: Record<string, string> = {
  DINING: '🍽️',
  SHOPPING: '🛍️',
  TRANSPORT: '🚗',
  ENTERTAINMENT: '🎮',
  UTILITIES: '⚡',
  HEALTH: '💊',
  EDUCATION: '📚',
  OTHER: '📦',
};

const PIE_COLORS = [
  '#7c5cfc',
  '#00d4ff',
  '#00ff87',
  '#ffb830',
  '#ff2d78',
  '#9d7fff',
  '#5b8fff',
  '#4a4870',
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'last_monthly', label: 'Last Month' },
  { value: 'yearly', label: 'This Year' },
];

// ─── Period Dropdown ──────────────────────────────────────────────────────────

function PeriodDropdown({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = PERIOD_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase tracking-wider transition-all'
        style={{
          background: 'rgba(124,92,252,0.1)',
          border: '1px solid rgba(124,92,252,0.25)',
          color: '#9d7fff',
        }}
      >
        {current.label}
        <ChevronDown
          className='w-3 h-3 transition-transform'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className='fixed inset-0 z-10' onClick={() => setOpen(false)} />
          <div
            className='absolute right-0 top-full mt-1.5 z-20 rounded-xl overflow-hidden py-1 min-w-[140px]'
            style={{
              background: '#0d0d1a',
              border: '1px solid rgba(124,92,252,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className='w-full text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors'
                style={{
                  color: opt.value === value ? '#9d7fff' : '#8b89b0',
                  background:
                    opt.value === value
                      ? 'rgba(124,92,252,0.12)'
                      : 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(124,92,252,0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    opt.value === value
                      ? 'rgba(124,92,252,0.12)'
                      : 'transparent')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Chart Type Dropdown ──────────────────────────────────────────────────────

type ChartType = 'line' | 'bar' | 'area';

const CHART_TYPE_OPTIONS: { value: ChartType; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'bar', label: 'Bar' },
  { value: 'area', label: 'Area' },
];

function ChartTypeDropdown({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (t: ChartType) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = CHART_TYPE_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-[9px] uppercase tracking-wider transition-all'
        style={{
          background: 'rgba(124,92,252,0.1)',
          border: '1px solid rgba(124,92,252,0.25)',
          color: '#9d7fff',
        }}
      >
        {current.label}
        <ChevronDown
          className='w-3 h-3 transition-transform'
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <>
          <div className='fixed inset-0 z-10' onClick={() => setOpen(false)} />
          <div
            className='absolute right-0 top-full mt-1.5 z-20 rounded-xl overflow-hidden py-1 min-w-[100px]'
            style={{
              background: '#0d0d1a',
              border: '1px solid rgba(124,92,252,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {CHART_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className='w-full text-left px-3 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors'
                style={{
                  color: opt.value === value ? '#9d7fff' : '#8b89b0',
                  background:
                    opt.value === value
                      ? 'rgba(124,92,252,0.12)'
                      : 'transparent',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(124,92,252,0.08)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    opt.value === value
                      ? 'rgba(124,92,252,0.12)'
                      : 'transparent')
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (typeof previous !== 'number' || previous === 0) return null;
  const diff = current - previous;
  const pct = (diff / previous) * 100;
  if (pct === 0) return null;
  
  const isUp = pct > 0;
  // For expenses, going up is generally negative (red), going down is positive (green)
  const color = isUp ? '#ff2d78' : '#00ff87';
  const Icon = isUp ? TrendingUp : TrendingDown;
  
  return (
    <div className='flex items-center gap-1 shrink-0 bg-[rgba(13,13,26,0.5)] px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.05)]' style={{ color }}>
      <Icon className='w-3 h-3' />
      <span className='font-mono text-[9px] font-bold'>{Math.abs(pct).toFixed(1)}%</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent,
  isLoading,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub: React.ReactNode;
  accent: string;
  isLoading?: boolean;
  trend?: { current: number; previous: number };
}) {
  return (
    <Card
      className='relative overflow-hidden border-[rgba(124,92,252,0.12)] hover:border-[rgba(124,92,252,0.3)] transition-all duration-200 hover:shadow-[0_4px_30px_rgba(124,92,252,0.08)]'
      style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}
    >
      <div
        className='absolute top-[-30px] right-[-30px] w-[100px] h-[100px] rounded-full pointer-events-none'
        style={{
          background: `radial-gradient(circle, ${accent}20, transparent 70%)`,
        }}
      />
      <CardContent className='p-4 sm:p-5'>
        <div className='flex justify-between items-start mb-3'>
          <div
            className='w-9 h-9 rounded-xl flex items-center justify-center'
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}30`,
            }}
          >
            <Icon style={{ width: '16px', height: '16px', color: accent }} />
          </div>
          <span className='font-mono text-[9px] text-[#4a4870] uppercase tracking-wider text-right max-w-[50%]'>
            {label}
          </span>
        </div>

        {isLoading ? (
          <div className='h-7 rounded-lg bg-[rgba(124,92,252,0.08)] mb-2 shimmer' />
        ) : (
          <div 
            className='font-display text-xl sm:text-2xl font-extrabold tracking-tight mb-1.5 leading-none truncate'
            style={{ color: accent }}
          >
            {value}
          </div>
        )}
        <div className='font-mono text-[10px] text-[#4a4870] flex items-center gap-2 flex-wrap'>
          {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
          <div className='flex items-center gap-1.5 opacity-80'>
            {sub}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const fmt = useFmt();
  const [period, setPeriod] = useState<Period>('monthly');
  const [dayWiseChartType, setDayWiseChartType] = useState<ChartType>('bar');

  const {
    from,
    to,
    prevFrom,
    prevTo,
    label: periodLabel,
    monthParam,
  } = useMemo(() => getDateRange(period), [period]);

  const { data: budgetOverview } = useBudgetOverview(monthParam);
  const { data: goals } = useGoals();

  const { data: statsData, isLoading: statsLoading } = useExpenseStats(
    from,
    to,
  );
  
  const { data: prevStatsData, isLoading: prevStatsLoading } = useExpenseStats(
    prevFrom,
    prevTo,
  );
  const { data: anomalies } = useAnomalies();
  const { mutate: dismissAnomaly } = useDismissAnomaly();
  const { data: expData, isLoading: expLoading } = useExpenses({
    from,
    to,
    limit: 500,
  });

  const isLoading = statsLoading || expLoading;
  const expenses = useMemo(() => expData?.expenses ?? [], [expData?.expenses]);
  const stats = statsData;

  // Additional computed stats
  const daysInPeriod = useMemo(() => {
    const now = new Date();
    if (period === 'weekly') return 7;
    if (period === 'yearly') {
      const isLeap = (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0;
      return isLeap ? 366 : 365;
    }
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, [period]);

  const daysElapsed = useMemo(() => {
    const now = new Date();
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // Normalize to start of day
    now.setHours(0, 0, 0, 0);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    if (now > toDate) return daysInPeriod;
    if (now < fromDate) return 1;

    const diffTime = Math.abs(now.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(diffDays, daysInPeriod));
  }, [from, to, daysInPeriod]);

  const trueDailyAvg = (stats?.total ?? 0) / daysElapsed;
  const projectedTotal = trueDailyAvg * daysInPeriod;
  
  // Run Rate Chart Data
  const runRateData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    // Total budget limit
    const totalBudget = budgetOverview?.reduce((sum, b) => sum + b.limit, 0) || 0;

    // Group expenses by date string
    const dailySpend: Record<string, number> = {};
    for (const e of expenses) {
      dailySpend[e.date] = (dailySpend[e.date] || 0) + e.convertedAmount;
    }

    const data = [];
    let cumulative = 0;
    
    const fromDate = new Date(from);
    for (let i = 0; i < daysInPeriod; i++) {
      const current = new Date(fromDate);
      current.setDate(fromDate.getDate() + i);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
      
      const dayName = current.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      let actual = undefined;
      let projected = undefined;
      
      if (i < daysElapsed) {
        // past or today
        cumulative += (dailySpend[dateStr] || 0);
        actual = cumulative;
        if (i === daysElapsed - 1) {
          projected = cumulative; // connect the lines
        }
      } else {
        // future
        projected = cumulative + (trueDailyAvg * (i - daysElapsed + 1));
      }

      data.push({
        day: dayName,
        actual: Math.round(actual ?? 0) || undefined,
        projected: Math.round(projected ?? 0) || undefined,
        budget: totalBudget > 0 ? Math.round(totalBudget) : undefined,
      });
    }
    
    return data;
  }, [expenses, daysInPeriod, daysElapsed, trueDailyAvg, budgetOverview, from]);

  // Fixed vs Flex calculation
  const FIXED_CATEGORIES = ['UTILITIES', 'HEALTH', 'EDUCATION'];
  const fixedTotal = expenses
    .filter((e) => FIXED_CATEGORIES.includes(e.category))
    .reduce((sum, e) => sum + e.convertedAmount, 0);
  const flexTotal = (stats?.total ?? 0) - fixedTotal;
  const fixedPct = stats?.total ? (fixedTotal / stats.total) * 100 : 0;
  const flexPct = stats?.total ? (flexTotal / stats.total) * 100 : 0;
  
  let maxTxn = 0;
  let minTxn = Infinity;
  for (const e of expenses) {
    if (e.convertedAmount > maxTxn) maxTxn = e.convertedAmount;
    if (e.convertedAmount < minTxn) minTxn = e.convertedAmount;
  }
  if (minTxn === Infinity) minTxn = 0;

  const topCategory = stats?.byCategory?.[0];
  const lowestCategory = stats?.byCategory?.[stats.byCategory.length - 1];

  // Top Merchants / Vendors
  const topMerchants = useMemo(() => {
    if (!expenses) return [];
    const merchantMap: Record<string, { count: number; total: number }> = {};
    
    for (const e of expenses) {
      // Normalize merchant name slightly
      const name = e.title.trim();
      if (!name) continue;
      
      // Use lowercase for grouping
      const key = name.toLowerCase();
      if (!merchantMap[key]) {
        merchantMap[key] = { count: 0, total: 0 };
      }
      merchantMap[key].count += 1;
      merchantMap[key].total += e.convertedAmount;
    }
    
    // Convert to array and sort by total amount
    const sorted = Object.entries(merchantMap)
      .map(([key, data]) => ({ name: key, ...data }))
      .sort((a, b) => b.total - a.total);
      
    // Format names (capitalize first letter of each word)
    return sorted.slice(0, 5).map(m => {
      const formattedName = m.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { ...m, name: formattedName };
    });
  }, [expenses]);

  // Build bar chart data — group by date (day for week, month for year, day for month)
  const barData = useMemo(() => {
    if (period === 'yearly') {
      const mm: Record<string, number> = {};
      for (const e of expenses) {
        const key = e.date.slice(0, 7); // YYYY-MM
        mm[key] = (mm[key] ?? 0) + e.convertedAmount;
      }
      return Object.entries(mm)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, amt]) => ({
          date: new Date(k + '-01').toLocaleString('en', { month: 'short' }),
          amount: Math.round(amt),
        }));
    }
    // weekly or monthly — group by day
    return expenses.slice(0, period === 'weekly' ? 7 : 14).map((e) => ({
      date: e.date.slice(5), // MM-DD
      amount: Math.round(e.convertedAmount),
    }));
  }, [expenses, period]);

  const dayWiseTotals = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    for (const e of expenses) {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.convertedAmount;
    }
    return Object.entries(dailyMap)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB)) // oldest first for chart
      .map(([date, amount]) => {
        const d = new Date(date);
        const shortDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });
        return { date: shortDate, amount: Math.round(amount) };
      });
  }, [expenses]);

  const pieData = (stats?.byCategory ?? []).map((c, i) => ({
    name: c.category,
    value: Math.round(c.amount),
    color: PIE_COLORS[i % PIE_COLORS.length],
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
    cursor: { fill: 'rgba(124,92,252,0.05)' },
  };

  return (
    <div
      className='flex flex-col h-full'
      style={{ background: '#080810', overflow: 'hidden' }}
    >
      {/* ── Sticky Header ── */}
      <div
        className='shrink-0 px-4 sm:px-8 py-4 sm:py-5'
        style={{
          borderBottom: '1px solid rgba(124,92,252,0.1)',
          background: 'rgba(8,8,16,0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}
      >
        <div className='flex items-start justify-between gap-3'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <Sparkles className='w-3.5 h-3.5 text-[#7c5cfc]' />
              <span className='font-mono text-[9px] text-[#4a4870] uppercase tracking-[0.15em]'>
                {periodLabel}
              </span>
            </div>
            <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>
              {user ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Dashboard'}
            </h1>
          </div>

          <div className='flex items-center gap-3 mt-1'>
            {/* Period dropdown */}
            <PeriodDropdown value={period} onChange={setPeriod} />

            {/* Live indicator */}
            <div
              className='flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl'
              style={{
                background: 'rgba(0,255,135,0.07)',
                border: '1px solid rgba(0,255,135,0.2)',
              }}
            >
              <div
                className='w-1.5 h-1.5 rounded-full pulse-dot'
                style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }}
              />
              <span className='font-mono text-[9px] sm:text-[10px] text-[#00ff87]'>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div
        className='flex-1 min-h-0'
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className='p-4 sm:p-6 space-y-4 pb-6'>
          {/* ── Period indicator strip ── */}
          <div
            className='flex items-center gap-2 px-3 py-2 rounded-xl'
            style={{
              background: 'rgba(124,92,252,0.06)',
              border: '1px solid rgba(124,92,252,0.1)',
            }}
          >
            <div
              className='w-1 h-4 rounded-sm shrink-0'
              style={{
                background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)',
              }}
            />
            <span className='font-mono text-[10px] text-[#8b89b0]'>
              Showing data for{' '}
              <span className='text-[#9d7fff]'>
                {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
              </span>{' '}
              ·{' '}
              <span className='text-[#4a4870]'>
                {from} → {to}
              </span>
            </span>
          </div>

          {/* ── Anomaly Alerts ── */}
          {anomalies && anomalies.length > 0 && (
            <div className='space-y-3'>
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className='relative p-4 rounded-xl flex items-start gap-3 border transition-all duration-300'
                  style={{
                    background: 'rgba(255,184,48,0.06)',
                    borderColor: 'rgba(255,184,48,0.2)',
                    boxShadow: '0 4px 20px rgba(255,184,48,0.05)',
                  }}
                >
                  <div
                    className='w-8 h-8 rounded-full flex items-center justify-center shrink-0'
                    style={{ background: 'rgba(255,184,48,0.15)' }}
                  >
                    <Sparkles className='w-4 h-4 text-[#ffb830]' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className='font-display text-[#ffb830] font-semibold text-sm'>
                        Spending Spike Detected
                      </h4>
                      <button
                        onClick={() => dismissAnomaly(anomaly.id)}
                        className='text-[#8b89b0] hover:text-[#f0efff] p-1 rounded-md hover:bg-[rgba(255,255,255,0.1)] transition-colors'
                        title='Dismiss Alert'
                      >
                        <X className='w-3.5 h-3.5' />
                      </button>
                    </div>
                    <p className='text-sm text-[#f0efff] leading-relaxed opacity-90'>
                      {anomaly.explanation}
                    </p>
                    <div className='mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(255,184,48,0.1)] border border-[rgba(255,184,48,0.2)]'>
                      <span className='font-mono text-[10px] text-[#ffb830] font-medium'>
                        {anomaly.category}
                      </span>
                      <span className='text-[#8b89b0] text-[10px]'>•</span>
                      <span className='font-mono text-[10px] text-[#ffb830] font-medium'>
                        +{anomaly.percentage}% vs avg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <StatCard
              label='Total Spent'
              value={fmt(stats?.total ?? 0)}
              icon={DollarSign}
              sub='Overall total'
              accent='#7c5cfc'
              isLoading={isLoading}
              trend={statsData && prevStatsData ? { current: statsData.total, previous: prevStatsData.total } : undefined}
            />
            <StatCard
              label='Transactions'
              value={String(stats?.count ?? 0)}
              icon={ListOrdered}
              sub='Total entries'
              accent='#00d4ff'
              isLoading={isLoading}
              trend={statsData && prevStatsData ? { current: statsData.count, previous: prevStatsData.count } : undefined}
            />
            <StatCard
              label='Daily Avg'
              value={fmt(trueDailyAvg)}
              icon={Calendar}
              sub='Per day (run rate)'
              accent='#00ff87'
              isLoading={isLoading}
            />
            <StatCard
              label='Avg / Txn'
              value={fmt(stats?.average ?? 0)}
              icon={BarChart2}
              sub='Per transaction'
              accent='#ff2d78'
              isLoading={isLoading}
            />
            <StatCard
              label='Top Category'
              value={topCategory?.category ?? '—'}
              icon={Activity}
              sub={`${fmt(topCategory?.amount ?? 0)}`}
              accent='#ffb830'
              isLoading={isLoading}
            />
            <StatCard
              label='Lowest Category'
              value={lowestCategory?.category ?? '—'}
              icon={Activity}
              sub={`${fmt(lowestCategory?.amount ?? 0)}`}
              accent='#9d7fff'
              isLoading={isLoading}
            />
            <StatCard
              label='Largest Expense'
              value={fmt(maxTxn)}
              icon={ArrowUpCircle}
              sub='Single max'
              accent='#ff6b9d'
              isLoading={isLoading}
            />
            <StatCard
              label='Smallest Expense'
              value={fmt(minTxn)}
              icon={ArrowDownCircle}
              sub='Single min'
              accent='#5b8fff'
              isLoading={isLoading}
            />
            <StatCard
              label='Projected Spend'
              value={fmt(projectedTotal)}
              icon={FastForward}
              sub='End of period est.'
              accent='#7c5cfc'
              isLoading={isLoading}
            />
            <StatCard
              label='Fixed Costs'
              value={fmt(fixedTotal)}
              icon={Lock}
              sub={`${Math.round((fixedTotal / (stats?.total || 1)) * 100)}% of total`}
              accent='#00d4ff'
              isLoading={isLoading}
            />
          </div>

          {/* ── Discretionary vs Fixed ── */}
          {!isLoading && expenses.length > 0 && (
            <Card
              className='border-[rgba(124,92,252,0.12)] mb-4'
              style={{
                background: 'rgba(13,13,26,0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <CardContent className='p-4 sm:p-5'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-display text-[#f0efff] text-sm font-semibold flex items-center gap-2'>
                    <div className='w-0.5 h-4 rounded-sm' style={{ background: 'linear-gradient(180deg, #00d4ff, #ff2d78)' }} />
                    Discretionary vs. Fixed
                  </h3>
                </div>

                <div className='relative h-4 rounded-full overflow-hidden flex' style={{ background: 'rgba(124,92,252,0.1)' }}>
                  <div
                    className='h-full transition-all duration-500'
                    style={{ width: `${fixedPct}%`, background: 'linear-gradient(90deg, #00d4ff, #00ff87)' }}
                  />
                  <div
                    className='h-full transition-all duration-500'
                    style={{ width: `${flexPct}%`, background: 'linear-gradient(90deg, #ff2d78, #ffb830)' }}
                  />
                </div>

                <div className='flex items-center justify-between mt-3 px-1'>
                  <div className='flex flex-col'>
                    <span className='flex items-center gap-1.5 font-mono text-[10px] text-[#4a4870] uppercase tracking-wider mb-1'>
                      <div className='w-2 h-2 rounded-full' style={{ background: '#00d4ff' }} />
                      Fixed Costs
                    </span>
                    <span className='font-display text-[#00ff87] font-semibold'>{fmt(fixedTotal)} <span className='text-[10px] text-[#4a4870] font-mono'>({Math.round(fixedPct)}%)</span></span>
                  </div>
                  
                  <div className='flex flex-col text-right items-end'>
                    <span className='flex items-center gap-1.5 font-mono text-[10px] text-[#4a4870] uppercase tracking-wider mb-1'>
                      <div className='w-2 h-2 rounded-full' style={{ background: '#ff2d78' }} />
                      Discretionary
                    </span>
                    <span className='font-display text-[#ffb830] font-semibold'>{fmt(flexTotal)} <span className='text-[10px] text-[#4a4870] font-mono'>({Math.round(flexPct)}%)</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Budget Overview (always current month) ── */}
          {budgetOverview && budgetOverview.length > 0 && (
            <Card
              className='border-[rgba(124,92,252,0.12)]'
              style={{
                background: 'rgba(13,13,26,0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <CardHeader className='pb-2 px-4 pt-4'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                    <div
                      className='w-0.5 h-4 rounded-sm'
                      style={{
                        background: 'linear-gradient(180deg, #7c5cfc, #ffb830)',
                      }}
                    />
                    <Target className='w-3.5 h-3.5 text-[#7c5cfc]' />
                    Budget Overview
                    <span className='font-mono text-[9px] text-[#4a4870] font-normal'>
                      (current month)
                    </span>
                  </CardTitle>
                  <Link
                    to='/budget'
                    className='flex items-center gap-1 font-mono text-[10px] text-[#7c5cfc] hover:text-[#9d7fff] transition-colors'
                  >
                    Manage <ArrowRight className='w-3 h-3' />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className='px-4 pb-4 space-y-3'>
                {budgetOverview.slice(0, 4).map((b) => {
                  const pct = Math.min(b.percentage, 100);
                  const barColor = b.isOverBudget
                    ? '#ff2d78'
                    : b.percentage >= 80
                      ? '#ffb830'
                      : '#00ff87';
                  return (
                    <div key={b.id}>
                      <div className='flex items-center justify-between mb-1'>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-sm'>
                            {CATEGORY_EMOJI[b.category] ?? '📦'}
                          </span>
                          <span className='font-sans text-[12px] font-medium text-[#f0efff]'>
                            {b.category}
                          </span>
                          {b.isOverBudget && (
                            <AlertTriangle className='w-3 h-3 text-[#ff2d78]' />
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-mono text-[10px] text-[#8b89b0]'>
                            {fmt(b.spent)} / {fmt(b.limit)}
                          </span>
                          <span
                            className='font-mono text-[10px] font-bold'
                            style={{ color: barColor }}
                          >
                            {Math.round(b.percentage)}%
                          </span>
                        </div>
                      </div>
                      <div
                        className='h-1.5 rounded-full overflow-hidden'
                        style={{ background: 'rgba(124,92,252,0.1)' }}
                      >
                        <div
                          className='h-full rounded-full transition-all duration-500'
                          style={{
                            width: `${pct}%`,
                            background: b.isOverBudget
                              ? 'linear-gradient(90deg, #ff2d78, #ff6b6b)'
                              : b.percentage >= 80
                                ? 'linear-gradient(90deg, #ffb830, #ff6b30)'
                                : 'linear-gradient(90deg, #00ff87, #00d4ff)',
                            boxShadow: `0 0 8px ${barColor}60`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── Goals Overview ── */}
          {goals &&
            goals.length > 0 &&
            (() => {
              const topGoals = goals.slice(0, 3);
              const completedCount = goals.filter((g) => g.isCompleted).length;
              return (
                <Card
                  className='border-[rgba(124,92,252,0.12)]'
                  style={{
                    background: 'rgba(13,13,26,0.7)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <CardHeader className='pb-2 px-4 pt-4'>
                    <CardTitle className='flex items-center justify-between text-[#f0efff] font-display text-sm font-semibold'>
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-0.5 h-4 rounded-sm'
                          style={{
                            background:
                              'linear-gradient(180deg, #ffb830, #00ff87)',
                          }}
                        />
                        <Trophy className='w-3.5 h-3.5 text-[#ffb830]' />
                        Financial Goals
                      </div>
                      <Link
                        to='/goals'
                        className='flex items-center gap-1 font-mono text-[10px] text-[#4a4870] hover:text-[#9d7fff] transition-colors'
                      >
                        {completedCount}/{goals.length} done{' '}
                        <ArrowRight className='h-3 w-3' />
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='px-4 pb-4 space-y-2.5'>
                    {topGoals.map((goal) => {
                      const isSavings = goal.type === 'SAVINGS';
                      const isOver = !isSavings && goal.progress >= 100;
                      const barColor = goal.isCompleted
                        ? '#00ff87'
                        : isOver
                          ? '#ff3b5c'
                          : isSavings
                            ? '#7c5cfc'
                            : '#00d4ff';
                      const fmtGoal = (n: number) =>
                        new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(n);
                      return (
                        <div key={goal.id} className='space-y-1.5'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <span
                                className='font-mono text-[9px] px-1.5 py-0.5 rounded'
                                style={{
                                  background: `${barColor}15`,
                                  color: barColor,
                                }}
                              >
                                {isSavings ? '🎯' : '📉'}
                              </span>
                              <span className='font-sans text-xs text-[#f0efff] truncate'>
                                {goal.name}
                              </span>
                            </div>
                            <span
                              className='font-mono text-[10px] shrink-0 ml-2'
                              style={{ color: barColor }}
                            >
                              {goal.progress}%
                            </span>
                          </div>
                          <div className='flex items-center gap-2'>
                            <div
                              className='flex-1 h-1.5 rounded-full overflow-hidden'
                              style={{ background: 'rgba(124,92,252,0.1)' }}
                            >
                              <div
                                className='h-full rounded-full transition-all duration-500'
                                style={{
                                  width: `${Math.min(goal.progress, 100)}%`,
                                  background: barColor,
                                }}
                              />
                            </div>
                            <span className='font-mono text-[9px] text-[#4a4870] shrink-0'>
                              {fmtGoal(goal.currentAmount)} /{' '}
                              {fmtGoal(goal.targetAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })()}

          {/* ── Run Rate Projection Chart ── */}
          {!isLoading && runRateData.length > 0 && period !== 'yearly' && (
            <Card
              className='border-[rgba(124,92,252,0.12)] mb-4'
              style={{
                background: 'rgba(13,13,26,0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <CardHeader className='pb-2 px-4 pt-4'>
                <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                  <div
                    className='w-0.5 h-4 rounded-sm'
                    style={{
                      background: 'linear-gradient(180deg, #ff2d78, #ffb830)',
                    }}
                  />
                  Run Rate Projection
                </CardTitle>
              </CardHeader>
              <CardContent className='px-2 pb-4'>
                <ResponsiveContainer width='100%' height={220}>
                  <ComposedChart
                    data={runRateData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='rgba(124,92,252,0.08)'
                      vertical={false}
                    />
                    <XAxis
                      dataKey='day'
                      tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0d0d1a', border: '1px solid rgba(124,92,252,0.2)', borderRadius: '8px' }}
                      itemStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}
                      labelStyle={{ color: '#8b89b0', fontSize: '11px', marginBottom: '4px' }}
                    />
                    
                    {runRateData[0]?.budget && (
                      <Line
                        type='stepAfter'
                        dataKey='budget'
                        stroke='#ffb830'
                        strokeWidth={1}
                        strokeDasharray='5 5'
                        dot={false}
                        activeDot={false}
                        name='Budget Limit'
                      />
                    )}
                    <Line
                      type='monotone'
                      dataKey='actual'
                      stroke='#00ff87'
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                      name='Actual Spend'
                    />
                    <Line
                      type='monotone'
                      dataKey='projected'
                      stroke='#ff2d78'
                      strokeWidth={2}
                      strokeDasharray='4 4'
                      dot={false}
                      activeDot={false}
                      name='Projected'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Charts ── */}
          {!isLoading && expenses.length > 0 && (
            <div className='grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-4'>
              {/* Bar Chart */}
              <Card
                className='border-[rgba(124,92,252,0.12)]'
                style={{
                  background: 'rgba(13,13,26,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <CardHeader className='pb-2 px-4 pt-4'>
                  <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                    <div
                      className='w-0.5 h-4 rounded-sm'
                      style={{
                        background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)',
                      }}
                    />
                    {period === 'yearly'
                      ? 'Monthly Spending'
                      : period === 'weekly'
                        ? 'Daily Spending This Week'
                        : 'Recent Expenses'}
                  </CardTitle>
                </CardHeader>
                <CardContent className='px-2 pb-4'>
                  {barData.length === 0 ? (
                    <div className='h-40 flex items-center justify-center text-[#4a4870] text-sm'>
                      No data for this period
                    </div>
                  ) : (
                    <ResponsiveContainer width='100%' height={160}>
                      <BarChart
                        data={barData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        barCategoryGap='30%'
                      >
                        <CartesianGrid
                          strokeDasharray='3 3'
                          stroke='rgba(124,92,252,0.08)'
                          vertical={false}
                        />
                        <XAxis
                          dataKey='date'
                          tick={{
                            fontSize: 9,
                            fill: '#4a4870',
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 9,
                            fill: '#4a4870',
                            fontFamily: '"JetBrains Mono", monospace',
                          }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                          }
                        />
                        <Tooltip {...tooltipStyle} />
                        <Bar
                          dataKey='amount'
                          radius={[6, 6, 0, 0]}
                          maxBarSize={36}
                          fill='#7c5cfc'
                        >
                          {barData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={`rgba(124,92,252,${0.5 + (i / barData.length) * 0.5})`}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart */}
              {pieData.length > 0 && (
                <Card
                  className='border-[rgba(124,92,252,0.12)]'
                  style={{
                    background: 'rgba(13,13,26,0.7)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <CardHeader className='pb-2 px-4 pt-4'>
                    <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                      <div
                        className='w-0.5 h-4 rounded-sm'
                        style={{
                          background:
                            'linear-gradient(180deg, #ff2d78, #ffb830)',
                        }}
                      />
                      By Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='px-2 pb-4'>
                    <ResponsiveContainer width='100%' height={140}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx='50%'
                          cy='50%'
                          innerRadius={40}
                          outerRadius={62}
                          dataKey='value'
                          paddingAngle={2}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle.contentStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    <div className='space-y-1.5 mt-2 px-2'>
                      {pieData.slice(0, 4).map((d) => (
                        <div
                          key={d.name}
                          className='flex items-center justify-between'
                        >
                          <div className='flex items-center gap-2'>
                            <div
                              className='w-2 h-2 rounded-sm shrink-0'
                              style={{
                                background: d.color,
                                boxShadow: `0 0 6px ${d.color}60`,
                              }}
                            />
                            <span className='font-mono text-[10px] text-[#8b89b0]'>
                              {d.name}
                            </span>
                          </div>
                          <span
                            className='font-mono text-[10px]'
                            style={{ color: d.color }}
                          >
                            {fmt(d.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── Lists Grid: Recent Transactions, Top Merchants, & Day-wise Totals ── */}
          {expenses.length > 0 && (
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
              <Card
                className='border-[rgba(124,92,252,0.12)] h-full'
                style={{
                  background: 'rgba(13,13,26,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <CardHeader className='pb-2 px-4 pt-4'>
                  <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                    <div
                      className='w-0.5 h-4 rounded-sm'
                      style={{
                        background: 'linear-gradient(180deg, #00d4ff, #00ff87)',
                      }}
                    />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className='px-2 pb-3 space-y-0.5'>
                  {expenses.slice(0, 5).map((exp) => (
                    <div
                      key={exp.id}
                      className='flex items-center justify-between px-2 py-2.5 rounded-xl hover:bg-[rgba(124,92,252,0.06)] transition-colors cursor-default'
                    >
                      <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                        <div
                          className='w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0'
                          style={{
                            background: `${CATEGORY_COLORS[exp.category] ?? '#4a4870'}15`,
                            border: `1px solid ${CATEGORY_COLORS[exp.category] ?? '#4a4870'}30`,
                          }}
                        >
                          {CATEGORY_EMOJI[exp.category] ?? '📦'}
                        </div>
                        <div className='min-w-0'>
                          <div className='font-sans text-sm font-medium text-[#f0efff] truncate max-w-[140px] sm:max-w-[260px]'>
                            {exp.title}
                          </div>
                          <div className='font-mono text-[9px] text-[#4a4870] flex items-center gap-1.5'>
                            <span
                              className='px-1.5 py-px rounded text-[8px]'
                              style={{
                                background: `${CATEGORY_COLORS[exp.category] ?? '#4a4870'}18`,
                                color: CATEGORY_COLORS[exp.category] ?? '#4a4870',
                              }}
                            >
                              {exp.category}
                            </span>
                            <span>{exp.date}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className='font-display text-sm font-bold shrink-0 ml-2'
                        style={{
                          color: CATEGORY_COLORS[exp.category] ?? '#9d7fff',
                        }}
                      >
                        {fmt(exp.convertedAmount)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* ── Top Merchants ── */}
              <Card
                className='border-[rgba(124,92,252,0.12)] h-full'
                style={{
                  background: 'rgba(13,13,26,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <CardHeader className='pb-2 px-4 pt-4'>
                  <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                    <div
                      className='w-0.5 h-4 rounded-sm'
                      style={{
                        background: 'linear-gradient(180deg, #ffb830, #ff2d78)',
                      }}
                    />
                    Top Merchants
                  </CardTitle>
                </CardHeader>
                <CardContent className='px-2 pb-3 space-y-0.5'>
                  {topMerchants.length === 0 ? (
                    <div className='text-center text-[#4a4870] font-mono text-xs py-4'>No data</div>
                  ) : (
                    topMerchants.map((merchant, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[rgba(124,92,252,0.06)] transition-colors cursor-default'
                      >
                        <div className='flex items-center gap-3 min-w-0 flex-1'>
                          <div
                            className='w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0'
                            style={{
                              background: 'rgba(255,184,48,0.1)',
                              color: '#ffb830',
                              border: '1px solid rgba(255,184,48,0.2)',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div className='min-w-0'>
                            <div className='font-sans text-sm font-medium text-[#f0efff] truncate'>
                              {merchant.name}
                            </div>
                            <div className='font-mono text-[9px] text-[#8b89b0]'>
                              {merchant.count} {merchant.count === 1 ? 'txn' : 'txns'}
                            </div>
                          </div>
                        </div>
                        <div className='font-display text-sm font-bold shrink-0 ml-2 text-[#ff2d78]'>
                          {fmt(merchant.total)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* ── Day-wise Totals ── */}
              <Card
                className='border-[rgba(124,92,252,0.12)] h-full'
                style={{
                  background: 'rgba(13,13,26,0.7)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <CardHeader className='pb-2 px-4 pt-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2.5 text-[#f0efff] font-display text-sm font-semibold'>
                      <div
                        className='w-0.5 h-4 rounded-sm'
                        style={{
                          background: 'linear-gradient(180deg, #ffb830, #ff2d78)',
                        }}
                      />
                      Day-wise Totals
                    </CardTitle>
                    <ChartTypeDropdown
                      value={dayWiseChartType}
                      onChange={setDayWiseChartType}
                    />
                  </div>
                </CardHeader>
                <CardContent className='px-2 pb-4'>
                  {dayWiseTotals.length === 0 ? (
                    <div className='h-40 flex items-center justify-center text-[#4a4870] text-sm'>
                      No data for this period
                    </div>
                  ) : (
                    <ResponsiveContainer width='100%' height={210}>
                      {dayWiseChartType === 'bar' ? (
                        <BarChart
                          data={dayWiseTotals}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          barCategoryGap='20%'
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='rgba(124,92,252,0.08)'
                            vertical={false}
                          />
                          <XAxis
                            dataKey='date'
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                          />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey='amount' radius={[4, 4, 0, 0]} fill='#ff2d78' maxBarSize={30} />
                        </BarChart>
                      ) : dayWiseChartType === 'line' ? (
                        <LineChart
                          data={dayWiseTotals}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='rgba(124,92,252,0.08)'
                            vertical={false}
                          />
                          <XAxis
                            dataKey='date'
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                          />
                          <Tooltip {...tooltipStyle} />
                          <Line
                            type='monotone'
                            dataKey='amount'
                            stroke='#ff2d78'
                            strokeWidth={2}
                            dot={{ fill: '#ff2d78', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      ) : (
                        <AreaChart
                          data={dayWiseTotals}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id='colorAmount' x1='0' y1='0' x2='0' y2='1'>
                              <stop offset='5%' stopColor='#ff2d78' stopOpacity={0.3} />
                              <stop offset='95%' stopColor='#ff2d78' stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray='3 3'
                            stroke='rgba(124,92,252,0.08)'
                            vertical={false}
                          />
                          <XAxis
                            dataKey='date'
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: '#4a4870', fontFamily: '"JetBrains Mono", monospace' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                          />
                          <Tooltip {...tooltipStyle} />
                          <Area
                            type='monotone'
                            dataKey='amount'
                            stroke='#ff2d78'
                            strokeWidth={2}
                            fillOpacity={1}
                            fill='url(#colorAmount)'
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Loading skeletons ── */}
          {isLoading && (
            <div className='space-y-3'>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className='h-32 rounded-2xl shimmer'
                  style={{ background: 'rgba(124,92,252,0.05)' }}
                />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && expenses.length === 0 && (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='text-5xl mb-4'>✨</div>
              <div className='font-display text-xl font-bold text-[#f0efff] mb-2'>
                No expenses{' '}
                {period === 'weekly'
                  ? 'this week'
                  : period === 'yearly'
                    ? 'this year'
                    : period === 'last_monthly'
                      ? 'last month'
                      : 'this month'}
              </div>
              <p className='text-[#4a4870] text-sm'>
                Head to AI Chat to add your first expense!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
