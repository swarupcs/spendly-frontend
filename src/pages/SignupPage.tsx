import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { useSignUp, useGoogleAuthUrl } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

const PASSWORD_RULES = [
  { label: '8+ chars', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: signUp, isPending, error } = useSignUp();
  const { data: googleAuthUrl, isLoading: isLoadingGoogleUrl } =
    useGoogleAuthUrl();
  const googleError = searchParams.get('error') === 'google_auth_failed';

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const passwordStrength = PASSWORD_RULES.filter((r) =>
    r.test(form.password),
  ).length;
  const strengthColors = ['', '#ff3b5c', '#ffb830', '#84cc16', '#00ff87'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div
      className='min-h-dvh flex items-center justify-center px-4 py-8 relative overflow-hidden'
      style={{ background: '#080810' }}
    >
      <div
        className='absolute top-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full pointer-events-none'
        style={{
          background:
            'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className='absolute bottom-[-20%] left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full pointer-events-none'
        style={{
          background:
            'radial-gradient(circle, rgba(124,92,252,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,92,252,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className='w-full max-w-[420px] relative'>
        {/* Logo */}
        <div className='flex items-center gap-3 mb-8 sm:mb-10 justify-center'>
          <div
            className='w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0'
            style={{
              background: 'rgba(124,92,252,0.08)',
              border: '1px solid rgba(124,92,252,0.2)',
              boxShadow: '0 0 30px rgba(124,92,252,0.15)',
            }}
          >
            <img src="/logo.svg" alt="Spendly Logo" className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <div className='font-display text-lg sm:text-xl font-extrabold text-[#f0efff] tracking-tight'>
              Spendly
            </div>
            <div className='font-mono text-[9px] text-[#4a4870] tracking-[0.15em] uppercase'>
              Smart Tracking
            </div>
          </div>
        </div>

        <Card
          className='border-[rgba(124,92,252,0.15)]'
          style={{
            background: 'rgba(13,13,26,0.85)',
            backdropFilter: 'blur(30px)',
            boxShadow:
              '0 0 80px rgba(124,92,252,0.05), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <CardContent className='p-6 sm:p-10'>
            <h2 className='font-display text-2xl sm:text-3xl font-extrabold text-[#f0efff] mb-1.5 tracking-tight'>
              Create account
            </h2>
            <p className='text-[#4a4870] text-sm mb-6'>
              Start tracking your expenses with AI
            </p>

            {(error || googleError) && (
              <Alert
                className='mb-5 border-red-900/40'
                style={{ background: 'rgba(255,59,92,0.08)' }}
              >
                <AlertDescription className='text-red-400 text-sm'>
                  {googleError
                    ? 'Google authentication failed.'
                    : error?.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Google button */}
            <Button
              type='button'
              onClick={() => {
                if (googleAuthUrl) window.location.href = googleAuthUrl;
              }}
              disabled={isLoadingGoogleUrl || isPending}
              className='w-full h-11 sm:h-12 bg-white text-[#1f1f1f] hover:bg-gray-100 font-semibold gap-3 mb-5 rounded-xl border border-[rgba(124,92,252,0.2)]'
            >
              {isLoadingGoogleUrl ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <>
                  <svg width='18' height='18' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  Sign up with Google
                </>
              )}
            </Button>

            <div className='relative mb-5'>
              <Separator className='bg-[rgba(124,92,252,0.15)]' />
              <span
                className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[11px] font-mono text-[#4a4870]'
                style={{ background: 'rgba(13,13,26,0.9)' }}
              >
                or
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                signUp(form);
              }}
              className='space-y-4'
            >
              <div className='space-y-2'>
                <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                  Full Name
                </Label>
                <Input
                  type='text'
                  value={form.name}
                  onChange={set('name')}
                  placeholder='John Doe'
                  required
                  className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
                  style={{ background: 'rgba(13,13,26,0.8)' }}
                />
              </div>

              <div className='space-y-2'>
                <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                  Email Address
                </Label>
                <Input
                  type='email'
                  value={form.email}
                  onChange={set('email')}
                  placeholder='you@example.com'
                  required
                  className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11'
                  style={{ background: 'rgba(13,13,26,0.8)' }}
                />
              </div>

              <div className='space-y-2'>
                <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                  Password
                </Label>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder='••••••••'
                    required
                    className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11 pr-12'
                    style={{ background: 'rgba(13,13,26,0.8)' }}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4870] hover:text-[#8b89b0]'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div className='mt-3 space-y-2.5'>
                    <div className='flex gap-1'>
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className='h-[3px] flex-1 rounded-full transition-all duration-300'
                          style={{
                            background:
                              passwordStrength >= step
                                ? strengthColors[passwordStrength]
                                : 'rgba(124,92,252,0.1)',
                            boxShadow:
                              passwordStrength >= step
                                ? `0 0 6px ${strengthColors[passwordStrength]}60`
                                : 'none',
                          }}
                        />
                      ))}
                    </div>
                    {passwordStrength > 0 && (
                      <p
                        className='font-mono text-[11px]'
                        style={{ color: strengthColors[passwordStrength] }}
                      >
                        {strengthLabels[passwordStrength]}
                      </p>
                    )}
                    <div className='flex flex-wrap gap-1.5'>
                      {PASSWORD_RULES.map((rule) => {
                        const ok = rule.test(form.password);
                        return (
                          <div
                            key={rule.label}
                            className='flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] transition-all'
                            style={{
                              border: `1px solid ${ok ? 'rgba(0,255,135,0.3)' : 'rgba(124,92,252,0.12)'}`,
                              background: ok
                                ? 'rgba(0,255,135,0.07)'
                                : 'transparent',
                              color: ok ? '#00ff87' : '#4a4870',
                            }}
                          >
                            <Check
                              className='w-2.5 h-2.5'
                              style={{ opacity: ok ? 1 : 0.3 }}
                            />
                            {rule.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type='submit'
                disabled={isPending}
                className='w-full h-11 sm:h-12 text-white font-display font-bold gap-2 rounded-xl mt-1'
                style={{
                  background: isPending
                    ? 'rgba(124,92,252,0.4)'
                    : 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                  boxShadow: isPending
                    ? 'none'
                    : '0 0 30px rgba(124,92,252,0.35)',
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' /> Creating…
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </Button>
            </form>

            <p className='text-center text-sm text-[#4a4870] mt-6'>
              Already have an account?{' '}
              <Link
                to='/login'
                className='text-[#9d7fff] font-semibold hover:text-[#7c5cfc] transition-colors'
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
