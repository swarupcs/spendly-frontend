import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Loader2, Zap } from 'lucide-react';

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=google_auth_failed');
      return;
    }

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, accessToken, refreshToken);
        navigate('/dashboard');
      } catch {
        navigate('/login?error=google_auth_failed');
      }
    } else {
      navigate('/login?error=google_auth_failed');
    }
  }, [searchParams, login, navigate]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#080810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(124,92,252,0.5)',
        }}
      >
        <Zap
          style={{ width: '28px', height: '28px', color: '#fff' }}
          strokeWidth={2.5}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Loader2
          style={{
            width: '20px',
            height: '20px',
            color: '#9d7fff',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '16px',
            color: '#8b89b0',
          }}
        >
          Completing sign in with Google...
        </span>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
