import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { useUserSettings } from '@/services/auth.service';
import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import ChatPage from '@/pages/ChatPage';
import ExpensesPage from '@/pages/ExpensesPage';
import InsightsPage from '@/pages/InsightsPage';
import SettingsPage from '@/pages/SettingsPage';
import BudgetPage from '@/pages/BudgetPage';
import RecurringPage from '@/pages/RecurringPage';
import GoalsPage from '@/pages/GoalsPage';
import BillingPage from '@/pages/BillingPage';
import FinancePage from '@/pages/FinancePage';
import ImportPage from '@/pages/ImportPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import GoogleCallbackPage from '@/pages/GoogleCallbackPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import { useAuthStore } from '@/store/auth.store';
import AdminPage from '@/pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

function AppShell() {
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const [dismissed, setDismissed] = useState(false);

  const showOnboarding =
    !dismissed &&
    !settingsLoading &&
    settings !== undefined &&
    settings.onboardingCompleted === false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh', /* dynamic viewport height — excludes mobile browser chrome */
        overflow: 'hidden',
        background: '#080810',
      }}
    >
      {showOnboarding && (
        <OnboardingFlow onComplete={() => setDismissed(true)} />
      )}
      <EmailVerificationBanner />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          className='flex-1 relative'
          style={{
            overflow: 'hidden',
            paddingTop:
              'calc(var(--mobile-header-height, 0px) + env(safe-area-inset-top))',
            paddingBottom: 'var(--mobile-bottomnav-height, 0px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(124,92,252,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,0.025) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Routes>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/chat' element={<ChatPage />} />
              <Route path='/expenses' element={<ExpensesPage />} />
              <Route path='/insights' element={<InsightsPage />} />
              <Route path='/settings' element={<SettingsPage />} />
              <Route path='/budget' element={<BudgetPage />} />
              <Route path='/recurring' element={<RecurringPage />} />
              <Route path='/goals' element={<GoalsPage />} />
              <Route path='/billing' element={<BillingPage />} />
              <Route path='/finance' element={<FinancePage />} />
              <Route path='/import' element={<ImportPage />} />
              <Route path='/admin' element={<AdminPage />} />
              <Route path='*' element={<Navigate to='/dashboard' replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthHydrator>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/signup' element={<SignupPage />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='/verify-email' element={<VerifyEmailPage />} />
            <Route
              path='/auth/google/callback'
              element={<GoogleCallbackPage />}
            />
            <Route element={<ProtectedRoute />}>
              <Route path='/*' element={<AppShell />} />
            </Route>
          </Routes>
        </AuthHydrator>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
