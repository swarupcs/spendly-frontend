import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Zap } from 'lucide-react';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div
        className='flex items-center justify-center h-dvh flex-col gap-5'
        style={{ background: '#080810' }}
      >
        <div className='relative'>
          <div
            className='w-14 h-14 rounded-2xl flex items-center justify-center'
            style={{
              background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
              boxShadow: '0 0 40px rgba(124,92,252,0.5)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <Zap className='w-7 h-7 text-white' strokeWidth={2.5} />
          </div>
          <div
            className='absolute -inset-1.5 rounded-[20px] border border-[rgba(124,92,252,0.3)]'
            style={{ animation: 'ringPulse 2s ease-in-out infinite' }}
          />
        </div>
        <div className='font-mono text-[11px] text-[#4a4870] uppercase tracking-[0.2em]'>
          Initializing…
        </div>
        <style>{`
          @keyframes pulse { 0%,100% { box-shadow:0 0 40px rgba(124,92,252,0.5); } 50% { box-shadow:0 0 60px rgba(124,92,252,0.8); } }
          @keyframes ringPulse { 0%,100% { opacity:0.3; transform:scale(1); } 50% { opacity:1; transform:scale(1.05); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to='/login' replace />;
  return <Outlet />;
}
