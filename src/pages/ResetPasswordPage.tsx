import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useResetPassword } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return;
    resetPassword(
      { token, newPassword: form.newPassword, confirmPassword: form.confirmPassword },
      { onSuccess: () => setSuccess(true) },
    );
  };

  const passwordsMatch =
    form.confirmPassword === '' || form.newPassword === form.confirmPassword;

  if (!token) {
    return (
      <div
        className='min-h-dvh flex items-center justify-center px-4'
        style={{ background: '#080810' }}
      >
        <div className='text-center'>
          <div
            className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5'
            style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid rgba(255,59,92,0.2)' }}
          >
            <AlertCircle className='w-8 h-8 text-[#ff3b5c]' />
          </div>
          <h2 className='font-display text-xl font-bold text-[#f0efff] mb-2'>Invalid link</h2>
          <p className='text-[#4a4870] text-sm mb-6'>This reset link is missing a token.</p>
          <Link to='/forgot-password' className='text-[#9d7fff] font-semibold hover:text-[#7c5cfc]'>
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

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
            {success ? (
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
                  Password updated!
                </h2>
                <p className='text-[#8b89b0] text-sm leading-relaxed mb-6'>
                  Your password has been reset. You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  className='w-full h-11 text-white font-display font-bold'
                  style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                <div
                  className='w-12 h-12 rounded-xl flex items-center justify-center mb-5'
                  style={{
                    background: 'rgba(124,92,252,0.12)',
                    border: '1px solid rgba(124,92,252,0.2)',
                  }}
                >
                  <Lock className='w-5 h-5 text-[#9d7fff]' />
                </div>
                <h2 className='font-display text-2xl font-extrabold text-[#f0efff] mb-1.5 tracking-tight'>
                  Set new password
                </h2>
                <p className='text-[#4a4870] text-sm mb-6'>
                  Must be at least 8 characters with uppercase, lowercase, and a number.
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
                  {/* New Password */}
                  <div className='space-y-2'>
                    <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                      New Password
                    </Label>
                    <div className='relative'>
                      <Input
                        type={showNew ? 'text' : 'password'}
                        value={form.newPassword}
                        onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder='••••••••'
                        required
                        className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11 pr-12'
                        style={{ background: 'rgba(13,13,26,0.8)' }}
                      />
                      <button
                        type='button'
                        onClick={() => setShowNew((v) => !v)}
                        className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4870] hover:text-[#8b89b0]'
                      >
                        {showNew ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className='space-y-2'>
                    <Label className='font-mono text-[10px] text-[#8b89b0] uppercase tracking-widest'>
                      Confirm Password
                    </Label>
                    <div className='relative'>
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder='••••••••'
                        required
                        className='border-[rgba(124,92,252,0.15)] text-[#f0efff] focus-visible:ring-[#7c5cfc]/30 h-11 pr-12'
                        style={{
                          background: 'rgba(13,13,26,0.8)',
                          borderColor: !passwordsMatch
                            ? 'rgba(255,59,92,0.4)'
                            : undefined,
                        }}
                      />
                      <button
                        type='button'
                        onClick={() => setShowConfirm((v) => !v)}
                        className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a4870] hover:text-[#8b89b0]'
                      >
                        {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                      </button>
                    </div>
                    {!passwordsMatch && (
                      <p className='font-mono text-[10px] text-[#ff3b5c]'>Passwords do not match</p>
                    )}
                  </div>

                  <Button
                    type='submit'
                    disabled={isPending || !passwordsMatch}
                    className='w-full h-11 text-white font-display font-bold gap-2 rounded-xl mt-2'
                    style={{
                      background:
                        isPending || !passwordsMatch
                          ? 'rgba(124,92,252,0.4)'
                          : 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
                      boxShadow:
                        isPending || !passwordsMatch ? 'none' : '0 0 30px rgba(124,92,252,0.35)',
                    }}
                  >
                    {isPending ? (
                      <><Loader2 className='w-4 h-4 animate-spin' /> Resetting…</>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>

                <p className='text-center text-sm text-[#4a4870] mt-6'>
                  Remember it?{' '}
                  <Link
                    to='/login'
                    className='text-[#9d7fff] font-semibold hover:text-[#7c5cfc] transition-colors'
                  >
                    Sign in
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
