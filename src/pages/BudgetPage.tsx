import { useState } from 'react';
import { Plus, Trash2, Edit2, Target, AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useBudgetOverview, useUpsertBudget, useDeleteBudget } from '@/services/budget.service';
import { useFmt } from '@/hooks/useCurrency';
import type { Category, UpsertBudgetInput } from '@/api/expenses.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  'DINING', 'SHOPPING', 'TRANSPORT', 'ENTERTAINMENT',
  'UTILITIES', 'HEALTH', 'EDUCATION', 'OTHER',
];

const CATEGORY_LABEL: Record<Category, string> = {
  DINING: 'Dining', SHOPPING: 'Shopping', TRANSPORT: 'Transport',
  ENTERTAINMENT: 'Entertainment', UTILITIES: 'Utilities',
  HEALTH: 'Health', EDUCATION: 'Education', OTHER: 'Other',
};

const CATEGORY_EMOJI: Record<Category, string> = {
  DINING: '🍽️', SHOPPING: '🛍️', TRANSPORT: '🚗', ENTERTAINMENT: '🎮',
  UTILITIES: '⚡', HEALTH: '💊', EDUCATION: '📚', OTHER: '📦',
};

const CATEGORY_COLORS: Record<Category, string> = {
  DINING: '#ff2d78', SHOPPING: '#9d7fff', TRANSPORT: '#00d4ff',
  ENTERTAINMENT: '#ffb830', UTILITIES: '#00ff87', HEALTH: '#ff6b9d',
  EDUCATION: '#5b8fff', OTHER: '#4a4870',
};

type BudgetItem = {
  id: number;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
};

// ─── Budget Progress Card ─────────────────────────────────────────────────────

