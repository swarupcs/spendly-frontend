import { useState } from 'react';
import {
  CreditCard,
  Check,
  Zap,
  Loader2,
  Crown,
  MessageSquare,
  PieChart,
  AlertCircle,
  CalendarClock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useBilling,
  useSubscribe,
  useVerifyPayment,
  useCancelSubscription,
} from '@/services/billing.service';

// ─── Razorpay window type ─────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Usage bar ────────────────────────────────────────────────────────────────
function UsageBar({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ElementType;
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = limit && pct >= 80;
  const isAtLimit = limit && used >= limit;

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between text-sm'>
        <div className='flex items-center gap-2 text-[--foreground-muted]'>
          <Icon size={14} />
          <span>{label}</span>
        </div>
        <span
          className='font-mono text-xs'
          style={{ color: isAtLimit ? '#ff6b6b' : isNearLimit ? '#f59e0b' : '#8b89b0' }}
        >
          {limit ? `${used} / ${limit}` : `${used} / ∞`}
        </span>
      </div>
      {limit ? (
        <Progress
          value={pct}
          className='h-1.5 bg-[rgba(124,92,252,0.1)]'
          style={
            {
              '--progress-color': isAtLimit
                ? '#ef4444'
                : isNearLimit
                  ? '#f59e0b'
                  : '#7c5cfc',
            } as React.CSSProperties
          }
        />
      ) : (
        <div
          className='h-1.5 rounded-full'
          style={{ background: 'linear-gradient(90deg, #7c5cfc, #00d4ff)' }}
        />
      )}
    </div>
  );
}

