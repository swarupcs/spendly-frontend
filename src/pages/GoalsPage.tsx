import { useState } from 'react';
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from '@/services/goals.service';
import { useFmt } from '@/hooks/useCurrency';
import type { FinancialGoal, GoalType, CreateGoalInput } from '@/api/goals.api';
import type { Category } from '@/api/expenses.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  TrendingDown,
  Calendar,
  Check,
  Minus,
  AlertCircle,
  Trophy,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  'DINING',
  'SHOPPING',
  'TRANSPORT',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTH',
  'EDUCATION',
  'OTHER',
];

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
  ENTERTAINMENT: '🎬',
  UTILITIES: '⚡',
  HEALTH: '🏥',
  EDUCATION: '📚',
  OTHER: '📦',
};

function currentMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  progress,
  type,
  isCompleted,
}: {
  progress: number;
  type: GoalType;
  isCompleted: boolean;
}) {
  let color = '#7c5cfc';
  if (isCompleted) color = '#00ff87';
  else if (type === 'SPENDING_LIMIT') {
    if (progress >= 100) color = '#ff3b5c';
    else if (progress >= 80) color = '#ffb830';
    else color = '#00ff87';
  } else {
    if (progress >= 100) color = '#00ff87';
    else if (progress >= 60) color = '#00d4ff';
    else color = '#7c5cfc';
  }

  return (
    <div
      className='w-full h-2 rounded-full overflow-hidden'
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className='h-full rounded-full transition-all duration-500'
        style={{ width: `${Math.min(progress, 100)}%`, background: color }}
      />
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onAdjust,
  onMarkComplete,
  fmt,
}: {
  goal: FinancialGoal;
  onEdit: (g: FinancialGoal) => void;
  onDelete: (id: number) => void;
  onAdjust: (id: number, delta: number) => void;
  onMarkComplete: (id: number) => void; // NEW — now works for both types
  fmt: (n: number) => string;
}) {
  const isSavings = goal.type === 'SAVINGS';
  const isOver = goal.type === 'SPENDING_LIMIT' && goal.progress >= 100;

  return (
    <Card
      className='border overflow-hidden'
      style={{
        background: 'rgba(13,13,26,0.8)',
        borderColor: goal.isCompleted
          ? 'rgba(0,255,135,0.2)'
          : isOver
            ? 'rgba(255,59,92,0.2)'
            : 'rgba(124,92,252,0.12)',
      }}
    >
      <CardContent className='p-4 space-y-3'>
        {/* Header */}
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='font-sans text-sm font-semibold text-[#f0efff] truncate'>
                {goal.name}
              </span>
              {goal.isCompleted && (
                <Badge
                  className='font-mono text-[9px] border-0 shrink-0'
                  style={{
                    background: 'rgba(0,255,135,0.15)',
                    color: '#00ff87',
                  }}
                >
                  <Trophy className='h-2.5 w-2.5 mr-1' /> Done
                </Badge>
              )}
              {isOver && !goal.isCompleted && (
                <Badge
                  className='font-mono text-[9px] border-0 shrink-0'
                  style={{
                    background: 'rgba(255,59,92,0.15)',
                    color: '#ff3b5c',
                  }}
                >
                  <AlertCircle className='h-2.5 w-2.5 mr-1' /> Over limit
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-2 mt-1 flex-wrap'>
              <Badge
                className='font-mono text-[9px] border-0 shrink-0'
                style={{
                  background: isSavings
                    ? 'rgba(124,92,252,0.15)'
                    : 'rgba(0,212,255,0.12)',
                  color: isSavings ? '#9d7fff' : '#00d4ff',
                }}
              >
                {isSavings ? (
                  <Target className='h-2.5 w-2.5 mr-1 inline' />
                ) : (
                  <TrendingDown className='h-2.5 w-2.5 mr-1 inline' />
                )}
                {isSavings ? 'Savings' : 'Spending limit'}
              </Badge>
              {goal.category && (
                <span
                  className='font-mono text-[9px]'
                  style={{ color: CATEGORY_COLORS[goal.category] }}
                >
                  {CATEGORY_EMOJI[goal.category]} {goal.category}
                </span>
              )}
            </div>
          </div>
          <div className='flex items-center gap-1 shrink-0'>
            <button
              onClick={() => onEdit(goal)}
              aria-label='Edit goal'
              className='w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#4a4870] hover:text-[#9d7fff] hover:bg-[rgba(124,92,252,0.1)] transition-colors'
            >
              <Pencil className='h-4 w-4' />
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              aria-label='Delete goal'
              className='w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-[#4a4870] hover:text-[#ff3b5c] hover:bg-[rgba(255,59,92,0.1)] transition-colors'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>

        <ProgressBar
          progress={goal.progress}
          type={goal.type}
          isCompleted={goal.isCompleted}
        />

        {/* Amounts */}
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-mono text-xs text-[#f0efff] font-semibold'>
              {fmt(goal.currentAmount)}
            </p>
            <p className='font-mono text-[10px] text-[#4a4870]'>
              {isSavings ? 'saved' : 'spent'} of {fmt(goal.targetAmount)}
            </p>
          </div>
          <div className='text-right'>
            <p
              className='font-mono text-sm font-bold'
              style={{
                color: goal.isCompleted
                  ? '#00ff87'
                  : isOver
                    ? '#ff3b5c'
                    : '#9d7fff',
              }}
            >
              {goal.progress}%
            </p>
            {isSavings && !goal.isCompleted && (
              <p className='font-mono text-[10px] text-[#4a4870]'>
                {fmt(goal.targetAmount - goal.currentAmount)} left
              </p>
            )}
          </div>
        </div>

        {/* Deadline / period */}
        {(goal.deadline || goal.period) && (
          <div className='flex items-center gap-1.5 pt-1'>
            <Calendar className='h-3 w-3 text-[#4a4870] shrink-0' />
            <span className='font-mono text-[10px] text-[#4a4870]'>
              {goal.deadline
                ? `Deadline: ${new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : `Period: ${goal.period}`}
            </span>
          </div>
        )}

        {/* Quick adjust (savings only) */}
        {isSavings && !goal.isCompleted && (
          <div className='flex items-center gap-2 pt-1'>
            <span className='font-mono text-[10px] text-[#4a4870] mr-auto'>
              Quick adjust
            </span>
            {[100, 500, 1000].map((delta) => (
              <button
                key={delta}
                onClick={() => onAdjust(goal.id, delta)}
                className='px-2 py-1 rounded-lg font-mono text-[10px] transition-colors'
                style={{
                  background: 'rgba(0,255,135,0.08)',
                  color: '#00ff87',
                  border: '1px solid rgba(0,255,135,0.15)',
                }}
              >
                +{delta >= 1000 ? '1k' : delta}
              </button>
            ))}
            <button
              onClick={() => onAdjust(goal.id, -100)}
              className='px-2 py-1 rounded-lg font-mono text-[10px] transition-colors'
              style={{
                background: 'rgba(255,59,92,0.08)',
                color: '#ff3b5c',
                border: '1px solid rgba(255,59,92,0.15)',
              }}
            >
              <Minus className='h-2.5 w-2.5' />
            </button>
          </div>
        )}

        {/* Mark complete — NOW WORKS FOR BOTH SAVINGS AND SPENDING_LIMIT */}
        {!goal.isCompleted && (
          <button
            onClick={() => onMarkComplete(goal.id)}
            className='w-full p-2.5 rounded-xl font-mono text-xs text-left transition-colors flex items-center gap-2'
            style={{
              background: 'rgba(0,255,135,0.06)',
              border: '1px solid rgba(0,255,135,0.15)',
              color: '#00ff87',
            }}
          >
            <Check className='h-3.5 w-3.5' />
            Mark as completed
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Blank form ────────────────────────────────────────────────────────────────

const BLANK: CreateGoalInput = {
  name: '',
  type: 'SAVINGS',
  targetAmount: 0,
  currentAmount: 0,
  category: undefined,
  period: currentMonthStr(),
  deadline: '',
  notes: '',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const fmt = useFmt();
  const { data: goals = [], isLoading } = useGoals();
  const { mutate: createGoal, isPending: isCreating } = useCreateGoal();
  const { mutate: updateGoal, isPending: isUpdating } = useUpdateGoal();
  const { mutate: deleteGoal } = useDeleteGoal();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FinancialGoal | null>(null);
  const [form, setForm] = useState<CreateGoalInput>(BLANK);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.isCompleted).length;
  const totalSaved = goals
    .filter((g) => g.type === 'SAVINGS')
    .reduce((s, g) => s + g.currentAmount, 0);
  const savingsGoals = goals.filter((g) => g.type === 'SAVINGS');
  const spendingGoals = goals.filter((g) => g.type === 'SPENDING_LIMIT');

  function openAdd() {
    setEditTarget(null);
    setForm({ ...BLANK, period: currentMonthStr() });
    setSheetOpen(true);
  }

  function openEdit(goal: FinancialGoal) {
    setEditTarget(goal);
    setForm({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      category: goal.category ?? undefined,
      period: goal.period ?? currentMonthStr(),
      deadline: goal.deadline ?? '',
      notes: goal.notes ?? '',
    });
    setSheetOpen(true);
  }

  function handleSubmit() {
    const payload: CreateGoalInput = {
      ...form,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount ?? 0),
      category: form.type === 'SPENDING_LIMIT' ? form.category : undefined,
      period: form.type === 'SPENDING_LIMIT' ? form.period : undefined,
      deadline:
        form.type === 'SAVINGS' && form.deadline ? form.deadline : undefined,
    };
    if (editTarget) {
      updateGoal(
        { id: editTarget.id, data: payload },
        { onSuccess: () => setSheetOpen(false) },
      );
    } else {
      createGoal(payload, { onSuccess: () => setSheetOpen(false) });
    }
  }

  function handleAdjust(id: number, delta: number) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    updateGoal({
      id,
      data: { currentAmount: Math.max(0, goal.currentAmount + delta) },
    });
  }

  // FIX: Now handles isCompleted for BOTH SAVINGS and SPENDING_LIMIT goals
  function handleMarkComplete(id: number) {
    updateGoal({ id, data: { isCompleted: true } });
  }

  const isPending = isCreating || isUpdating;

  return (
    <div
      className='flex flex-col h-full'
      style={{ background: '#080810', overflow: 'hidden' }}
    >
      {/* Sticky header */}
      <div
        className='shrink-0 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between'
        style={{
          borderBottom: '1px solid rgba(124,92,252,0.1)',
          background: 'rgba(8,8,16,0.97)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}
      >
        <div>
          <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>
            Financial Goals
          </h1>
          <p className='font-mono text-[10px] text-[#4a4870]'>
            Track savings &amp; spending targets
          </p>
        </div>
        <Button
          onClick={openAdd}
          className='gap-1.5 h-9 px-3 text-white font-display font-bold text-sm shrink-0'
          style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}
        >
          <Plus className='h-4 w-4' /> New Goal
        </Button>
      </div>

      {/* Scrollable content */}
      <div
        className='flex-1 min-h-0'
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className='px-4 sm:px-6 py-4 space-y-4 pb-8 max-w-3xl mx-auto'>
          {/* Stats */}
          {totalGoals > 0 && (
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
              {[
                { label: 'Total Goals', value: totalGoals, color: '#9d7fff' },
                { label: 'Completed', value: completedGoals, color: '#00ff87' },
                {
                  label: 'Savings Goals',
                  value: savingsGoals.length,
                  color: '#7c5cfc',
                },
                {
                  label: 'Spending Limits',
                  value: spendingGoals.length,
                  color: '#00d4ff',
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className='rounded-xl p-3 text-center'
                  style={{
                    background: 'rgba(13,13,26,0.8)',
                    border: '1px solid rgba(124,92,252,0.1)',
                  }}
                >
                  <p
                    className='font-display text-lg font-bold'
                    style={{ color }}
                  >
                    {value}
                  </p>
                  <p className='font-mono text-[10px] text-[#4a4870] mt-0.5'>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {savingsGoals.length > 0 && (
            <div
              className='rounded-xl p-3 flex items-center justify-between'
              style={{
                background: 'rgba(0,255,135,0.05)',
                border: '1px solid rgba(0,255,135,0.12)',
              }}
            >
              <div className='flex items-center gap-2'>
                <Target className='h-4 w-4 text-[#00ff87]' />
                <span className='font-sans text-sm text-[#00ff87] font-semibold'>
                  Total saved across goals
                </span>
              </div>
              <span className='font-mono text-sm font-bold text-[#00ff87]'>
                {fmt(totalSaved)}
              </span>
            </div>
          )}

          {isLoading && (
            <div className='text-center py-16'>
              <div className='w-8 h-8 rounded-full border-2 border-[#7c5cfc] border-t-transparent animate-spin mx-auto' />
            </div>
          )}

          {!isLoading && goals.length === 0 && (
            <div className='text-center py-16 space-y-3'>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto'
                style={{
                  background: 'rgba(124,92,252,0.1)',
                  border: '1px solid rgba(124,92,252,0.2)',
                }}
              >
                <Target className='h-8 w-8 text-[#7c5cfc]' />
              </div>
              <p className='font-sans text-base font-semibold text-[#f0efff]'>
                No goals yet
              </p>
              <p className='font-mono text-xs text-[#4a4870]'>
                Set savings targets or monthly spending limits
              </p>
              <Button
                onClick={openAdd}
                className='gap-1.5 text-white font-display font-bold'
                style={{
                  background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                }}
              >
                <Plus className='h-4 w-4' /> Create First Goal
              </Button>
            </div>
          )}

          {goals.length > 0 && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  fmt={fmt}
                  onEdit={openEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onAdjust={handleAdjust}
                  onMarkComplete={handleMarkComplete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side='right'
          className='w-full sm:w-[420px] overflow-y-auto'
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(124,92,252,0.2)',
            maxHeight: '100dvh',
          }}
        >
          <SheetHeader className='mb-5'>
            <SheetTitle className='font-display text-[#f0efff]'>
              {editTarget ? 'Edit Goal' : 'New Goal'}
            </SheetTitle>
          </SheetHeader>
          <div className='space-y-4'>
            {/* Type toggle */}
            <div className='grid grid-cols-2 gap-2'>
              {(['SAVINGS', 'SPENDING_LIMIT'] as GoalType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, type: t }))}
                  className='p-3 rounded-xl text-center transition-all font-mono text-xs'
                  style={{
                    background:
                      form.type === t
                        ? 'rgba(124,92,252,0.2)'
                        : 'rgba(8,8,16,0.6)',
                    border: `1px solid ${form.type === t ? 'rgba(124,92,252,0.5)' : 'rgba(124,92,252,0.1)'}`,
                    color: form.type === t ? '#f0efff' : '#4a4870',
                  }}
                >
                  {t === 'SAVINGS' ? '🎯 Savings goal' : '📉 Spending limit'}
                </button>
              ))}
            </div>

            <div className='space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                Goal name
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder={
                  form.type === 'SAVINGS'
                    ? 'e.g. Emergency fund'
                    : 'e.g. Dining budget'
                }
                className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                style={{ background: 'rgba(8,8,16,0.6)' }}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                {form.type === 'SAVINGS'
                  ? 'Target amount (₹)'
                  : 'Spending limit (₹)'}
              </Label>
              <Input
                type='number'
                min={1}
                value={form.targetAmount || ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    targetAmount: Number(e.target.value),
                  }))
                }
                placeholder='0'
                className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                style={{ background: 'rgba(8,8,16,0.6)' }}
              />
            </div>

            {form.type === 'SAVINGS' && (
              <div className='space-y-1.5'>
                <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                  Already saved (₹)
                </Label>
                <Input
                  type='number'
                  min={0}
                  value={form.currentAmount || ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      currentAmount: Number(e.target.value),
                    }))
                  }
                  placeholder='0'
                  className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                  style={{ background: 'rgba(8,8,16,0.6)' }}
                />
              </div>
            )}

            {form.type === 'SPENDING_LIMIT' && (
              <>
                <div className='space-y-1.5'>
                  <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                    Category (optional — blank = all)
                  </Label>
                  <Select
                    value={form.category ?? 'ALL'}
                    onValueChange={(v) =>
                      setForm((p) => ({
                        ...p,
                        category: v === 'ALL' ? undefined : (v as Category),
                      }))
                    }
                  >
                    <SelectTrigger
                      className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                      style={{ background: 'rgba(8,8,16,0.6)' }}
                    >
                      <SelectValue placeholder='All categories' />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: '#0d0d1a',
                        border: '1px solid rgba(124,92,252,0.2)',
                      }}
                    >
                      <SelectItem value='ALL' className='text-[#f0efff]'>
                        All categories
                      </SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          className='text-[#f0efff]'
                        >
                          {CATEGORY_EMOJI[c]} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1.5'>
                  <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                    Month (YYYY-MM)
                  </Label>
                  <Input
                    value={form.period ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, period: e.target.value }))
                    }
                    placeholder={currentMonthStr()}
                    className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                    style={{ background: 'rgba(8,8,16,0.6)' }}
                  />
                </div>
              </>
            )}

            {form.type === 'SAVINGS' && (
              <div className='space-y-1.5'>
                <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                  Deadline (optional)
                </Label>
                <Input
                  type='date'
                  value={form.deadline ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, deadline: e.target.value }))
                  }
                  className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                  style={{
                    background: 'rgba(8,8,16,0.6)',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            )}

            <div className='space-y-1.5'>
              <Label className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
                Notes (optional)
              </Label>
              <Input
                value={form.notes ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder='Optional notes'
                className='h-11 border-[rgba(124,92,252,0.15)] text-[#f0efff]'
                style={{ background: 'rgba(8,8,16,0.6)' }}
              />
            </div>

            {/* Mark complete in edit mode — NOW WORKS FOR BOTH TYPES */}
            {editTarget && !editTarget.isCompleted && (
              <button
                onClick={() => {
                  updateGoal(
                    { id: editTarget.id, data: { isCompleted: true } },
                    { onSuccess: () => setSheetOpen(false) },
                  );
                }}
                className='w-full p-3 rounded-xl font-mono text-xs text-left transition-colors flex items-center gap-2'
                style={{
                  background: 'rgba(0,255,135,0.06)',
                  border: '1px solid rgba(0,255,135,0.15)',
                  color: '#00ff87',
                }}
              >
                <Check className='h-3.5 w-3.5' /> Mark as completed
              </button>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isPending || !form.name.trim() || !form.targetAmount}
              className='w-full h-11 gap-2 text-white font-display font-bold'
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
              }}
            >
              {isPending ? (
                <div className='h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin' />
              ) : editTarget ? (
                'Save Changes'
              ) : (
                'Create Goal'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(255,59,92,0.2)',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[#f0efff]'>
              Delete goal?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-[#8b89b0] font-mono text-xs'>
              This goal will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className='border-[rgba(124,92,252,0.2)] text-[#8b89b0]'
              style={{ background: 'rgba(8,8,16,0.6)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId !== null) deleteGoal(deleteId);
                setDeleteId(null);
              }}
              className='border-0 text-white gap-2'
              style={{ background: 'rgba(255,59,92,0.7)' }}
            >
              <Trash2 className='h-4 w-4' /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