function BudgetCard({
  item,
  onEdit,
  onDelete,
}: {
  item: BudgetItem;
  onEdit: (item: BudgetItem) => void;
  onDelete: (item: BudgetItem) => void;
}) {
  const fmt = useFmt();
  const color = CATEGORY_COLORS[item.category];
  const pct = Math.min(item.percentage, 100);
  const statusColor = item.isOverBudget
    ? '#ff3b5c'
    : item.percentage >= 80
      ? '#ffb830'
      : '#00ff87';

  return (
    <Card
      className='border-[rgba(124,92,252,0.1)] transition-all hover:border-[rgba(124,92,252,0.25)]'
      style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}
    >
      <CardContent className='p-4'>
        {/* Header row */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2.5'>
            <div
              className='w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0'
              style={{
                background: `${color}15`,
                border: `1px solid ${color}25`,
              }}
            >
              {CATEGORY_EMOJI[item.category]}
            </div>
            <div>
              <p className='font-sans text-sm font-semibold text-[#f0efff]'>
                {CATEGORY_LABEL[item.category]}
              </p>
              <div className='flex items-center gap-1.5 mt-0.5'>
                {item.isOverBudget ? (
                  <AlertTriangle
                    className='w-3 h-3'
                    style={{ color: '#ff3b5c' }}
                  />
                ) : item.percentage >= 80 ? (
                  <AlertTriangle
                    className='w-3 h-3'
                    style={{ color: '#ffb830' }}
                  />
                ) : (
                  <CheckCircle2
                    className='w-3 h-3'
                    style={{ color: '#00ff87' }}
                  />
                )}
                <span
                  className='font-mono text-[9px]'
                  style={{ color: statusColor }}
                >
                  {item.isOverBudget
                    ? `${fmt(Math.abs(item.remaining))} over budget`
                    : item.percentage >= 80
                      ? `${item.percentage}% used — almost there`
                      : `${fmt(item.remaining)} remaining`}
                </span>
              </div>
            </div>
          </div>
          <div className='flex items-center gap-1.5 shrink-0'>
            <button
              onClick={() => onEdit(item)}
              aria-label='Edit budget'
              className='w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors'
              style={{
                background: 'rgba(91,143,255,0.1)',
                border: '1px solid rgba(91,143,255,0.2)',
                color: '#5b8fff',
              }}
            >
              <Edit2 className='w-4 h-4' />
            </button>
            <button
              onClick={() => onDelete(item)}
              aria-label='Delete budget'
              className='w-10 h-10 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors'
              style={{
                background: 'rgba(255,59,92,0.08)',
                border: '1px solid rgba(255,59,92,0.2)',
                color: '#ff3b5c',
              }}
            >
              <Trash2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className='h-2 rounded-full overflow-hidden mb-2'
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <div
            className='h-full rounded-full transition-all duration-500'
            style={{
              width: `${pct}%`,
              background: item.isOverBudget
                ? 'linear-gradient(90deg, #ff3b5c, #ff6b8a)'
                : item.percentage >= 80
                  ? 'linear-gradient(90deg, #ffb830, #ffd080)'
                  : `linear-gradient(90deg, ${color}, ${color}cc)`,
              boxShadow: `0 0 8px ${statusColor}40`,
            }}
          />
        </div>

        {/* Amount row */}
        <div className='flex items-center justify-between'>
          <span className='font-mono text-[10px] text-[#4a4870]'>
            {fmt(item.spent)} spent
          </span>
          <span className='font-mono text-[10px]' style={{ color }}>
            {fmt(item.limit)} limit
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Budget Form ──────────────────────────────────────────────────────────────

function BudgetForm({
  initial,
  usedCategories,
  onSave,
  onCancel,
}: {
  initial: { category: Category; amount: string } | null;
  usedCategories: Category[];
  onSave: (data: UpsertBudgetInput) => void;
  onCancel: () => void;
}) {
  const isEditing = !!initial;
  const [category, setCategory] = useState<Category>(initial?.category ?? 'DINING');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [error, setError] = useState('');
  const { isPending } = useUpsertBudget();

  const availableCategories = isEditing
    ? CATEGORIES
    : CATEGORIES.filter((c) => !usedCategories.includes(c));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount greater than 0');
      return;
    }
    onSave({ category, amount: amt });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <div
          className='p-3 rounded-xl text-[#ff3b5c] text-sm'
          style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.2)' }}
        >
          {error}
        </div>
      )}

      <div className='space-y-1.5'>
        <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
          Category
        </Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as Category)}
          disabled={isEditing}
        >
          <SelectTrigger className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] h-11'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='bg-[#0d0d1a] border-[rgba(124,92,252,0.2)]'>
            {availableCategories.map((c) => (
              <SelectItem key={c} value={c} className='text-[#f0efff] focus:bg-[rgba(124,92,252,0.1)]'>
                {CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isEditing && availableCategories.length === 0 && (
          <p className='font-mono text-[10px] text-[#ffb830]'>All categories have budgets set.</p>
        )}
      </div>

      <div className='space-y-1.5'>
        <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
          Monthly Limit
        </Label>
        <Input
          type='number'
          step='1'
          inputMode='decimal'
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder='e.g. 5000'
          className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
        />
      </div>

      <div className='flex gap-2.5 pt-1'>
        <Button
          type='submit'
          disabled={isPending || (!isEditing && availableCategories.length === 0)}
          className='flex-1 h-11 gap-2 font-display font-bold text-white'
          style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)', boxShadow: '0 0 20px rgba(124,92,252,0.25)' }}
        >
          {isPending ? <Loader2 className='w-4 h-4 animate-spin' /> : <Target className='w-4 h-4' />}
          {isEditing ? 'Update' : 'Set'} Budget
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          className='h-11 gap-2 border-[rgba(124,92,252,0.18)] text-[#8b89b0] hover:text-[#f0efff]'
        >
          <X className='w-4 h-4' />
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const fmt = useFmt();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const { data: overview = [], isLoading } = useBudgetOverview(currentMonth);
  const { mutate: upsertBudget } = useUpsertBudget();
  const { mutate: deleteBudget } = useDeleteBudget();

  const [showForm, setShowForm] = useState(false);
const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<BudgetItem | null>(null);

  const usedCategories = overview.map((o) => o.category);
  const overBudgetCount = overview.filter((o) => o.isOverBudget).length;
  const totalLimit = overview.reduce((s, o) => s + o.limit, 0);
  const totalSpent = overview.reduce((s, o) => s + o.spent, 0);
  const totalPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  const handleSave = (data: UpsertBudgetInput) => {
    upsertBudget(data, {
      onSuccess: () => {
        setShowForm(false);
        setEditingItem(null);
      },
    });
  };

  return (
    <div className='flex flex-col h-full' style={{ background: '#080810', overflow: 'hidden' }}>
      {/* ── Sticky Header ── */}
      <div
        className='shrink-0 px-4 sm:px-6 py-3.5 sm:py-4'
        style={{
          borderBottom: '1px solid rgba(124,92,252,0.1)',
          background: 'rgba(8,8,16,0.97)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}
      >
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>
              Budgets
            </h1>
            <p className='font-mono text-[10px] text-[#4a4870]'>
              {isLoading ? 'Loading…' : `${monthLabel} · ${overview.length} categories`}
            </p>
          </div>
          <Button
            onClick={() => { setEditingItem(null); setShowForm(true); }}
            size='sm'
            disabled={usedCategories.length >= CATEGORIES.length}
            className='h-9 gap-1.5 font-display font-bold text-white'
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)', boxShadow: '0 0 16px rgba(124,92,252,0.3)' }}
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Add Budget</span>
            <span className='sm:hidden'>Add</span>
          </Button>
        </div>
      </div>

      {/* ── Scroll Content ── */}
      <div
        className='flex-1 min-h-0'
        style={{ overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}
      >
        <div className='p-4 sm:p-5 space-y-4 pb-8'>

          {/* ── Summary card (only when budgets exist) ── */}
          {!isLoading && overview.length > 0 && (
            <Card
              className='border-[rgba(124,92,252,0.12)] overflow-hidden'
              style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}
            >
              <CardContent className='p-4 sm:p-5'>
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <p className='font-mono text-[9px] text-[#4a4870] uppercase tracking-widest mb-1'>
                      Overall Budget
                    </p>
                    <div className='flex items-end gap-1.5'>
                      <span className='font-display text-2xl font-extrabold text-[#f0efff]'>
                        {totalPct}%
                      </span>
                      <span className='font-mono text-[10px] text-[#4a4870] mb-0.5'>used</span>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='font-mono text-[10px] text-[#4a4870]'>
                      {fmt(totalSpent)}
                      <span className='text-[#2d2b4e]'> / </span>
                      {fmt(totalLimit)}
                    </p>
                    {overBudgetCount > 0 && (
                      <div className='flex items-center gap-1 mt-1 justify-end'>
                        <AlertTriangle className='w-3 h-3 text-[#ff3b5c]' />
                        <span className='font-mono text-[9px] text-[#ff3b5c]'>
                          {overBudgetCount} over budget
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall progress bar */}
                <div
                  className='h-2.5 rounded-full overflow-hidden'
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className='h-full rounded-full transition-all duration-500'
                    style={{
                      width: `${Math.min(totalPct, 100)}%`,
                      background: totalPct > 100
                        ? 'linear-gradient(90deg, #ff3b5c, #ff6b8a)'
                        : totalPct >= 80
                        ? 'linear-gradient(90deg, #ffb830, #ffd080)'
                        : 'linear-gradient(90deg, #7c5cfc, #00d4ff)',
                      boxShadow: '0 0 10px rgba(124,92,252,0.3)',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Loading skeletons ── */}
          {isLoading && (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='h-28 rounded-2xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {!isLoading && overview.length === 0 && (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='text-5xl mb-4'>🎯</div>
              <p className='font-display text-base font-bold text-[#f0efff] mb-1'>No budgets set</p>
              <p className='text-[#4a4870] text-sm mb-6'>
                Set monthly limits per category to track your spending.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className='h-10 gap-2 font-display font-bold text-white px-6'
                style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}
              >
                <Plus className='w-4 h-4' /> Set First Budget
              </Button>
            </div>
          )}

          {/* ── Budget cards ── */}
          {!isLoading && overview.length > 0 && (
            <div className='space-y-3'>
              {/* Over-budget first, then by percentage desc */}
              {[...overview]
                .sort((a, b) => {
                  if (a.isOverBudget !== b.isOverBudget) return a.isOverBudget ? -1 : 1;
                  return b.percentage - a.percentage;
                })
                .map((item) => (
                  <BudgetCard
                    key={item.id}
                    item={item}
                    onEdit={(i) => {
                      setEditingItem(i);
                      setShowForm(true);
                    }}
                    onDelete={setDeleteConfirm}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit sheet ── */}
      <Sheet
        open={showForm}
        onOpenChange={(open) => {
          if (!open) { setShowForm(false); setEditingItem(null); }
        }}
      >
        <SheetContent
          side='bottom'
          className='rounded-t-3xl'
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(124,92,252,0.2)',
            maxHeight: '80dvh',
            overflowY: 'auto',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
        >
          <SheetHeader className='mb-5'>
            <SheetTitle className='font-display text-[#f0efff]'>
              {editingItem ? `Edit ${CATEGORY_LABEL[editingItem.category]} Budget` : 'Set Budget'}
            </SheetTitle>
          </SheetHeader>
          <BudgetForm
            initial={editingItem ? { category: editingItem.category, amount: String(editingItem.limit) } : null}
            usedCategories={usedCategories}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingItem(null); }}
          />
        </SheetContent>
      </Sheet>

      {/* ── Desktop inline form ── */}
      {showForm && (
        <div className='hidden sm:block fixed inset-x-0 bottom-0 z-30 px-6 pb-6' style={{ pointerEvents: 'none' }}>
          <div
            className='max-w-md mx-auto rounded-2xl p-6'
            style={{
              background: 'rgba(13,13,26,0.97)',
              border: '1px solid rgba(124,92,252,0.25)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 -8px 40px rgba(124,92,252,0.12)',
              pointerEvents: 'all',
            }}
          >
            <div className='flex items-center gap-2.5 mb-5'>
              <div className='w-0.5 h-5 rounded-sm' style={{ background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)' }} />
              <span className='font-display text-base font-bold text-[#f0efff]'>
                {editingItem ? `Edit ${CATEGORY_LABEL[editingItem.category]} Budget` : 'Set Budget'}
              </span>
            </div>
            <BudgetForm
              initial={editingItem ? { category: editingItem.category, amount: String(editingItem.limit) } : null}
              usedCategories={usedCategories}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingItem(null); }}
            />
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent
          className='border-[rgba(255,59,92,0.3)] max-w-[90vw] sm:max-w-md'
          style={{ background: '#0d0d1a', boxShadow: '0 0 60px rgba(255,59,92,0.1)' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className='font-display text-[#f0efff]'>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription className='text-[#8b89b0]'>
              The{' '}
              <span className='text-[#f0efff] font-medium'>
                {deleteConfirm && CATEGORY_LABEL[deleteConfirm.category]}
              </span>{' '}
              monthly budget limit will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className='border-[rgba(255,255,255,0.1)] text-[#8b89b0]'
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirm) { deleteBudget(deleteConfirm.id); setDeleteConfirm(null); } }}
              className='border-[rgba(255,59,92,0.3)] text-[#ff3b5c] font-display font-semibold'
              style={{ background: 'rgba(255,59,92,0.15)' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
