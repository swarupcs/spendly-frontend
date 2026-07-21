import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Zap, CheckCircle2 } from 'lucide-react';
import { useForgotPassword } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { mutate: forgotPassword, isPending, error } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword(email, {
      onSuccess: () => setSubmitted(true),
    });
  };

  return (
    <div
      className='min-h-dvh flex items-center justify-center px-4 py-8 relative overflow-hidden'
      style={{ background: '#080810' }}
    >
      {/* BG orbs */}
      <div
        className='absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none'
        style={{
          background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />
      <div
        className='absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none'
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
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
        <div className='flex items-center gap-3 mb-8 justify-center'>
          <div
            className='w-10 h-10 rounded-xl flex items-center justify-center'
            style={{
              background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
              boxShadow: '0 0 30px rgba(124,92,252,0.5)',
            }}
          >
            <Zap className='w-5 h-5 text-white' strokeWidth={2.5} />
          </div>
          <div>
            <div className='font-display text-lg font-extrabold text-[#f0efff] tracking-tight'>
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
            boxShadow: '0 0 80px rgba(124,92,252,0.05), 0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <CardContent className='p-6 sm:p-10'>
            {submitted ? (
              /* Success state */
              <div className='text-center py-4'>
                <div
                  className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5'
                  style={{
                    background: 'rgba(0,255,135,0.1)',
                    border: '1px solid rgba(0,255,135,0.2)',
                  }}
                >
                  <CheckCircle2 className='w-8 h-8' style={{ color: '#00ff87' }} />
                </div>
                <h2 className='font-display text-2xl font-extrabold text-[#f0efff] mb-3 tracking-tight'>
                  Check your inbox
                </h2>
                <p className='text-[#8b89b0] text-sm leading-relaxed mb-6'>
                  If <span className='text-[#f0efff] font-medium'>{email}</span> is registered, we've sent a password reset link. Check your spam folder if you don't see it.
                </p>
                <Link
                  to='/login'
                  className='inline-flex items-center gap-2 text-sm text-[#9d7fff] hover:text-[#7c5cfc] font-semibold transition-colors'
                >
                  <ArrowLeft className='w-4 h-4' /> Back to sign in
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center mb-5'
                  style={{
                    background: 'rgba(124,92,252,0.12)',
                    border: '1px solid rgba(124,92,252,0.2)',
                  }}
                >
                  <Mail className='w-5 h-5 text-[#9d7fff]' />
                </div>
                <h2 className='font-display text-2xl font-extrabold text-[#f0efff] mb-1.5 tracking-tight'>
                  Forgot password?
                </h2>
                <p className='text-[#4a4870] text-sm mb-6'>
                  No worries — enter your email and we'll send you a reset link.
                </p>

                {error && (
                  <Alert
                    className='mb-5 border-red-900/40'
                    style={{ background: 'rgba(255,59,92,0.08)' }}
                  >
                    <AlertDescription className='text-red-400 text-sm'>
                      {error.message}
                    </AlertDescription>
                  </Alert>
                )}

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

                  <Button
                    type='submit'
                    disabled={isPending}
                    className='w-full h-11 text-white font-display font-bold gap-2 rounded-xl'
                    style={{
                      background: isPending
                        ? 'rgba(124,92,252,0.4)'
                        : 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                      boxShadow: isPending ? 'none' : '0 0 30px rgba(124,92,252,0.35)',
                    }}
                  >
                    {isPending ? (
                      <><Loader2 className='w-4 h-4 animate-spin' /> Sending…</>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>

                <p className='text-center text-sm text-[#4a4870] mt-6'>
                  <Link
                    to='/login'
                    className='inline-flex items-center gap-1.5 text-[#9d7fff] font-semibold hover:text-[#7c5cfc] transition-colors'
                  >
                    <ArrowLeft className='w-3.5 h-3.5' /> Back to sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.7; transform:scale(1.05); } }
      `}</style>
    </div>
  );
}
