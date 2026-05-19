import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Download,
  Edit2,
  Save,
  X,
  Search,
  Loader2,
  SlidersHorizontal,
  RefreshCw,
  Receipt,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { ExportDialog } from '@/components/ExportDialog';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from '@/services/expenses.service';
import type {
  Category,
  Expense,
  ExpenseFilters,
  CreateExpenseInput,
} from '@/api/expenses.api';
import { CURRENCIES, getCurrencySymbol } from '@/api/currency.api';
import { useUserCurrency, useExchangeRates, useFmt } from '@/hooks/useCurrency';
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

const CATEGORY_LABEL: Record<Category, string> = {
  DINING: 'Dining',
  SHOPPING: 'Shopping',
  TRANSPORT: 'Transport',
  ENTERTAINMENT: 'Entertainment',
  UTILITIES: 'Utilities',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  OTHER: 'Other',
};

const CATEGORY_EMOJI: Record<Category, string> = {
  DINING: '🍽️',
  SHOPPING: '🛍️',
  TRANSPORT: '🚗',
  ENTERTAINMENT: '🎮',
  UTILITIES: '⚡',
  HEALTH: '💊',
  EDUCATION: '📚',
  OTHER: '📦',
};

const CATEGORY_COLORS: Record<Category, string> = {
  DINING: '#ff2d78',
  SHOPPING: '#9d7fff',
  TRANSPORT: '#00d4ff',
  ENTERTAINMENT: '#ffb830',
  UTILITIES: '#00ff87',
  HEALTH: '#ff6b9d',
  EDUCATION: '#5b8fff',
  OTHER: '#4a4870',
};

const EMPTY_FORM = {
  title: '',
  category: 'OTHER' as Category,
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  currency: 'INR',
  exchangeRate: '1',
  merchant: '',
  isTaxDeductible: false,
};

