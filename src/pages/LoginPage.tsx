import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useSignIn, useGoogleAuthUrl } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: signIn, isPending, error } = useSignIn();
  const { data: googleAuthUrl, isLoading: isLoadingGoogleUrl } =
    useGoogleAuthUrl();
  const googleError = searchParams.get('error') === 'google_auth_failed';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password });
  };

  return (
    <div
      className='min-h-dvh flex items-center justify-center px-4 py-8 relative overflow-hidden'
      style={{ background: '#080810' }}
    >
      {/* BG orbs */}
      <div
        className='absolute top-[-20%] left-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full pointer-events-none'
        style={{
          background:
            'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        className='absolute bottom-[-20%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full pointer-events-none'
        style={{
          background:
            'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          animation: 'pulse 10s ease-in-out infinite reverse',
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
        <div className='flex items-center gap-3 mb-8 sm:mb-12 justify-center'>
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
              Welcome back
            </h2>
            <p className='text-[#4a4870] text-sm mb-6 sm:mb-7'>
              Sign in to your account to continue
            </p>

            {(error || googleError) && (
              <Alert
                className='mb-5 border-red-900/40'
                style={{ background: 'rgba(255,59,92,0.08)' }}
              >
                <AlertDescription className='text-red-400 text-sm'>
                  {googleError
                    ? 'Google authentication failed. Please try again.'
                    : (error?.message ?? 'An unexpected error occurred.')}
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
              className='w-full h-11 sm:h-12 bg-white text-[#1f1f1f] hover:bg-gray-100 font-semibold gap-3 mb-5 sm:mb-6 rounded-xl border border-[rgba(124,92,252,0.2)]'
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
                  Continue with Google
                </>
              )}
            </Button>

            <div className='relative mb-5 sm:mb-6'>
              <Separator className='bg-[rgba(124,92,252,0.15)]' />
              <span
                className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-[11px] font-mono text-[#4a4870]'
                style={{ background: 'rgba(13,13,26,0.9)' }}
              >
                or
              </span>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                  Email Address
                </Label>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  required
                  className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 focus-visible:border-[rgba(124,92,252,0.5)] h-11'
                  style={{ background: 'rgba(13,13,26,0.8)' }}
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                    Password
                  </Label>
                  <Link
                    to='/forgot-password'
                    className='font-mono text-[10px] text-[#9d7fff] hover:text-[#7c5cfc] transition-colors'
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    required
                    className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 focus-visible:border-[rgba(124,92,252,0.5)] h-11 pr-12'
                    style={{ background: 'rgba(13,13,26,0.8)' }}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4870] hover:text-[#8b89b0] transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type='submit'
                disabled={isPending}
                className='w-full h-11 sm:h-12 text-white font-display font-bold gap-2 rounded-xl mt-2'
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
                    <Loader2 className='w-4 h-4 animate-spin' /> Signing in…
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className='w-4 h-4' />
                  </>
                )}
              </Button>
            </form>

            <p className='text-center text-sm text-[#4a4870] mt-6 sm:mt-7'>
              Don't have an account?{' '}
              <Link
                to='/signup'
                className='text-[#9d7fff] font-semibold hover:text-[#7c5cfc] transition-colors'
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.7; transform:scale(1.05); } }
      `}</style>
    </div>
  );
}