// ─── Feature list item ────────────────────────────────────────────────────────
function Feature({ text, included }: { text: string; included: boolean }) {
  return (
    <div className='flex items-center gap-2.5 text-sm'>
      {included ? (
        <Check size={14} className='text-[#00d4ff] shrink-0' />
      ) : (
        <X size={14} className='text-[#4a4870] shrink-0' />
      )}
      <span className={included ? 'text-[--foreground-muted]' : 'text-[#4a4870] line-through'}>
        {text}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const { data: billing, isLoading, error } = useBilling();
  const { mutateAsync: subscribe } = useSubscribe();
  const { mutateAsync: verifyPayment } = useVerifyPayment();
  const { mutateAsync: cancelSub } = useCancelSubscription();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isPro = billing?.plan === 'PRO';
  const isCancelling = billing?.cancelAtPeriodEnd;

  async function handleUpgrade() {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setCheckoutError('Failed to load Razorpay. Check your connection.');
        return;
      }
      const { subscriptionId, keyId } = await subscribe();
      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Spendly',
        description: 'Pro Plan · ₹299/month',
        image: '/logo.svg',
        theme: { color: '#7c5cfc' },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccessMsg('You are now on PRO! Enjoy unlimited access.');
          } catch {
            setCheckoutError('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setCheckoutLoading(false) },
      });
      rzp.open();
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Upgrade failed');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      await cancelSub();
      setShowCancelDialog(false);
      setSuccessMsg('Subscription will cancel at the end of the current billing period.');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Cancellation failed');
      setShowCancelDialog(false);
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className='h-full overflow-y-auto'>
      <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
        {/* ── Header ── */}
        <div className='flex items-center gap-3'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center shrink-0'
            style={{ background: 'linear-gradient(135deg, #7c5cfc22, #00d4ff22)', border: '1px solid rgba(124,92,252,0.3)' }}
          >
            <CreditCard size={18} style={{ color: '#7c5cfc' }} />
          </div>
          <div>
            <h1 className='font-display text-2xl font-bold text-[--foreground]'>Billing & Plans</h1>
            <p className='text-sm text-[--foreground-subtle]'>Manage your subscription and usage</p>
          </div>
          {isPro && !isCancelling && (
            <Badge
              className='ml-auto font-mono text-xs px-3 py-1'
              style={{
                background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(0,212,255,0.15))',
                border: '1px solid rgba(124,92,252,0.4)',
                color: '#9d7fff',
              }}
            >
              <Crown size={11} className='mr-1' />
              PRO
            </Badge>
          )}
        </div>

        {/* ── Alerts ── */}
        {checkoutError && (
          <Alert className='border-red-900/40 bg-red-950/20'>
            <AlertCircle size={15} className='text-red-400' />
            <AlertDescription className='text-red-300 text-sm'>{checkoutError}</AlertDescription>
          </Alert>
        )}
        {successMsg && (
          <Alert className='border-[rgba(124,92,252,0.3)] bg-[rgba(124,92,252,0.08)]'>
            <Check size={15} style={{ color: '#00d4ff' }} />
            <AlertDescription className='text-[--foreground-muted] text-sm'>{successMsg}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 size={28} className='animate-spin text-[--violet-bright]' />
          </div>
        ) : error ? (
          <Alert className='border-red-900/40 bg-red-950/20'>
            <AlertCircle size={15} className='text-red-400' />
            <AlertDescription className='text-red-300 text-sm'>Failed to load billing info.</AlertDescription>
          </Alert>
        ) : billing ? (
          <>
            {/* ── Current usage ── */}
            <Card
              className='border-[rgba(124,92,252,0.15)]'
              style={{ background: 'rgba(124,92,252,0.05)' }}
            >
              <CardHeader className='pb-3'>
                <CardTitle className='text-base text-[--foreground] flex items-center justify-between'>
                  <span>This Month's Usage</span>
                  {isCancelling && billing.currentPeriodEnd && (
                    <div className='flex items-center gap-1.5 text-xs text-[#f59e0b] font-mono font-normal'>
                      <CalendarClock size={12} />
                      Cancels {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </CardTitle>
                <CardDescription className='text-[--foreground-subtle] text-sm'>
                  Resets on the 1st of each month
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <UsageBar
                  label='Expenses logged'
                  used={billing.usage.expenses}
                  limit={billing.usage.limits.expenses}
                  icon={PieChart}
                />
                <UsageBar
                  label='AI chat messages'
                  used={billing.usage.aiMessages}
                  limit={billing.usage.limits.aiMessages}
                  icon={MessageSquare}
                />
              </CardContent>
            </Card>

            {/* ── Plan cards ── */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* FREE card */}
              <Card
                className='relative border'
                style={{
                  background: !isPro ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: !isPro ? 'rgba(124,92,252,0.4)' : 'rgba(124,92,252,0.1)',
                }}
              >
                {!isPro && (
                  <div
                    className='absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-mono font-semibold'
                    style={{
                      background: 'linear-gradient(90deg, #7c5cfc, #00d4ff)',
                      color: '#fff',
                    }}
                  >
                    Current plan
                  </div>
                )}
                <CardHeader className='pb-3'>
                  <CardTitle className='text-[--foreground] text-xl font-display'>Free</CardTitle>
                  <div className='text-3xl font-display font-bold text-[--foreground]'>
                    ₹0
                    <span className='text-sm font-normal font-sans text-[--foreground-subtle] ml-1'>
                      / month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-2.5'>
                  <Feature text='100 expenses / month' included />
                  <Feature text='15 AI chat messages / month' included />
                  <Feature text='Budgets & recurring expenses' included />
                  <Feature text='Email alerts' included />
                  <Feature text='Unlimited expenses' included={false} />
                  <Feature text='Unlimited AI chat' included={false} />
                </CardContent>
              </Card>

              {/* PRO card */}
              <Card
                className='relative border'
                style={{
                  background: isPro ? 'rgba(124,92,252,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: isPro ? 'rgba(124,92,252,0.4)' : 'rgba(124,92,252,0.1)',
                }}
              >
                {isPro && !isCancelling && (
                  <div
                    className='absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-mono font-semibold'
                    style={{
                      background: 'linear-gradient(90deg, #7c5cfc, #00d4ff)',
                      color: '#fff',
                    }}
                  >
                    Current plan
                  </div>
                )}
                {/* Glow for PRO card */}
                <div
                  className='absolute inset-0 rounded-xl pointer-events-none'
                  style={{
                    background:
                      'radial-gradient(ellipse at top right, rgba(0,212,255,0.06), transparent 60%)',
                  }}
                />
                <CardHeader className='pb-3'>
                  <div className='flex items-center gap-2'>
                    <CardTitle className='text-[--foreground] text-xl font-display'>Pro</CardTitle>
                    <Crown size={14} className='text-[#00d4ff]' />
                  </div>
                  <div className='text-3xl font-display font-bold text-[--foreground]'>
                    ₹299
                    <span className='text-sm font-normal font-sans text-[--foreground-subtle] ml-1'>
                      / month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='space-y-2.5'>
                  <Feature text='Unlimited expenses' included />
                  <Feature text='Unlimited AI chat' included />
                  <Feature text='Budgets & recurring expenses' included />
                  <Feature text='Email alerts' included />
                  <Feature text='Priority support' included />
                  <Feature text='All future features' included />

                  <div className='pt-3'>
                    {!isPro ? (
                      billing.billingEnabled ? (
                        <Button
                          className='w-full font-semibold'
                          onClick={handleUpgrade}
                          disabled={checkoutLoading}
                          style={{
                            background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                            boxShadow: checkoutLoading
                              ? 'none'
                              : '0 0 20px rgba(124,92,252,0.4)',
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {checkoutLoading ? (
                            <Loader2 size={15} className='animate-spin mr-2' />
                          ) : (
                            <Zap size={15} className='mr-2' />
                          )}
                          Upgrade to Pro
                        </Button>
                      ) : (
                        <p className='text-xs text-[--foreground-subtle] text-center pt-1'>
                          Billing not configured yet
                        </p>
                      )
                    ) : isCancelling ? (
                      <div className='space-y-2'>
                        <p className='text-xs text-[#f59e0b] text-center'>
                          Cancels at end of billing period
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant='ghost'
                        className='w-full text-[--foreground-subtle] hover:text-red-400 hover:bg-red-950/20 text-sm border border-transparent hover:border-red-900/40'
                        onClick={() => setShowCancelDialog(true)}
                      >
                        Cancel subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Billing info footer ── */}
            {isPro && billing.currentPeriodEnd && (
              <p className='text-center text-xs text-[--foreground-subtle] font-mono'>
                {isCancelling ? 'Access until' : 'Renews on'}{' '}
                {new Date(billing.currentPeriodEnd).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* ── Cancel confirmation dialog ── */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent
          className='border-[rgba(124,92,252,0.2)]'
          style={{ background: '#0d0d1a' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className='text-[--foreground]'>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription className='text-[--foreground-subtle]'>
              Your PRO access will continue until the end of the current billing period. After that,
              your account will revert to the Free plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className='border-[rgba(124,92,252,0.2)] text-[--foreground-muted] hover:bg-[rgba(124,92,252,0.08)]'
              disabled={cancelLoading}
            >
              Keep PRO
            </AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700 text-white border-0'
              onClick={handleCancel}
              disabled={cancelLoading}
            >
              {cancelLoading ? <Loader2 size={14} className='animate-spin mr-1.5' /> : null}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
