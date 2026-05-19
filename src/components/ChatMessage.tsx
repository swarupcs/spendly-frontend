import { useState, useRef, useCallback, useEffect } from 'react';
import {
  User,
  Cpu,
  AlertTriangle,
  Wrench,
  ChevronDown,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type {
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';
import type { StreamMessage } from '@/types/StreamMessage.types';

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
const PALETTE = [
  '#7c5cfc',
  '#00d4ff',
  '#00ff87',
  '#ffb830',
  '#ff2d78',
  '#9d7fff',
  '#5b8fff',
  '#4a4870',
];

// ─── Chart shape detection ────────────────────────────────────────────────────
type ChartShape =
  | { kind: 'bar'; data: { label: string; amount: number; color?: string }[] }
  | { kind: 'pie'; data: { name: string; value: number; color: string }[] }
  | { kind: 'line'; data: { month: string; amount: number }[] }
  | null;

function detectChart(result: Record<string, unknown>): ChartShape {
  if (Array.isArray(result.byCategory) && result.byCategory.length > 0) {
    const cats = result.byCategory as Array<{
      category: string;
      amount: number;
    }>;
    return {
      kind: 'bar',
      data: cats.map((c) => ({
        label: c.category,
        amount: Math.round(c.amount),
        color: CATEGORY_COLORS[c.category] ?? '#7c5cfc',
      })),
    };
  }
  if (Array.isArray(result.expenses) && result.expenses.length > 0) {
    const exps = result.expenses as Array<{ date: string; amount: number }>;
    if (new Set(exps.map((e) => e.date.slice(0, 7))).size > 1) {
      const mm: Record<string, number> = {};
      for (const e of exps) {
        const k = e.date.slice(0, 7);
        mm[k] = (mm[k] ?? 0) + e.amount;
      }
      return {
        kind: 'line',
        data: Object.entries(mm)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([m, a]) => ({
            month: new Date(m + '-01').toLocaleString('en', { month: 'short' }),
            amount: Math.round(a),
          })),
      };
    }
    const dm: Record<string, number> = {};
    for (const e of exps) {
      const k = e.date.slice(5);
      dm[k] = (dm[k] ?? 0) + e.amount;
    }
    return {
      kind: 'bar',
      data: Object.entries(dm)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([l, a]) => ({ label: l, amount: a, color: '#7c5cfc' })),
    };
  }
  if (Array.isArray(result.data) && result.data.length > 0) {
    const rows = result.data as Array<Record<string, unknown>>;
    const lk = ['label', 'category', 'month', 'date', 'name'].find(
      (k) => k in rows[0],
    );
    const vk = ['amount', 'total', 'value', 'count'].find((k) => k in rows[0]);
    if (lk && vk)
      return {
        kind: 'bar',
        data: rows.map((r, i) => ({
          label: String(r[lk]),
          amount: Math.round(Number(r[vk])),
          color: CATEGORY_COLORS[String(r[lk])] ?? PALETTE[i % PALETTE.length],
        })),
      };
  }
  return null;
}

// ─── Shared tooltip box UI ────────────────────────────────────────────────────
interface TipPayload {
  label: string;
  value: number;
  color: string;
}

