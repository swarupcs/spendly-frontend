import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, PieChart, Shield, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-dvh bg-[#080810] text-[#f0efff] font-sans selection:bg-[#7c5cfc]/30 selection:text-white flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_rgba(124,92,252,0.15)_0%,_transparent_70%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.1)_0%,_transparent_70%)] pointer-events-none blur-3xl" />

      {/* Header */}
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(124,92,252,0.08)',
              border: '1px solid rgba(124,92,252,0.2)',
              boxShadow: '0 0 20px rgba(124,92,252,0.15)',
            }}
          >
            <img src="/logo.svg" alt="Spendly Logo" className="w-6 h-6" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">Spendly</span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="bg-[#7c5cfc] hover:bg-[#9d7fff] text-white rounded-xl h-10 px-6 transition-all shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-[#8b89b0] hover:text-[#f0efff] transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link to="/signup">
                <Button className="bg-[#7c5cfc] hover:bg-[#9d7fff] text-white rounded-xl h-10 px-6 transition-all shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative mt-10 sm:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(124,92,252,0.1)] border border-[rgba(124,92,252,0.2)] mb-8">
          <Sparkles className="w-4 h-4 text-[#9d7fff]" />
          <span className="text-xs font-mono text-[#9d7fff] uppercase tracking-wider">Meet your AI financial assistant</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold font-display tracking-tight mb-6 max-w-4xl leading-[1.1]">
          Stop tracking.<br className="sm:hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c5cfc] via-[#00d4ff] to-[#00ff87]">Start understanding.</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-[#8b89b0] max-w-2xl mb-10 leading-relaxed">
          Spendly uses natural language AI to automatically categorize your expenses, uncover hidden spending patterns, and keep your budget on track. Just chat, scan, and let AI handle the math.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
            <Button className="h-14 px-8 text-base font-semibold rounded-2xl bg-white text-[#080810] hover:bg-[#e0e0e0] transition-all flex items-center gap-2 group shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]">
              {isAuthenticated ? "Open Dashboard" : "Start Tracking for Free"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl mt-24 mb-16 text-left">
          <div className="bg-[rgba(13,13,26,0.5)] border border-[rgba(124,92,252,0.15)] p-6 rounded-3xl backdrop-blur-sm hover:border-[rgba(124,92,252,0.3)] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[rgba(124,92,252,0.1)] flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-[#9d7fff]" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-[#f0efff]">Chat to Add</h3>
            <p className="text-[#8b89b0] text-sm leading-relaxed">
              "Spent $15 on coffee and $40 on Uber." Spendly instantly splits, categorizes, and logs everything from a simple message.
            </p>
          </div>

          <div className="bg-[rgba(13,13,26,0.5)] border border-[rgba(0,212,255,0.15)] p-6 rounded-3xl backdrop-blur-sm hover:border-[rgba(0,212,255,0.3)] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center mb-4">
              <PieChart className="w-6 h-6 text-[#00d4ff]" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-[#f0efff]">Smart Insights</h3>
            <p className="text-[#8b89b0] text-sm leading-relaxed">
              Beautiful charts and AI-generated weekly summaries show you exactly where your money goes and how to optimize it.
            </p>
          </div>

          <div className="bg-[rgba(13,13,26,0.5)] border border-[rgba(0,255,135,0.15)] p-6 rounded-3xl backdrop-blur-sm hover:border-[rgba(0,255,135,0.3)] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[rgba(0,255,135,0.1)] flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#00ff87]" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-[#f0efff]">Secure & Private</h3>
            <p className="text-[#8b89b0] text-sm leading-relaxed">
              Your financial data is encrypted and securely stored. Take control of your privacy while getting powerful insights.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[rgba(124,92,252,0.1)] py-8 text-center text-[#4a4870] font-mono text-[10px] uppercase tracking-widest z-10 relative bg-[rgba(8,8,16,0.8)] backdrop-blur-md">
        © {new Date().getFullYear()} Spendly App. All rights reserved.
      </footer>
    </div>
  );
}