// ─── Expense Form ─────────────────────────────────────────────────────────────
function ExpenseForm({
  editingId,
  formData,
  setFormData,
  isSaving,
  formError,
  onSubmit,
  onCancel,
  homeCurrency,
}: {
  editingId: number | null;
  formData: typeof EMPTY_FORM;
  setFormData: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  isSaving: boolean;
  formError: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  homeCurrency: string;
}) {
  const isForeign = formData.currency !== homeCurrency;
  const { data: rates, isFetching: fetchingRates } = useExchangeRates(
    isForeign ? formData.currency : homeCurrency,
  );

  useEffect(() => {
    if (!isForeign) {
      setFormData((p) => ({ ...p, exchangeRate: '1' }));
      return;
    }
    if (rates) {
      const rate = rates[homeCurrency];
      if (rate) setFormData((p) => ({ ...p, exchangeRate: rate.toFixed(4) }));
    }
  }, [formData.currency, rates, isForeign, homeCurrency, setFormData]);

  const previewConverted =
    isForeign && formData.amount && formData.exchangeRate
      ? (
          parseFloat(formData.amount) * parseFloat(formData.exchangeRate)
        ).toFixed(2)
      : null;

  return (
    <form onSubmit={onSubmit} className='space-y-4'>
      {formError && (
        <div
          className='p-3 rounded-xl text-[#ff3b5c] text-sm'
          style={{
            background: 'rgba(255,59,92,0.08)',
            border: '1px solid rgba(255,59,92,0.2)',
          }}
        >
          {formError}
        </div>
      )}

      {/* Title */}
      <div className='space-y-1.5'>
        <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
          Title
        </Label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData((p) => ({ ...p, title: e.target.value }))
          }
          placeholder='e.g., Coffee'
          className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
        />
      </div>

      {/* Amount + Currency */}
      <div className='grid grid-cols-[1fr_140px] gap-2'>
        <div className='space-y-1.5'>
          <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
            Amount ({getCurrencySymbol(formData.currency)})
          </Label>
          <Input
            type='number'
            step='0.01'
            inputMode='decimal'
            value={formData.amount}
            onChange={(e) =>
              setFormData((p) => ({ ...p, amount: e.target.value }))
            }
            placeholder='0.00'
            className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
          />
        </div>
        <div className='space-y-1.5'>
          <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
            Currency
          </Label>
          <Select
            value={formData.currency}
            onValueChange={(v) => setFormData((p) => ({ ...p, currency: v }))}
          >
            <SelectTrigger className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] h-11'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              className='bg-[#0d0d1a] border-[rgba(124,92,252,0.2)]'
              style={{ maxHeight: '280px' }}
            >
              {CURRENCIES.map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className='text-[#f0efff] focus:bg-[rgba(124,92,252,0.1)]'
                >
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exchange rate (foreign currency) */}
      {isForeign && (
        <div className='space-y-1.5'>
          <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest flex items-center gap-1.5'>
            Rate ({formData.currency} → {homeCurrency})
            {fetchingRates && (
              <RefreshCw className='h-3 w-3 animate-spin text-[#7c5cfc]' />
            )}
          </Label>
          <Input
            type='number'
            step='0.0001'
            value={formData.exchangeRate}
            onChange={(e) =>
              setFormData((p) => ({ ...p, exchangeRate: e.target.value }))
            }
            className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
          />
          {previewConverted && (
            <p className='font-mono text-[10px] text-[#00d4ff]'>
              ≈ {getCurrencySymbol(homeCurrency)}
              {Number(previewConverted).toLocaleString()} {homeCurrency}
            </p>
          )}
        </div>
      )}

      {/* Category + Date */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='space-y-1.5'>
          <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
            Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={(v) =>
              setFormData((p) => ({ ...p, category: v as Category }))
            }
          >
            <SelectTrigger className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] h-11'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-[#0d0d1a] border-[rgba(124,92,252,0.2)]'>
              {CATEGORIES.map((c) => (
                <SelectItem
                  key={c}
                  value={c}
                  className='text-[#f0efff] focus:bg-[rgba(124,92,252,0.1)]'
                >
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-1.5'>
          <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
            Date
          </Label>
          <Input
            type='date'
            value={formData.date}
            onChange={(e) =>
              setFormData((p) => ({ ...p, date: e.target.value }))
            }
            className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 [color-scheme:dark] h-11'
          />
        </div>
      </div>

      {/* Merchant — NEW */}
      <div className='space-y-1.5'>
        <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest flex items-center gap-1.5'>
          <Receipt className='w-3 h-3' /> Merchant
          <span className='normal-case text-[#4a4870]'>(optional)</span>
        </Label>
        <Input
          value={formData.merchant}
          onChange={(e) =>
            setFormData((p) => ({ ...p, merchant: e.target.value }))
          }
          placeholder='e.g. Zomato, BigBasket, Uber…'
          className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
        />
      </div>

      {/* Notes */}
      <div className='space-y-1.5'>
        <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
          Notes <span className='normal-case text-[#4a4870]'>(optional)</span>
        </Label>
        <Input
          value={formData.notes}
          onChange={(e) =>
            setFormData((p) => ({ ...p, notes: e.target.value }))
          }
          placeholder='Any extra context…'
          className='bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
        />
      </div>

      {/* Tax Deductible toggle — NEW */}
      <div
        className='flex items-center justify-between p-3 rounded-xl'
        style={{
          background: 'rgba(124,92,252,0.06)',
          border: '1px solid rgba(124,92,252,0.12)',
        }}
      >
        <div className='flex items-center gap-2'>
          <ShieldCheck className='w-4 h-4 text-[#00ff87]' />
          <div>
            <p className='font-sans text-sm text-[#f0efff]'>Tax Deductible</p>
            <p className='font-mono text-[10px] text-[#4a4870]'>
              Mark as business/deductible expense
            </p>
          </div>
        </div>
        <button
          type='button'
          onClick={() =>
            setFormData((p) => ({ ...p, isTaxDeductible: !p.isTaxDeductible }))
          }
          className='relative w-11 h-6 rounded-full transition-all duration-200 shrink-0'
          style={{
            background: formData.isTaxDeductible
              ? '#00ff87'
              : 'rgba(74,72,112,0.3)',
            boxShadow: formData.isTaxDeductible
              ? '0 0 10px rgba(0,255,135,0.4)'
              : 'none',
          }}
        >
          <span
            className='absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200'
            style={{ left: formData.isTaxDeductible ? '22px' : '2px' }}
          />
        </button>
      </div>

      {/* Actions */}
      <div className='flex gap-2.5 pt-1'>
        <Button
          type='submit'
          disabled={isSaving}
          className='flex-1 h-11 gap-2 font-display font-bold text-white'
          style={{
            background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
            boxShadow: '0 0 20px rgba(124,92,252,0.25)',
          }}
        >
          {isSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          {editingId ? 'Update' : 'Add'} Expense
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

// ─── Mobile Expense Card ──────────────────────────────────────────────────────
function MobileExpenseCard({
  exp,
  onEdit,
  onDelete,
  onAskAi,
}: {
  exp: Expense;
  onEdit: (exp: Expense) => void;
  onDelete: (exp: Expense) => void;
  onAskAi: (exp: Expense) => void;
}) {
  const homeCurrency = useUserCurrency();
  const color = CATEGORY_COLORS[exp.category] ?? '#4a4870';
  const isForeign = exp.currency && exp.currency !== homeCurrency;

  return (
    <Card
      className='border-[rgba(124,92,252,0.08)] transition-all'
      style={{ background: 'rgba(13,13,26,0.7)' }}
    >
      <CardContent className='p-3.5'>
        <div className='flex items-center gap-3'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0'
            style={{ background: `${color}15`, border: `1px solid ${color}25` }}
          >
            {CATEGORY_EMOJI[exp.category] ?? '📦'}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-sans text-sm font-semibold text-[#f0efff] truncate'>
              {exp.title}
            </p>
            <div className='flex items-center gap-1.5 mt-0.5 flex-wrap'>
              <span
                className='font-mono text-[9px] px-1.5 py-0.5 rounded-md'
                style={{ background: `${color}15`, color }}
              >
                {CATEGORY_LABEL[exp.category]}
              </span>
              <span className='font-mono text-[9px] text-[#4a4870]'>
                {exp.date}
              </span>
              {/* Merchant badge — NEW */}
              {exp.merchant && (
                <span className='font-mono text-[9px] text-[#4a4870] flex items-center gap-0.5'>
                  <Receipt className='w-2.5 h-2.5' /> {exp.merchant}
                </span>
              )}
              {/* Tax deductible badge — NEW */}
              {exp.isTaxDeductible && (
                <span
                  className='font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5'
                  style={{
                    background: 'rgba(0,255,135,0.1)',
                    color: '#00ff87',
                    border: '1px solid rgba(0,255,135,0.2)',
                  }}
                >
                  <ShieldCheck className='w-2.5 h-2.5' /> Tax
                </span>
              )}
            </div>
          </div>
          <div className='flex flex-col items-end gap-2 shrink-0'>
            <div className='text-right'>
              <span
                className='font-display text-base font-bold block'
                style={{ color }}
              >
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: exp.currency ?? homeCurrency,
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 0,
                }).format(exp.amount)}
              </span>
              {isForeign && (
                <span className='font-mono text-[9px] text-[#4a4870]'>
                  ≈{' '}
                  {new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: homeCurrency,
                    maximumFractionDigits: 0,
                  }).format(exp.convertedAmount)}
                </span>
              )}
            </div>
            <div className='flex gap-1.5'>
              <button
                onClick={() => onAskAi(exp)}
                className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{
                  background: 'rgba(124,92,252,0.1)',
                  border: '1px solid rgba(124,92,252,0.2)',
                  color: '#9d7fff',
                }}
                title='Ask AI about this expense'
              >
                <MessageSquare className='w-3.5 h-3.5' />
              </button>
              <button
                onClick={() => onEdit(exp)}
                className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{
                  background: 'rgba(91,143,255,0.1)',
                  border: '1px solid rgba(91,143,255,0.2)',
                  color: '#5b8fff',
                }}
              >
                <Edit2 className='w-3.5 h-3.5' />
              </button>
              <button
                onClick={() => onDelete(exp)}
                className='w-8 h-8 rounded-lg flex items-center justify-center'
                style={{
                  background: 'rgba(255,59,92,0.08)',
                  border: '1px solid rgba(255,59,92,0.2)',
                  color: '#ff3b5c',
                }}
              >
                <Trash2 className='w-3.5 h-3.5' />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filter Sheet (mobile) — now includes date range ─────────────────────────
function FilterSheet({
  open,
  onClose,
  selectedCategory,
  onSelectCategory,
  fromDate,
  toDate,
  onSetFrom,
  onSetTo,
}: {
  open: boolean;
  onClose: () => void;
  selectedCategory: Category | null;
  onSelectCategory: (c: Category | null) => void;
  fromDate: string;
  toDate: string;
  onSetFrom: (v: string) => void;
  onSetTo: (v: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side='bottom'
        className='rounded-t-3xl'
        style={{
          background: '#0d0d1a',
          border: '1px solid rgba(124,92,252,0.2)',
          maxHeight: '85dvh',
          overflowY: 'auto',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <SheetHeader className='mb-5'>
          <SheetTitle className='font-display text-[#f0efff]'>
            Filter Expenses
          </SheetTitle>
        </SheetHeader>

        {/* Date range — NEW in mobile filter */}
        <div className='mb-5 space-y-3'>
          <p className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest'>
            Date Range
          </p>
          <div className='grid grid-cols-2 gap-2'>
            <div className='space-y-1'>
              <Label className='font-mono text-[9px] text-[#4a4870]'>
                From
              </Label>
              <Input
                type='date'
                value={fromDate}
                onChange={(e) => onSetFrom(e.target.value)}
                className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] text-sm'
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className='space-y-1'>
              <Label className='font-mono text-[9px] text-[#4a4870]'>To</Label>
              <Input
                type='date'
                value={toDate}
                onChange={(e) => onSetTo(e.target.value)}
                className='h-10 bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff] text-sm'
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                onSetFrom('');
                onSetTo('');
              }}
              className='font-mono text-[10px] text-[#ff3b5c]'
            >
              Clear dates
            </button>
          )}
        </div>

        <p className='font-mono text-[10px] text-[#4a4870] uppercase tracking-widest mb-3'>
          Category
        </p>
        <div className='grid grid-cols-2 gap-2.5'>
          {[null, ...CATEGORIES].map((cat) => {
            const isActive = selectedCategory === cat;
            const color = cat ? CATEGORY_COLORS[cat] : '#7c5cfc';
            return (
              <button
                key={cat ?? 'all'}
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className='flex items-center gap-2.5 px-3.5 py-3 rounded-xl font-sans text-sm font-medium text-left transition-all'
                style={{
                  border: `1px solid ${isActive ? color + '50' : 'rgba(124,92,252,0.12)'}`,
                  background: isActive ? `${color}15` : 'rgba(13,13,26,0.8)',
                  color: isActive ? color : '#8b89b0',
                }}
              >
                <span className='text-base'>
                  {cat ? CATEGORY_EMOJI[cat] : '🔍'}
                </span>
                <span>{cat ? CATEGORY_LABEL[cat] : 'All'}</span>
                {isActive && (
                  <span
                    className='ml-auto w-1.5 h-1.5 rounded-full'
                    style={{ background: color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const homeCurrency = useUserCurrency();
  const fmt = useFmt();
  const navigate = useNavigate();

  const handleAskAi = (exp: Expense) => {
    const q = `Tell me about my ${exp.category.toLowerCase()} expense "${exp.title}" for ${fmt(exp.convertedAmount)} on ${exp.date}${exp.merchant ? ` at ${exp.merchant}` : ''}`;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };


  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  // Date range state — NEW
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    currency: homeCurrency,
  });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const [showExport, setShowExport] = useState(false);

  const { data, isLoading } = useExpenses(filters);
  const { mutateAsync: createExpense, isPending: isCreating } =
    useCreateExpense();
  const { mutateAsync: updateExpense, isPending: isUpdating } =
    useUpdateExpense();
  const { mutateAsync: deleteExpense } = useDeleteExpense();

  const expenses = data?.expenses ?? [];
  const isSaving = isCreating || isUpdating;
  const totalAmount = expenses.reduce((s, e) => s + e.convertedAmount, 0);
  const hasActiveFilters = !!(
    selectedCategory ||
    fromDate ||
    toDate ||
    searchQuery
  );

  // Apply date range to filters
  const applyDateFilter = (from: string, to: string) => {
    setFromDate(from);
    setToDate(to);
    setFilters((p) => ({ ...p, from: from || undefined, to: to || undefined }));
  };

  const handleCategorySelect = (cat: Category | null) => {
    setSelectedCategory(cat);
    setFilters((p) => ({ ...p, category: cat ?? undefined }));
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setFilters((p) => ({ ...p, search: q || undefined }));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM, currency: homeCurrency });
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      setFormError('Title and amount are required.');
      return;
    }
    setFormError('');
    const payload: CreateExpenseInput = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      exchangeRate: parseFloat(formData.exchangeRate) || 1,
      category: formData.category,
      date: formData.date,
      notes: formData.notes || undefined,
      merchant: formData.merchant || undefined, // NEW
      isTaxDeductible: formData.isTaxDeductible, // NEW
    };
    try {
      if (editingId) {
        await updateExpense({ id: editingId, data: payload });
      } else {
        await createExpense(payload);
      }
      resetForm();
    } catch (err: unknown) {
      setFormError(
        (err as { message?: string }).message ?? 'Something went wrong',
      );
    }
  };

  const handleEdit = (exp: Expense) => {
    setFormData({
      title: exp.title,
      category: exp.category,
      amount: exp.amount.toString(),
      date: exp.date,
      notes: exp.notes ?? '',
      currency: exp.currency ?? homeCurrency,
      exchangeRate: (exp.exchangeRate ?? 1).toString(),
      merchant: exp.merchant ?? '', // NEW
      isTaxDeductible: exp.isTaxDeductible ?? false, // NEW
    });
    setEditingId(exp.id);
    setShowForm(true);
  };

  return (
    <div
      className='flex flex-col h-full'
      style={{ background: '#080810', overflow: 'hidden' }}
    >
      {/* Sticky Header */}
      <div
        className='shrink-0 px-4 sm:px-6 py-3.5 sm:py-4'
        style={{
          borderBottom: '1px solid rgba(124,92,252,0.1)',
          background: 'rgba(8,8,16,0.97)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <h1 className='font-display text-xl sm:text-2xl font-extrabold text-[#f0efff] tracking-tight'>
              Expenses
            </h1>
            <p className='font-mono text-[10px] text-[#4a4870]'>
              {isLoading
                ? 'Loading…'
                : `${expenses.length} transactions · ${fmt(totalAmount)}`}
            </p>
          </div>
          <div className='flex items-center gap-2 shrink-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowExport(true)}
              className='hidden sm:flex gap-1.5 border-[rgba(124,92,252,0.18)] text-[#8b89b0] hover:text-[#f0efff] hover:border-[rgba(124,92,252,0.35)]'
            >
              <Download className='w-3.5 h-3.5' /> Export
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setShowFilterSheet(true)}
              className='sm:hidden h-9 w-9 border-[rgba(124,92,252,0.18)] text-[#8b89b0] relative'
            >
              <SlidersHorizontal className='w-4 h-4' />
              {hasActiveFilters && (
                <span
                  className='absolute -top-1 -right-1 w-2 h-2 rounded-full'
                  style={{ background: '#7c5cfc' }}
                />
              )}
            </Button>
            <Button
              onClick={() => {
                setEditingId(null);
                setFormData({ ...EMPTY_FORM, currency: homeCurrency });
                setShowForm(true);
              }}
              size='sm'
              className='h-9 gap-1.5 font-display font-bold text-white'
              style={{
                background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                boxShadow: '0 0 16px rgba(124,92,252,0.3)',
              }}
            >
              <Plus className='w-4 h-4' />
              <span className='hidden sm:inline'>Add Expense</span>
              <span className='sm:hidden'>Add</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='relative mt-3'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a4870]' />
          <Input
            placeholder='Search expenses…'
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className='pl-10 h-10 bg-[rgba(13,13,26,0.8)] border-[rgba(124,92,252,0.15)] text-[#f0efff] placeholder:text-[#4a4870] focus-visible:ring-[#7c5cfc]/30'
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4870] hover:text-[#8b89b0]'
            >
              <X className='w-3.5 h-3.5' />
            </button>
          )}
        </div>

        {/* Desktop filters: date range + category pills */}
        <div className='hidden sm:flex items-center gap-3 mt-3 flex-wrap'>
          {/* Date range — NEW on desktop */}
          <div className='flex items-center gap-2 shrink-0'>
            <Input
              type='date'
              value={fromDate}
              onChange={(e) => applyDateFilter(e.target.value, toDate)}
              className='h-8 w-36 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]'
              style={{ colorScheme: 'dark' }}
            />
            <span className='font-mono text-[10px] text-[#4a4870]'>→</span>
            <Input
              type='date'
              value={toDate}
              onChange={(e) => applyDateFilter(fromDate, e.target.value)}
              className='h-8 w-36 text-xs bg-[rgba(124,92,252,0.06)] border-[rgba(124,92,252,0.15)] text-[#f0efff]'
              style={{ colorScheme: 'dark' }}
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => applyDateFilter('', '')}
                className='text-[#4a4870] hover:text-[#ff3b5c] transition-colors'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className='flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide'>
            {[null, ...CATEGORIES].map((cat) => {
              const isActive = selectedCategory === cat;
              const color = cat ? CATEGORY_COLORS[cat] : '#7c5cfc';
              return (
                <button
                  key={cat ?? 'all'}
                  onClick={() => handleCategorySelect(cat)}
                  className='shrink-0 px-3 py-1.5 rounded-full font-mono text-[10px] transition-all whitespace-nowrap'
                  style={{
                    border: `1px solid ${isActive ? color + '60' : 'rgba(124,92,252,0.12)'}`,
                    background: isActive ? `${color}15` : 'transparent',
                    color: isActive ? color : '#8b89b0',
                    boxShadow: isActive ? `0 0 12px ${color}20` : 'none',
                  }}
                >
                  {cat ? CATEGORY_LABEL[cat] : 'All'}
                </button>
              );
            })}
          </div>
        </div>
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
        <div className='p-4 sm:p-5 space-y-3 pb-6'>
          {/* Active filter badges (mobile) */}
          {hasActiveFilters && (
            <div className='flex items-center gap-2 flex-wrap sm:hidden'>
              {(fromDate || toDate) && (
                <button
                  onClick={() => applyDateFilter('', '')}
                  className='flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px]'
                  style={{
                    background: 'rgba(124,92,252,0.12)',
                    border: '1px solid rgba(124,92,252,0.3)',
                    color: '#9d7fff',
                  }}
                >
                  {fromDate || '…'} → {toDate || '…'} <X className='w-3 h-3' />
                </button>
              )}
              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect(null)}
                  className='flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px]'
                  style={{
                    background: `${CATEGORY_COLORS[selectedCategory]}15`,
                    border: `1px solid ${CATEGORY_COLORS[selectedCategory]}40`,
                    color: CATEGORY_COLORS[selectedCategory],
                  }}
                >
                  {CATEGORY_LABEL[selectedCategory]} <X className='w-3 h-3' />
                </button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className='space-y-2.5'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className='h-20 rounded-2xl shimmer'
                  style={{ background: 'rgba(124,92,252,0.05)' }}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && expenses.length === 0 && (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <div className='text-5xl mb-4'>📭</div>
              <p className='font-display text-base font-bold text-[#f0efff] mb-1'>
                No expenses found
              </p>
              <p className='text-[#4a4870] text-sm'>
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Tap "Add" to record your first expense'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilters({});
                    setSearchQuery('');
                    setSelectedCategory(null);
                    applyDateFilter('', '');
                  }}
                  className='mt-4 font-mono text-[10px] text-[#7c5cfc] underline underline-offset-2'
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Mobile cards */}
          {!isLoading && expenses.length > 0 && (
            <>
              <div className='sm:hidden space-y-2.5'>
                {expenses.map((exp) => (
                  <MobileExpenseCard
                    key={exp.id}
                    exp={exp}
                    onEdit={handleEdit}
                    onDelete={setDeleteConfirm}
                    onAskAi={handleAskAi}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div
                className='hidden sm:block rounded-2xl overflow-hidden'
                style={{
                  background: 'rgba(13,13,26,0.7)',
                  border: '1px solid rgba(124,92,252,0.12)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <table className='w-full border-collapse'>
                  <thead>
                    <tr
                      style={{ borderBottom: '1px solid rgba(124,92,252,0.1)' }}
                    >
                      {[
                        'Title',
                        'Category',
                        'Amount',
                        'Date',
                        'Merchant',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          className='px-5 py-3.5 font-mono text-[10px] text-[#4a4870] uppercase tracking-widest font-medium text-left'
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => {
                      const color = CATEGORY_COLORS[exp.category] ?? '#4a4870';
                      return (
                        <tr
                          key={exp.id}
                          className='hover:bg-[rgba(124,92,252,0.04)] transition-colors'
                          style={{
                            borderBottom: '1px solid rgba(124,92,252,0.06)',
                          }}
                        >
                          <td className='px-5 py-3.5'>
                            <div className='font-sans text-sm font-medium text-[#f0efff]'>
                              {exp.title}
                            </div>
                            {/* Tax badge in title cell — NEW */}
                            {exp.isTaxDeductible && (
                              <span
                                className='inline-flex items-center gap-0.5 font-mono text-[9px] px-1.5 py-0.5 rounded mt-0.5'
                                style={{
                                  background: 'rgba(0,255,135,0.1)',
                                  color: '#00ff87',
                                  border: '1px solid rgba(0,255,135,0.2)',
                                }}
                              >
                                <ShieldCheck className='w-2.5 h-2.5' /> Tax
                              </span>
                            )}
                          </td>
                          <td className='px-5 py-3.5'>
                            <span
                              className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px]'
                              style={{
                                border: `1px solid ${color}30`,
                                background: `${color}0f`,
                                color,
                              }}
                            >
                              <span
                                className='w-1.5 h-1.5 rounded-full'
                                style={{
                                  background: color,
                                  boxShadow: `0 0 5px ${color}`,
                                }}
                              />
                              {CATEGORY_LABEL[exp.category]}
                            </span>
                          </td>
                          <td className='px-5 py-3.5'>
                            <div
                              className='font-display text-sm font-bold'
                              style={{ color }}
                            >
                              {new Intl.NumberFormat(undefined, {
                                style: 'currency',
                                currency: exp.currency ?? homeCurrency,
                                maximumFractionDigits: 2,
                                minimumFractionDigits: 0,
                              }).format(exp.amount)}
                            </div>
                            {exp.currency && exp.currency !== homeCurrency && (
                              <div className='font-mono text-[9px] text-[#4a4870] mt-0.5'>
                                ≈ {fmt(exp.convertedAmount)}
                              </div>
                            )}
                          </td>
                          <td className='px-5 py-3.5 font-mono text-[11px] text-[#4a4870]'>
                            {new Date(exp.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          {/* Merchant column — NEW */}
                          <td className='px-5 py-3.5'>
                            {exp.merchant ? (
                              <span className='font-mono text-[10px] text-[#8b89b0] flex items-center gap-1'>
                                <Receipt className='w-3 h-3 text-[#4a4870]' />{' '}
                                {exp.merchant}
                              </span>
                            ) : (
                              <span className='font-mono text-[10px] text-[#2d2b4e]'>
                                —
                              </span>
                            )}
                          </td>
                          <td className='px-5 py-3.5'>
                            <div className='flex gap-1.5'>
                              <button
                                onClick={() => handleAskAi(exp)}
                                className='w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all'
                                style={{
                                  background: 'rgba(124,92,252,0.08)',
                                  border: '1px solid rgba(124,92,252,0.2)',
                                  color: '#9d7fff',
                                }}
                                title='Ask AI about this expense'
                              >
                                <MessageSquare className='w-3 h-3' />
                              </button>
                              <button
                                onClick={() => handleEdit(exp)}
                                className='w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all'
                                style={{
                                  background: 'rgba(91,143,255,0.08)',
                                  border: '1px solid rgba(91,143,255,0.2)',
                                  color: '#5b8fff',
                                }}
                              >
                                <Edit2 className='w-3 h-3' />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(exp)}
                                className='w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all'
                                style={{
                                  background: 'rgba(255,59,92,0.08)',
                                  border: '1px solid rgba(255,59,92,0.2)',
                                  color: '#ff3b5c',
                                }}
                              >
                                <Trash2 className='w-3 h-3' />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Export — mobile */}
              <div className='sm:hidden pt-1'>
                <Button
                  variant='outline'
                  onClick={() => setShowExport(true)}
                  className='w-full h-11 gap-2 border-[rgba(124,92,252,0.18)] text-[#8b89b0] hover:text-[#f0efff]'
                >
                  <Download className='w-4 h-4' /> Export CSV
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit form sheet (mobile) */}
      <Sheet
        open={showForm}
        onOpenChange={(open) => {
          if (!open) resetForm();
        }}
      >
        <SheetContent
          side='bottom'
          className='rounded-t-3xl'
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(124,92,252,0.2)',
            maxHeight: '95dvh',
            overflowY: 'auto',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          }}
        >
          <SheetHeader className='mb-5'>
            <SheetTitle className='font-display text-[#f0efff]'>
              {editingId ? 'Edit Expense' : 'New Expense'}
            </SheetTitle>
          </SheetHeader>
          <ExpenseForm
            editingId={editingId}
            formData={formData}
            setFormData={setFormData}
            isSaving={isSaving}
            formError={formError}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            homeCurrency={homeCurrency}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop inline form */}
      {showForm && (
        <div
          className='hidden sm:block fixed inset-x-0 bottom-0 z-30 px-6 pb-6'
          style={{ pointerEvents: 'none' }}
        >
          <div
            className='max-w-2xl mx-auto rounded-2xl p-6'
            style={{
              background: 'rgba(13,13,26,0.97)',
              border: '1px solid rgba(124,92,252,0.25)',
              backdropFilter: 'blur(30px)',
              boxShadow: '0 -8px 40px rgba(124,92,252,0.12)',
              pointerEvents: 'all',
            }}
          >
            <div className='flex items-center gap-2.5 mb-5'>
              <div
                className='w-0.5 h-5 rounded-sm'
                style={{
                  background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)',
                }}
              />
              <span className='font-display text-base font-bold text-[#f0efff]'>
                {editingId ? 'Edit Expense' : 'New Expense'}
              </span>
            </div>
            <ExpenseForm
              editingId={editingId}
              formData={formData}
              setFormData={setFormData}
              isSaving={isSaving}
              formError={formError}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              homeCurrency={homeCurrency}
            />
          </div>
        </div>
      )}

      {/* Mobile filter sheet (now includes date range) */}
      <FilterSheet
        open={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        fromDate={fromDate}
        toDate={toDate}
        onSetFrom={(v) => applyDateFilter(v, toDate)}
        onSetTo={(v) => applyDateFilter(fromDate, v)}
      />

      {/* Export dialog */}
      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        defaultFrom={filters.from}
        defaultTo={filters.to}
        defaultCategory={filters.category}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent
          className='border-[rgba(255,59,92,0.3)] max-w-[90vw] sm:max-w-md'
          style={{
            background: '#0d0d1a',
            boxShadow: '0 0 60px rgba(255,59,92,0.1)',
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className='font-display text-[#f0efff]'>
              Delete expense?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-[#8b89b0]'>
              <span className='text-[#f0efff] font-medium'>
                {deleteConfirm?.title}
              </span>{' '}
              (₹{deleteConfirm?.amount.toLocaleString('en-IN')}) will be
              permanently deleted.
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
              onClick={async () => {
                if (deleteConfirm) {
                  await deleteExpense(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
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