function TooltipBox({ label, value, color }: TipPayload) {
  return (
    <div
      style={{
        background: '#1a1a2e',
        border: `1px solid ${color}90`,
        borderRadius: 10,
        padding: '9px 13px',
        boxShadow: `0 8px 32px rgba(0,0,0,0.85), 0 0 20px ${color}30`,
        fontFamily: '"JetBrains Mono", monospace',
        pointerEvents: 'none',
        backdropFilter: 'blur(16px)',
        minWidth: 130,
      }}
    >
      <p
        style={{
          fontSize: 9,
          color: '#8b89b0',
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 17,
          fontWeight: 700,
          color,
          fontFamily: '"Syne", sans-serif',
          lineHeight: 1.1,
          margin: 0,
          textShadow: `0 0 16px ${color}60`,
        }}
      >
        ₹{value.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

function FixedTooltip({
  label,
  value,
  color,
  x,
  y,
}: TipPayload & { x: number; y: number }) {
  const W = 148,
    H = 62,
    GAP = 14;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  let left = x + GAP;
  if (left + W > vw - 8) left = x - W - GAP;
  let top = y - H / 2;
  if (top < 8) top = 8;
  if (top + H > vh - 8) top = vh - H - 8;
  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <TooltipBox label={label} value={value} color={color} />
    </div>
  );
}

// ─── useChartTooltip ──────────────────────────────────────────────────────────
function useChartTooltip(
  data: Array<{
    label?: string;
    month?: string;
    value?: number;
    amount?: number;
    color?: string;
  }>,
  accentColor = '#7c5cfc',
) {
  const [touchTip, setTouchTip] = useState<
    (TipPayload & { x: number; y: number }) | null
  >(null);
  const lastInteraction = useRef<'touch' | 'mouse'>('mouse');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const hideAfter = useCallback((ms = 2200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTouchTip(null), ms);
  }, []);

  const getIndex = useCallback(
    (clientX: number) => {
      if (!containerRef.current || !data.length) return -1;
      const rect = containerRef.current.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(
          Math.floor(((clientX - rect.left) / rect.width) * data.length),
          data.length - 1,
        ),
      );
    },
    [data],
  );

  const showFromIndex = useCallback(
    (idx: number, clientX: number, clientY: number) => {
      const item = data[idx];
      if (!item) return;
      setTouchTip({
        label: item.label ?? item.month ?? '',
        value: item.amount ?? item.value ?? 0,
        color: item.color ?? accentColor,
        x: clientX,
        y: clientY,
      });
      hideAfter();
    },
    [data, accentColor, hideAfter],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      lastInteraction.current = 'touch';
      e.stopPropagation();
      if (timerRef.current) clearTimeout(timerRef.current);
      const t = e.touches[0] ?? e.changedTouches[0];
      if (t) showFromIndex(getIndex(t.clientX), t.clientX, t.clientY);
    },
    [getIndex, showFromIndex],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (timerRef.current) clearTimeout(timerRef.current);
      const t = e.touches[0];
      if (t) showFromIndex(getIndex(t.clientX), t.clientX, t.clientY);
    },
    [getIndex, showFromIndex],
  );

  const onMouseEnter = useCallback(() => {
    lastInteraction.current = 'mouse';
    setTouchTip(null);
  }, []);

  const rechartsContent = useCallback(
    (props: TooltipProps<ValueType, NameType>) => {
      if (lastInteraction.current === 'touch') return null;
      if (!props.active || !props.payload?.length) return null;
      const entry = props.payload[0];
      const color =
        (entry.payload as { color?: string } | undefined)?.color ?? accentColor;
      const value =
        typeof entry.value === 'number'
          ? entry.value
          : Number(entry.value ?? 0);
      return (
        <TooltipBox
          label={String(props.label ?? '')}
          value={value}
          color={color}
        />
      );
    },
    [accentColor],
  );

  return {
    containerRef,
    touchTip,
    onTouchStart,
    onTouchMove,
    onMouseEnter,
    rechartsContent,
  };
}

