import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { useVerifyEmail } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const { mutate: verifyEmail } = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Verification token is missing from the link.');
      return;
    }
    verifyEmail(token, {
      onSuccess: () => {
        // Update local auth store so the banner disappears immediately
        if (user) setUser({ ...user, emailVerified: true });
        setStatus('success');
      },
      onError: (err) => {
        setStatus('error');
        setErrorMsg(err.message);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div
      className='min-h-dvh flex items-center justify-center px-4 relative overflow-hidden'
      style={{ background: '#080810' }}
    >
      {/* BG orbs */}
      <div
        className='absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none'
        style={{
          background: 'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 70%)',
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

      <div className='w-full max-w-[400px] relative text-center'>
        {/* Logo */}
        <div className='flex items-center gap-3 mb-10 justify-center'>
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

        <div
          className='rounded-2xl p-8'
          style={{
            background: 'rgba(13,13,26,0.85)',
            border: '1px solid rgba(124,92,252,0.15)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {status === 'loading' && (
            <>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5'
                style={{
                  background: 'rgba(124,92,252,0.1)',
                  border: '1px solid rgba(124,92,252,0.2)',
                }}
              >
                <Loader2 className='w-8 h-8 text-[#7c5cfc] animate-spin' />
              </div>
              <h2 className='font-display text-xl font-bold text-[#f0efff] mb-2'>
                Verifying your email…
              </h2>
              <p className='text-[#4a4870] text-sm'>Just a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5'
                style={{
                  background: 'rgba(0,255,135,0.1)',
                  border: '1px solid rgba(0,255,135,0.2)',
                }}
              >
                <CheckCircle2 className='w-8 h-8' style={{ color: '#00ff87' }} />
              </div>
              <h2 className='font-display text-xl font-bold text-[#f0efff] mb-2'>
                Email verified!
              </h2>
              <p className='text-[#8b89b0] text-sm mb-6 leading-relaxed'>
                Your email address has been verified. You're all set.
              </p>
              <Button
                onClick={() => navigate('/')}
                className='w-full h-11 text-white font-display font-bold'
                style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)' }}
              >
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5'
                style={{
                  background: 'rgba(255,59,92,0.1)',
                  border: '1px solid rgba(255,59,92,0.2)',
                }}
              >
                <AlertCircle className='w-8 h-8 text-[#ff3b5c]' />
              </div>
              <h2 className='font-display text-xl font-bold text-[#f0efff] mb-2'>
                Verification failed
              </h2>
              <p className='text-[#8b89b0] text-sm mb-6 leading-relaxed'>{errorMsg}</p>
              <Button
                onClick={() => navigate('/')}
                variant='outline'
                className='w-full h-11 border-[rgba(124,92,252,0.2)] text-[#8b89b0] hover:text-[#f0efff]'
              >
                Back to app
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
