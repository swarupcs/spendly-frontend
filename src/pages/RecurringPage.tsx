import { useState } from 'react';
import {
  useRecurringExpenses,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/services/recurring.service';
import type { RecurringExpense, Frequency, Category, CreateRecurringInput } from '@/api/expenses.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, RefreshCw, Calendar, AlertCircle } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  'DINING', 'SHOPPING', 'TRANSPORT', 'ENTERTAINMENT',
  'UTILITIES', 'HEALTH', 'EDUCATION', 'OTHER',
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'DAILY',   label: 'Daily' },
  { value: 'WEEKLY',  label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY',  label: 'Yearly' },
];

const CATEGORY_COLORS: Record<string, string> = {
  DINING: '#ff2d78', SHOPPING: '#9d7fff', TRANSPORT: '#00d4ff',
  ENTERTAINMENT: '#ffb830', UTILITIES: '#00ff87', HEALTH: '#ff6b9d',
  EDUCATION: '#5b8fff', OTHER: '#4a4870',
};

const CATEGORY_EMOJI: Record<string, string> = {
  DINING: '🍽️', SHOPPING: '🛍️', TRANSPORT: '🚗',
  ENTERTAINMENT: '🎮', UTILITIES: '⚡', HEALTH: '💊',
  EDUCATION: '📚', OTHER: '📦',
};

const FREQ_BADGE: Record<Frequency, { label: string; color: string }> = {
  DAILY:   { label: 'Daily',   color: '#ff2d78' },
  WEEKLY:  { label: 'Weekly',  color: '#9d7fff' },
  MONTHLY: { label: 'Monthly', color: '#00d4ff' },
  YEARLY:  { label: 'Yearly',  color: '#ffb830' },
};

// ─── Empty form state ─────────────────────────────────────────────────────────

function emptyForm(): CreateRecurringInput & { isActive: boolean } {
  return {
    title: '',
    amount: 0,
    category: 'OTHER',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0]!,
    notes: '',
    isActive: true,
  };
}

// ─── RecurringCard ────────────────────────────────────────────────────────────

function RecurringCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: RecurringExpense;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const color = CATEGORY_COLORS[item.category] ?? '#4a4870';
  const freq = FREQ_BADGE[item.frequency];
  const today = new Date().toISOString().split('T')[0]!;
  const isDue = item.isActive && item.nextDueDate <= today;

  return (
    <Card
      className='border-[rgba(124,92,252,0.12)] hover:border-[rgba(124,92,252,0.25)] transition-all'
      style={{
        background: item.isActive ? 'rgba(13,13,26,0.7)' : 'rgba(13,13,26,0.4)',
        backdropFilter: 'blur(20px)',
        opacity: item.isActive ? 1 : 0.6,
      }}
    >
      <CardContent className='p-4'>
        {/* Row 1 — icon + info get the full card width so titles stay readable */}
        <div className='flex items-center gap-3 min-w-0'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0'
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            {CATEGORY_EMOJI[item.category] ?? '📦'}
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='font-sans text-sm font-semibold text-[#f0efff] truncate'>
                {item.title}
              </span>
              {isDue && (
                <span className='flex items-center gap-1 text-[9px] font-mono text-[#ffb830] bg-[rgba(255,184,48,0.1)] border border-[rgba(255,184,48,0.25)] px-1.5 py-0.5 rounded'>
                  <AlertCircle className='w-2.5 h-2.5' /> Due
                </span>
              )}
            </div>
            <div className='flex items-center gap-2 mt-1 flex-wrap'>
              <span
                className='font-mono text-[9px] px-1.5 py-0.5 rounded'
                style={{ background: `${color}18`, color }}
              >
                {item.category}
              </span>
              <span
                className='font-mono text-[9px] px-1.5 py-0.5 rounded border'
                style={{ color: freq.color, borderColor: `${freq.color}40`, background: `${freq.color}10` }}
              >
                {freq.label}
              </span>
              <span className='font-mono text-[9px] text-[#4a4870] flex items-center gap-1'>
                <Calendar className='w-2.5 h-2.5' />
                Next: {item.nextDueDate}
              </span>
            </div>
            {item.notes && (
              <p className='font-mono text-[10px] text-[#4a4870] mt-1 truncate'>
                {item.notes}
              </p>
            )}
          </div>
        </div>

        {/* Row 2 — amount on the left, controls on the right with roomier tap targets */}
        <div className='flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[rgba(124,92,252,0.06)]'>
          <div className='font-display text-base font-bold' style={{ color }}>
            ₹{item.amount.toLocaleString('en-IN')}
          </div>
          <div className='flex items-center gap-1.5 shrink-0'>
            <Switch
              checked={item.isActive}
              onCheckedChange={onToggle}
            />
            <Button
              variant='ghost'
              size='icon'
              onClick={onEdit}
              aria-label='Edit recurring expense'
              className='w-9 h-9 sm:w-8 sm:h-8 text-[#8b89b0] hover:text-[#9d7fff] hover:bg-[rgba(124,92,252,0.1)]'
            >
              <Pencil className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={onDelete}
              aria-label='Delete recurring expense'
              className='w-9 h-9 sm:w-8 sm:h-8 text-[#8b89b0] hover:text-[#ff6b6b] hover:bg-red-950/20'
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RecurringPage() {
  const { data: items = [], isLoading } = useRecurringExpenses();
  const { mutate: create, isPending: creating } = useCreateRecurring();
  const { mutate: update, isPending: updating } = useUpdateRecurring();
  const { mutate: remove } = useDeleteRecurring();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<RecurringExpense | null>(null);
  const [error, setError] = useState('');

  const isSaving = creating || updating;

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setError('');
    setSheetOpen(true);
  }

  function openEdit(item: RecurringExpense) {
    setEditing(item);
    setForm({
      title: item.title,
      amount: item.amount,
      category: item.category,
      frequency: item.frequency,
      startDate: item.startDate,
      notes: item.notes ?? '',
      isActive: item.isActive,
    });
    setError('');
    setSheetOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.amount || form.amount <= 0) { setError('Amount must be positive'); return; }
    if (!form.startDate) { setError('Start date is required'); return; }
    setError('');

    const payload: CreateRecurringInput = {
      title: form.title.trim(),
      amount: form.amount,
      category: form.category,
      frequency: form.frequency,
      startDate: form.startDate,
      notes: form.notes?.trim() || undefined,
    };

    if (editing) {
      update(
        { id: editing.id, data: { ...payload, isActive: form.isActive } },
        { onSuccess: () => setSheetOpen(false) },
      );
    } else {
      create(payload, { onSuccess: () => setSheetOpen(false) });
    }
  }

  function handleToggle(item: RecurringExpense) {
    update({ id: item.id, data: { isActive: !item.isActive } });
  }

  const activeCount = items.filter((i) => i.isActive).length;
  const monthlyTotal = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => {
      const multiplier =
        i.frequency === 'DAILY' ? 30 :
        i.frequency === 'WEEKLY' ? 4.33 :
        i.frequency === 'MONTHLY' ? 1 :
        1 / 12;
      return sum + i.amount * multiplier;
    }, 0);

  return (
    <div className='flex flex-col h-full' style={{ background: '#080810', overflow: 'hidden' }}>
      {/* Header */}
      <div
        className='shrink-0 px-4 sm:px-8 py-4 sm:py-5'
        style={{
          borderBottom: '1px solid rgba(124,92,252,0.1)',
          background: 'rgba(8,8,16,0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className='flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-2 mb-1'>
              <RefreshCw className='w-3.5 h-3.5 text-[#7c5cfc]' />
              <span className='font-mono text-[9px] text-[#4a4870] uppercase tracking-[0.15em]'>
                Auto-logged expenses
              </span>
            </div>
            <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>
              Recurring
            </h1>
          </div>
          <Button
            onClick={openAdd}
            className='h-9 gap-2 font-sans text-sm font-semibold'
            style={{
              background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
              boxShadow: '0 0 20px rgba(124,92,252,0.4)',
              border: 'none',
            }}
          >
            <Plus className='w-4 h-4' />
            <span className='hidden sm:inline'>Add Recurring</span>
            <span className='sm:hidden'>Add</span>
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className='flex-1 min-h-0' style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        <div className='p-4 sm:p-6 space-y-4 pb-6'>

          {/* Summary strip */}
          {items.length > 0 && (
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
              {[
                { label: 'Active', value: String(activeCount), accent: '#7c5cfc' },
                { label: 'Est. Monthly', value: `₹${Math.round(monthlyTotal).toLocaleString('en-IN')}`, accent: '#00d4ff' },
                { label: 'Total Rules', value: String(items.length), accent: '#00ff87' },
              ].map((s) => (
                <Card
                  key={s.label}
                  className='border-[rgba(124,92,252,0.12)]'
                  style={{ background: 'rgba(13,13,26,0.7)', backdropFilter: 'blur(20px)' }}
                >
                  <CardContent className='p-3 sm:p-4'>
                    <div className='font-mono text-[9px] text-[#4a4870] uppercase tracking-wider mb-1'>
                      {s.label}
                    </div>
                    <div
                      className='font-display text-lg sm:text-xl font-extrabold'
                      style={{ color: s.accent }}
                    >
                      {s.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* List */}
          {isLoading && (
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='h-20 rounded-2xl shimmer' style={{ background: 'rgba(124,92,252,0.05)' }} />
              ))}
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='text-5xl mb-4'>🔄</div>
              <div className='font-display text-xl font-bold text-[#f0efff] mb-2'>
                No recurring expenses yet
              </div>
              <p className='text-[#4a4870] text-sm mb-6'>
                Add rent, subscriptions, EMIs — they'll be logged automatically.
              </p>
              <Button
                onClick={openAdd}
                className='gap-2 font-sans text-sm font-semibold'
                style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)', border: 'none' }}
              >
                <Plus className='w-4 h-4' /> Add your first recurring expense
              </Button>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className='space-y-3'>
              {items.map((item) => (
                <RecurringCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setDeleteTarget(item)}
                  onToggle={() => handleToggle(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side='right'
          className='w-full sm:max-w-[440px] border-l border-[rgba(124,92,252,0.2)] p-0 flex flex-col'
          style={{ background: '#0d0d1a' }}
        >
          <SheetHeader className='px-6 pt-6 pb-4 border-b border-[rgba(124,92,252,0.1)]'>
            <SheetTitle className='font-display text-lg font-bold text-[#f0efff]'>
              {editing ? 'Edit Recurring' : 'New Recurring Expense'}
            </SheetTitle>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-5 space-y-5'>
            {error && (
              <div className='flex items-center gap-2 text-[#ff6b6b] bg-red-950/20 border border-red-900/30 rounded-xl px-3 py-2.5'>
                <AlertCircle className='w-4 h-4 shrink-0' />
                <span className='font-sans text-sm'>{error}</span>
              </div>
            )}

            {/* Title */}
            <div className='space-y-1.5'>
              <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Title</Label>
              <Input
                placeholder='Netflix, Rent, Gym membership...'
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] placeholder:text-[#4a4870] focus-visible:ring-[#7c5cfc]'
              />
            </div>

            {/* Amount */}
            <div className='space-y-1.5'>
              <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Amount (₹)</Label>
              <Input
                type='number'
                placeholder='0'
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] placeholder:text-[#4a4870] focus-visible:ring-[#7c5cfc]'
              />
            </div>

            {/* Category + Frequency row */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
                >
                  <SelectTrigger className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus:ring-[#7c5cfc]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0d0d1a', border: '1px solid rgba(124,92,252,0.2)' }}>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className='text-[#f0efff] focus:bg-[rgba(124,92,252,0.1)]'>
                        {CATEGORY_EMOJI[c]} {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as Frequency }))}
                >
                  <SelectTrigger className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus:ring-[#7c5cfc]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#0d0d1a', border: '1px solid rgba(124,92,252,0.2)' }}>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value} className='text-[#f0efff] focus:bg-[rgba(124,92,252,0.1)]'>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start Date */}
            <div className='space-y-1.5'>
              <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Start Date</Label>
              <Input
                type='date'
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]'
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Notes */}
            <div className='space-y-1.5'>
              <Label className='font-sans text-xs font-medium text-[#8b89b0]'>Notes (optional)</Label>
              <Input
                placeholder='Any extra details...'
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className='bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] placeholder:text-[#4a4870] focus-visible:ring-[#7c5cfc]'
              />
            </div>

            {/* Active toggle — only in edit mode */}
            {editing && (
              <div className='flex items-center justify-between p-3 rounded-xl bg-[rgba(124,92,252,0.06)] border border-[rgba(124,92,252,0.12)]'>
                <div>
                  <div className='font-sans text-sm font-medium text-[#f0efff]'>Active</div>
                  <div className='font-mono text-[10px] text-[#4a4870]'>Pausing stops auto-logging</div>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            )}
          </div>

          <div className='px-6 py-4 border-t border-[rgba(124,92,252,0.1)] flex gap-3'>
            <Button
              variant='outline'
              onClick={() => setSheetOpen(false)}
              className='flex-1 border-[rgba(124,92,252,0.2)] text-[#8b89b0] hover:bg-[rgba(124,92,252,0.08)]'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className='flex-1 font-semibold'
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                border: 'none',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: '#0d0d1a', border: '1px solid rgba(124,92,252,0.2)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[#f0efff]'>Delete Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription className='text-[#8b89b0]'>
              <strong className='text-[#f0efff]'>{deleteTarget?.title}</strong> will stop being auto-logged.
              Past expenses already created are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-[rgba(124,92,252,0.2)] text-[#8b89b0] hover:bg-[rgba(124,92,252,0.08)]'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteTarget) { remove(deleteTarget.id); setDeleteTarget(null); } }}
              className='bg-red-600 hover:bg-red-700 text-white border-none'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