// ─── usePieChartTooltip ───────────────────────────────────────────────────────
function usePieChartTooltip(
  data: Array<{ name: string; value: number; color: string }>,
) {
  const [touchTip, setTouchTip] = useState<
    (TipPayload & { x: number; y: number }) | null
  >(null);
  const lastInteraction = useRef<'touch' | 'mouse'>('mouse');
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const hideAfter = useCallback((ms = 2200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTouchTip(null), ms);
  }, []);

  const findSlice = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !data.length) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const deg =
        ((Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 360 + 90) %
        360;
      const sum = data.reduce((s, d) => s + d.value, 0);
      let cumulative = 0;
      for (const slice of data) {
        const sliceDeg = (slice.value / sum) * 360;
        if (deg >= cumulative && deg < cumulative + sliceDeg) return slice;
        cumulative += sliceDeg;
      }
      return data[data.length - 1];
    },
    [data],
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      lastInteraction.current = 'touch';
      e.stopPropagation();
      if (timerRef.current) clearTimeout(timerRef.current);
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return;
      const slice = findSlice(t.clientX, t.clientY);
      if (slice) {
        setTouchTip({
          label: slice.name,
          value: slice.value,
          color: slice.color,
          x: t.clientX,
          y: t.clientY,
        });
        hideAfter();
      }
    },
    [findSlice, hideAfter],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (timerRef.current) clearTimeout(timerRef.current);
      const t = e.touches[0];
      if (!t) return;
      const slice = findSlice(t.clientX, t.clientY);
      if (slice) {
        setTouchTip({
          label: slice.name,
          value: slice.value,
          color: slice.color,
          x: t.clientX,
          y: t.clientY,
        });
        hideAfter();
      }
    },
    [findSlice, hideAfter],
  );

  const onMouseEnter = useCallback(() => {
    lastInteraction.current = 'mouse';
    setTouchTip(null);
  }, []);

  const rechartsContent = useCallback(
    (props: TooltipProps<ValueType, NameType>) => {
      if (lastInteraction.current === 'touch') return null;
      if (!props.active || !props.payload?.length) return null;
      const entry = props.payload[0];
      const color =
        (entry.payload as { color?: string } | undefined)?.color ?? '#7c5cfc';
      const value =
        typeof entry.value === 'number'
          ? entry.value
          : Number(entry.value ?? 0);
      return (
        <TooltipBox
          label={String(entry.name ?? '')}
          value={value}
          color={color}
        />
      );
    },
    [],
  );

  return {
    containerRef,
    touchTip,
    onTouchStart,
    onTouchMove,
    onMouseEnter,
    rechartsContent,
  };
}

// ─── Shared wrapper style ─────────────────────────────────────────────────────
const wrapStyle: React.CSSProperties = {
  overflow: 'visible',
  touchAction: 'pan-y',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChartView({
  data,
}: {
  data: { label: string; amount: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.amount));
  const tipData = data.map((d) => ({ ...d, value: d.amount }));
  const {
    containerRef,
    touchTip,
    onTouchStart,
    onTouchMove,
    onMouseEnter,
    rechartsContent,
  } = useChartTooltip(tipData);

  return (
    <div className='mt-3'>
      <p className='font-mono text-[9px] text-[#4a4870] uppercase tracking-widest mb-3'>
        Spending Chart
      </p>
      <div
        ref={containerRef}
        style={wrapStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onMouseEnter={onMouseEnter}
      >
        <ResponsiveContainer width='100%' height={180}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
            barCategoryGap='28%'
          >
            <CartesianGrid
              strokeDasharray='3 3'
              stroke='rgba(124,92,252,0.08)'
              vertical={false}
            />
            <XAxis
              dataKey='label'
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
              width={36}
            />
            <Tooltip
              content={rechartsContent}
              cursor={{ fill: 'rgba(124,92,252,0.08)', radius: 4 }}
              wrapperStyle={{ zIndex: 9999, outline: 'none' }}
              allowEscapeViewBox={{ x: true, y: true }}
              isAnimationActive={false}
            />
            <Bar dataKey='amount' radius={[6, 6, 0, 0]} maxBarSize={44}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color ?? '#7c5cfc'}
                  opacity={d.amount === max ? 1 : 0.5 + (d.amount / max) * 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {touchTip && <FixedTooltip {...touchTip} />}
      <div className='flex flex-wrap gap-x-3 gap-y-1.5 mt-3'>
        {data.map((d) => (
          <div key={d.label} className='flex items-center gap-1.5'>
            <div
              className='w-2 h-2 rounded-sm shrink-0'
              style={{
                background: d.color ?? '#7c5cfc',
                boxShadow: `0 0 5px ${d.color ?? '#7c5cfc'}60`,
              }}
            />
            <span className='font-mono text-[9px] text-[#8b89b0]'>
              {d.label}
            </span>
            <span className='font-mono text-[9px] text-[#4a4870]'>
              ₹{d.amount.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
function PieChartView({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const {
    containerRef,
    touchTip,
    onTouchStart,
    onTouchMove,
    onMouseEnter,
    rechartsContent,
  } = usePieChartTooltip(data);

  return (
    <div className='mt-3'>
      <p className='font-mono text-[9px] text-[#4a4870] uppercase tracking-widest mb-3'>
        Category Breakdown
      </p>
      <div className='flex flex-col sm:flex-row items-center gap-4'>
        <div
          ref={containerRef}
          style={{ ...wrapStyle, flexShrink: 0 }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onMouseEnter={onMouseEnter}
        >
          <ResponsiveContainer width={180} height={160}>
            <PieChart>
              <Pie
                data={data}
                cx='50%'
                cy='50%'
                innerRadius={42}
                outerRadius={68}
                dataKey='value'
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                content={rechartsContent}
                wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                allowEscapeViewBox={{ x: true, y: true }}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className='flex flex-col gap-2 flex-1 min-w-0 w-full'>
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <div key={d.name} className='flex items-center gap-2'>
                <div
                  className='w-2.5 h-2.5 rounded-sm shrink-0'
                  style={{
                    background: d.color,
                    boxShadow: `0 0 5px ${d.color}60`,
                  }}
                />
                <span className='font-mono text-[10px] text-[#8b89b0] flex-1 truncate'>
                  {d.name}
                </span>
                <span className='font-mono text-[10px] text-[#4a4870]'>
                  {pct}%
                </span>
                <span
                  className='font-mono text-[10px] font-semibold'
                  style={{ color: d.color }}
                >
                  ₹{d.value.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {touchTip && <FixedTooltip {...touchTip} />}
    </div>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────
function LineChartView({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  const tipData = data.map((d) => ({
    label: d.month,
    amount: d.amount,
    value: d.amount,
    color: '#7c5cfc',
  }));
  const {
    containerRef,
    touchTip,
    onTouchStart,
    onTouchMove,
    onMouseEnter,
    rechartsContent,
  } = useChartTooltip(tipData, '#7c5cfc');

  return (
    <div className='mt-3'>
      <p className='font-mono text-[9px] text-[#4a4870] uppercase tracking-widest mb-3'>
        Monthly Trend
      </p>
      <div
        ref={containerRef}
        style={wrapStyle}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onMouseEnter={onMouseEnter}
      >
        <ResponsiveContainer width='100%' height={180}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray='3 3'
              stroke='rgba(124,92,252,0.08)'
            />
            <XAxis
              dataKey='month'
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
              width={36}
            />
            <Tooltip
              content={rechartsContent}
              wrapperStyle={{ zIndex: 9999, outline: 'none' }}
              allowEscapeViewBox={{ x: true, y: true }}
              isAnimationActive={false}
              cursor={{
                stroke: 'rgba(124,92,252,0.3)',
                strokeWidth: 1,
                strokeDasharray: '4 2',
              }}
            />
            <Line
              type='monotone'
              dataKey='amount'
              stroke='#7c5cfc'
              strokeWidth={2.5}
              dot={{ fill: '#7c5cfc', r: 4, strokeWidth: 2, stroke: '#080810' }}
              activeDot={{
                r: 6,
                fill: '#9d7fff',
                stroke: '#080810',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {touchTip && <FixedTooltip {...touchTip} />}
      {data.length > 1 &&
        (() => {
          const hi = data.reduce((a, b) => (a.amount > b.amount ? a : b));
          const lo = data.reduce((a, b) => (a.amount < b.amount ? a : b));
          return (
            <div className='flex gap-3 mt-3'>
              <div
                className='flex-1 px-3 py-2 rounded-xl'
                style={{
                  background: 'rgba(0,255,135,0.06)',
                  border: '1px solid rgba(0,255,135,0.15)',
                }}
              >
                <p className='font-mono text-[9px] text-[#4a4870] mb-0.5'>
                  Lowest · {lo.month}
                </p>
                <p className='font-display text-sm font-bold text-[#00ff87]'>
                  ₹{lo.amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div
                className='flex-1 px-3 py-2 rounded-xl'
                style={{
                  background: 'rgba(255,45,120,0.06)',
                  border: '1px solid rgba(255,45,120,0.15)',
                }}
              >
                <p className='font-mono text-[9px] text-[#4a4870] mb-0.5'>
                  Highest · {hi.month}
                </p>
                <p className='font-display text-sm font-bold text-[#ff2d78]'>
                  ₹{hi.amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

// ─── Chart dispatcher ─────────────────────────────────────────────────────────
function RenderedChart({ chart }: { chart: NonNullable<ChartShape> }) {
  if (chart.kind === 'bar') return <BarChartView data={chart.data} />;
  if (chart.kind === 'pie') return <PieChartView data={chart.data} />;
  if (chart.kind === 'line') return <LineChartView data={chart.data} />;
  return null;
}

// ─── Tool blocks ──────────────────────────────────────────────────────────────
function ToolCallBlock({
  name,
  args,
}: {
  name: string;
  args?: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className='rounded-xl overflow-hidden'
      style={{
        border: '1px solid rgba(255,184,48,0.2)',
        background: 'rgba(255,184,48,0.04)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className='w-full flex items-center gap-2 px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-left'
      >
        <Wrench className='w-3 h-3 text-[#ffb830] shrink-0' />
        <span className='font-mono text-[9px] text-[#ffb830] bg-[rgba(255,184,48,0.1)] border border-[rgba(255,184,48,0.2)] px-1.5 py-0.5 rounded'>
          tool
        </span>
        <span className='font-mono text-[11px] text-[#ffb830] flex-1 overflow-hidden text-ellipsis whitespace-nowrap'>
          {name}
        </span>
        {open ? (
          <ChevronDown className='w-3 h-3 text-[#4a4870]' />
        ) : (
          <ChevronRight className='w-3 h-3 text-[#4a4870]' />
        )}
      </button>
      {open && args && (
        <div className='border-t border-[rgba(255,184,48,0.1)] max-h-[160px] overflow-y-auto'>
          <pre className='p-3 font-mono text-[10px] text-[rgba(255,184,48,0.6)] m-0 leading-relaxed overflow-x-auto'>
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function ToolResultBlock({
  name,
  result,
}: {
  name: string;
  result: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const chart = detectChart(result);
  return (
    <div className='flex flex-col gap-2'>
      <div
        className='rounded-xl overflow-hidden'
        style={{
          border: '1px solid rgba(0,255,135,0.15)',
          background: 'rgba(0,255,135,0.04)',
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className='w-full flex items-center gap-2 px-3.5 py-2.5 bg-transparent border-none cursor-pointer text-left'
        >
          <div
            className='w-1.5 h-1.5 rounded-full shrink-0'
            style={{ background: '#00ff87', boxShadow: '0 0 5px #00ff87' }}
          />
          <span className='font-mono text-[9px] text-[#00ff87] bg-[rgba(0,255,135,0.1)] border border-[rgba(0,255,135,0.2)] px-1.5 py-0.5 rounded'>
            result
          </span>
          <span className='font-mono text-[11px] text-[#00ff87] flex-1 overflow-hidden text-ellipsis whitespace-nowrap'>
            {name}
          </span>
          {open ? (
            <ChevronDown className='w-3 h-3 text-[#4a4870]' />
          ) : (
            <ChevronRight className='w-3 h-3 text-[#4a4870]' />
          )}
        </button>
        {open && (
          <div className='border-t border-[rgba(0,255,135,0.1)] max-h-[160px] overflow-y-auto'>
            <pre className='p-3 font-mono text-[10px] text-[rgba(0,255,135,0.55)] m-0 leading-relaxed overflow-x-auto'>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      {chart && (
        <div
          className='rounded-2xl p-4'
          style={{
            background: 'rgba(13,13,26,0.9)',
            border: '1px solid rgba(124,92,252,0.15)',
            overflow: 'visible',
            position: 'relative',
          }}
        >
          <RenderedChart chart={chart} />
        </div>
      )}
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

/**
 * Inline parser — handles: **bold**, *italic*, `code`, ~~strikethrough~~
 * Processes tokens left-to-right so nested combinations work naturally.
 */
function renderInline(text: string): React.ReactNode {
  // Split on bold, italic, inline-code, strikethrough tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return (
        <strong key={i} className='font-semibold text-[#f0efff]'>
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return (
        <em key={i} className='italic text-[#c9c7f0]'>
          {part.slice(1, -1)}
        </em>
      );
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code
          key={i}
          className='px-1.5 py-0.5 rounded bg-[rgba(124,92,252,0.12)] text-[#9d7fff] font-mono text-[11px]'
        >
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith('~~') && part.endsWith('~~'))
      return (
        <span key={i} className='line-through text-[#8b89b0]'>
          {part.slice(2, -2)}
        </span>
      );
    return part;
  });
}

// ─── Table ────────────────────────────────────────────────────────────────────

function isSeparatorRow(line: string): boolean {
  return /^\|[\s\-|:]+\|$/.test(line.trim());
}

function parseRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());
}

function MarkdownTable({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows;
  return (
    <div
      className='w-full overflow-x-auto my-3 rounded-xl'
      style={{ border: '1px solid rgba(124,92,252,0.18)' }}
    >
      <table className='w-full border-collapse text-sm'>
        <thead>
          <tr style={{ background: 'rgba(124,92,252,0.12)' }}>
            {header.map((cell, i) => (
              <th
                key={i}
                className='px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-widest'
                style={{
                  color: '#9d7fff',
                  borderBottom: '1px solid rgba(124,92,252,0.18)',
                  whiteSpace: 'nowrap',
                }}
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr
              key={ri}
              style={{
                background:
                  ri % 2 === 0 ? 'transparent' : 'rgba(124,92,252,0.04)',
                borderBottom:
                  ri < body.length - 1
                    ? '1px solid rgba(124,92,252,0.08)'
                    : 'none',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className='px-4 py-2 font-sans text-[13px]'
                  style={{ color: ci === 0 ? '#d4d2f0' : '#8b89b0' }}
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className='my-3 rounded-xl overflow-hidden'
      style={{
        border: '1px solid rgba(124,92,252,0.2)',
        background: 'rgba(8,8,16,0.9)',
      }}
    >
      {/* Header bar */}
      <div
        className='flex items-center justify-between px-4 py-2'
        style={{ borderBottom: '1px solid rgba(124,92,252,0.12)' }}
      >
        <span className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className='font-mono text-[10px] transition-colors px-2 py-0.5 rounded'
          style={{
            color: copied ? '#00ff87' : '#4a4870',
            background: copied ? 'rgba(0,255,135,0.08)' : 'transparent',
          }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      {/* Code content */}
      <pre
        className='p-4 overflow-x-auto m-0 leading-relaxed'
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '12px',
          color: '#c9c7f0',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Block-level parser ───────────────────────────────────────────────────────

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'bullet'; text: string; depth: number }
  | { kind: 'ordered'; text: string; num: number }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'hr' }
  | { kind: 'blank' }
  | { kind: 'paragraph'; text: string };

function parseBlocks(raw: string): Block[] {
  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // ── Fenced code block  ```lang ... ``` ───
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      blocks.push({ kind: 'code', lang, code: codeLines.join('\n') });
      continue;
    }

    // ── Horizontal rule  ---, ***, ___ ───
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // ── H1 ───
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      blocks.push({ kind: 'h1', text: line.slice(2) });
      i++;
      continue;
    }

    // ── H2 ───
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      blocks.push({ kind: 'h2', text: line.slice(3) });
      i++;
      continue;
    }

    // ── H3 ───
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4) });
      i++;
      continue;
    }

    // ── Unordered bullet  - / * / • (with optional indent) ───
    const bulletMatch = line.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      const depth = Math.floor(bulletMatch[1].length / 2); // 2 spaces = 1 level
      blocks.push({ kind: 'bullet', text: bulletMatch[3], depth });
      i++;
      continue;
    }

    // ── Ordered list  1. / 1) ───
    const orderedMatch = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({
        kind: 'ordered',
        num: parseInt(orderedMatch[1], 10),
        text: orderedMatch[2],
      });
      i++;
      continue;
    }

    // ── Blank line ───
    if (trimmed === '') {
      blocks.push({ kind: 'blank' });
      i++;
      continue;
    }

    // ── Table  (header row followed immediately by separator) ───
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      isSeparatorRow(lines[i + 1])
    ) {
      const tableRows: string[][] = [];
      tableRows.push(parseRow(line));
      i += 2; // skip header + separator
      while (i < lines.length && lines[i].includes('|')) {
        tableRows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ kind: 'table', rows: tableRows });
      continue;
    }

    // ── Plain paragraph ───
    blocks.push({ kind: 'paragraph', text: line });
    i++;
  }

  return blocks;
}

function AiTextContent({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  // Track ordered-list counter to reset between separate lists
  const lastOrderedNum = -1;

  return (
    <div className='text-[#d4d2f0] text-sm sm:text-[15px] leading-[1.75] font-sans'>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h1':
            return (
              <h1
                key={i}
                className='font-display font-black text-xl text-[#f0efff] mt-6 mb-2 tracking-tight'
              >
                {block.text}
              </h1>
            );

          case 'h2':
            return (
              <h2
                key={i}
                className='font-display font-extrabold text-base text-[#f0efff] mt-5 mb-1.5'
              >
                {block.text}
              </h2>
            );

          case 'h3':
            return (
              <h3
                key={i}
                className='font-display font-bold text-sm text-[#f0efff] mt-4 mb-1'
              >
                {block.text}
              </h3>
            );

          case 'bullet': {
            const indent = block.depth * 16; // 16px per nesting level
            // Use different bullet symbols per depth level
            const bullets = ['◆', '◇', '·'];
            const symbol = bullets[Math.min(block.depth, bullets.length - 1)];
            return (
              <div
                key={i}
                className='flex items-start my-1'
                style={{ paddingLeft: indent }}
              >
                <span
                  className='shrink-0 mt-2 mr-2.5'
                  style={{
                    color: block.depth === 0 ? '#7c5cfc' : '#4a4870',
                    fontSize: block.depth === 0 ? '6px' : '8px',
                    lineHeight: 1,
                  }}
                >
                  {symbol}
                </span>
                <span>{renderInline(block.text)}</span>
              </div>
            );
          }

          case 'ordered': {
            // Reset visual counter when a new list starts (num goes back to 1)
            if (block.num <= lastOrderedNum || lastOrderedNum === -1) {
              // new list or continuation — just use block.num
            }
            // Track ordered-list counter to reset between separate lists
            /* lastOrderedNum = block.num; */ // removed reassignment to avoid render-side mutation
            return (
              <div key={i} className='flex items-start my-1 gap-2.5'>
                <span
                  className='shrink-0 font-mono text-[11px] font-bold min-w-[18px] text-right mt-0.5'
                  style={{ color: '#7c5cfc' }}
                >
                  {block.num}.
                </span>
                <span>{renderInline(block.text)}</span>
              </div>
            );
          }

          case 'table':
            return <MarkdownTable key={i} rows={block.rows} />;

          case 'code':
            return <CodeBlock key={i} lang={block.lang} code={block.code} />;

          case 'hr':
            return (
              <div
                key={i}
                className='my-4'
                style={{
                  height: '1px',
                  background:
                    'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), transparent)',
                }}
              />
            );

          case 'blank':
            return <div key={i} className='h-1.5' />;

          case 'paragraph':
            return (
              <p key={i} className='my-0.5'>
                {renderInline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}

// ─── ChatMessage ──────────────────────────────────────────────────────────────
export function ChatMessage({
  message,
  reaction,
  onReaction,
}: {
  message: StreamMessage;
  reaction?: 'up' | 'down';
  onReaction?: (type: 'up' | 'down') => void;
}) {
  if (message.type === 'user')
    return (
      <div className='flex justify-end gap-2.5 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 items-end'>
        <div className='max-w-[80%] sm:max-w-[72%]'>
          <div
            className='rounded-[16px_16px_4px_16px] px-3.5 sm:px-4 py-2.5 sm:py-3'
            style={{
              background:
                'linear-gradient(135deg,rgba(124,92,252,0.25),rgba(0,212,255,0.15))',
              border: '1px solid rgba(124,92,252,0.3)',
              boxShadow: '0 4px 20px rgba(124,92,252,0.1)',
            }}
          >
            <p className='text-[#f0efff] text-sm sm:text-[15px] leading-[1.65] font-sans m-0'>
              {message.payload.text}
            </p>
          </div>
        </div>
        <div
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
          style={{
            background: 'rgba(124,92,252,0.12)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}
        >
          <User className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8b89b0]' />
        </div>
      </div>
    );

  if (message.type === 'toolCall:start')
    return (
      <div className='flex gap-2.5 sm:gap-3 px-3 sm:px-6 py-2'>
        <div
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
          style={{
            background: 'rgba(255,184,48,0.1)',
            border: '1px solid rgba(255,184,48,0.2)',
          }}
        >
          <Wrench className='w-3 h-3 text-[#ffb830]' />
        </div>
        <div className='flex-1 pt-1'>
          <ToolCallBlock
            name={message.payload.name}
            args={message.payload.args}
          />
        </div>
      </div>
    );

  if (message.type === 'tool')
    return (
      <div className='flex gap-2.5 sm:gap-3 px-3 sm:px-6 py-2'>
        <div
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
          style={{
            background: 'rgba(0,255,135,0.08)',
            border: '1px solid rgba(0,255,135,0.15)',
          }}
        >
          <div
            className='w-2 h-2 rounded-full'
            style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }}
          />
        </div>
        <div className='flex-1 pt-1 min-w-0'>
          <ToolResultBlock
            name={message.payload.name}
            result={message.payload.result}
          />
        </div>
      </div>
    );

  if (message.type === 'error')
    return (
      <div className='flex gap-2.5 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4'>
        <div
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
          style={{
            background: 'rgba(255,59,92,0.1)',
            border: '1px solid rgba(255,59,92,0.2)',
          }}
        >
          <AlertTriangle className='w-3 h-3 text-[#ff3b5c]' />
        </div>
        <div className='flex-1 pt-1'>
          <div
            className='rounded-2xl p-3 sm:p-4'
            style={{
              background: 'rgba(255,59,92,0.07)',
              border: '1px solid rgba(255,59,92,0.2)',
            }}
          >
            <p className='text-[#ff3b5c] text-sm leading-relaxed font-sans m-0'>
              {message.payload.text}
            </p>
          </div>
        </div>
      </div>
    );

  if (message.type === 'ai')
    return (
      <div className='flex gap-2.5 sm:gap-3 px-3 sm:px-6 py-4 sm:py-5'>
        <div
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
          style={{
            background:
              'linear-gradient(135deg,rgba(124,92,252,0.3),rgba(0,212,255,0.2))',
            border: '1px solid rgba(124,92,252,0.3)',
          }}
        >
          <Cpu className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#9d7fff]' />
        </div>
        <div className='flex-1 min-w-0 pt-1'>
          <AiTextContent text={message.payload.text} />
          {/* Reaction buttons */}
          {onReaction && (
            <div className='flex items-center gap-1 mt-2'>
              <button
                onClick={() => onReaction('up')}
                className='flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[10px] font-mono'
                style={{
                  background: reaction === 'up' ? 'rgba(0,255,135,0.12)' : 'transparent',
                  border: `1px solid ${reaction === 'up' ? 'rgba(0,255,135,0.3)' : 'rgba(124,92,252,0.1)'}`,
                  color: reaction === 'up' ? '#00ff87' : '#4a4870',
                }}
                title='Helpful'
              >
                <ThumbsUp className='w-3 h-3' />
              </button>
              <button
                onClick={() => onReaction('down')}
                className='flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[10px] font-mono'
                style={{
                  background: reaction === 'down' ? 'rgba(255,59,92,0.12)' : 'transparent',
                  border: `1px solid ${reaction === 'down' ? 'rgba(255,59,92,0.3)' : 'rgba(124,92,252,0.1)'}`,
                  color: reaction === 'down' ? '#ff3b5c' : '#4a4870',
                }}
                title='Not helpful'
              >
                <ThumbsDown className='w-3 h-3' />
              </button>
            </div>
          )}
        </div>
      </div>
    );

  return null;
}
