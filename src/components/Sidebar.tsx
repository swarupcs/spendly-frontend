import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Settings,
  TrendingUp,
  Target,
  RefreshCw,
  Trophy,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  MoreHorizontal,
  X as XIcon,
  Wallet,
  // CreditCard,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSignOut } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const getNavItems = (role?: string) => {
  const items = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/chat', label: 'AI Chat', icon: MessageSquare },
    { href: '/expenses', label: 'Expenses', icon: PieChart },
    { href: '/budget', label: 'Budgets', icon: Target },
    { href: '/recurring', label: 'Recurring', icon: RefreshCw },
    { href: '/goals', label: 'Goals', icon: Trophy },
    { href: '/insights', label: 'Insights', icon: TrendingUp },
    { href: '/finance', label: 'Finance', icon: Wallet },
    // { href: '/billing', label: 'Billing', icon: CreditCard },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  if (role === 'ADMIN') {
    items.push({ href: '/admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return items;
};

// ─── Desktop-only tooltip ─────────────────────────────────────────────────────
function SidebarTooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 14 });
    }
    setVisible(true);
  };

  return (
    <>
      <div
        ref={childRef}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        style={{ width: 'fit-content' }}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: 'translateY(-50%)',
              zIndex: 99999,
              background: '#1a1a2e',
              border: '1px solid rgba(124,92,252,0.5)',
              borderRadius: '10px',
              padding: '8px 12px',
              boxShadow:
                '0 4px 24px rgba(0,0,0,0.7), 0 0 16px rgba(124,92,252,0.2)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: -5,
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
                width: 8,
                height: 8,
                background: '#1a1a2e',
                border: '1px solid rgba(124,92,252,0.5)',
                borderRight: 'none',
                borderTop: 'none',
              }}
            />
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Desktop sidebar nav items ────────────────────────────────────────────────
function DesktopNavItems({ isExpanded }: { isExpanded: boolean }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { mutate: signOut, isPending } = useSignOut();

  return (
    <div className='flex flex-col h-full'>
      {/* Logo */}
      <div
        className={cn(
          'flex items-center gap-3 mb-8',
          isExpanded ? 'justify-start px-5' : 'justify-center',
        )}
      >
        <div
          className='w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0'
          style={{
            background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)',
            boxShadow: '0 0 20px rgba(124,92,252,0.5)',
          }}
        >
          <Zap className='w-5 h-5 text-white' strokeWidth={2.5} />
        </div>
        {isExpanded && (
          <div>
            <div className='font-display text-lg font-extrabold text-[--foreground] tracking-tight'>
              Spendly
            </div>
            <div className='font-mono text-[9px] text-[--foreground-subtle] tracking-wider uppercase'>
              Smart Tracking
            </div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav
        className={cn(
          'flex flex-col gap-1 flex-1',
          isExpanded ? 'px-5' : 'items-center',
        )}
      >
        {getNavItems(user?.role).map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href);
          const navButton = (
            <NavLink to={item.href} className='w-full'>
              <Button
                variant='ghost'
                className={cn(
                  'relative transition-all h-12 rounded-xl w-full',
                  isExpanded
                    ? 'justify-start gap-3 px-3.5'
                    : 'justify-center w-12',
                  isActive
                    ? 'bg-gradient-to-br from-[rgba(124,92,252,0.3)] to-[rgba(0,212,255,0.15)] border border-[rgba(124,92,252,0.4)] shadow-[0_0_15px_rgba(124,92,252,0.25)]'
                    : 'border border-transparent hover:bg-[rgba(124,92,252,0.1)] hover:border-[rgba(124,92,252,0.2)]',
                )}
              >
                <Icon
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive
                      ? 'text-[--violet-bright]'
                      : 'text-[--foreground-subtle]',
                  )}
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isExpanded && (
                  <span
                    className={cn(
                      'font-sans text-sm transition-colors whitespace-nowrap',
                      isActive
                        ? 'text-[--foreground] font-semibold'
                        : 'text-[--foreground-muted] font-medium',
                    )}
                  >
                    {item.label}
                  </span>
                )}
                {isActive && !isExpanded && (
                  <div
                    className='absolute -right-[13px] top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-sm'
                    style={{
                      background: 'linear-gradient(180deg, #7c5cfc, #00d4ff)',
                      boxShadow: '0 0 8px rgba(124,92,252,0.6)',
                    }}
                  />
                )}
              </Button>
            </NavLink>
          );

          return isExpanded ? (
            <div key={item.href}>{navButton}</div>
          ) : (
            <SidebarTooltip
              key={item.href}
              content={
                <span
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 500,
                    fontSize: '13px',
                    color: '#f0efff',
                  }}
                >
                  {item.label}
                </span>
              }
            >
              {navButton}
            </SidebarTooltip>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className={cn(
          'flex flex-col gap-3 mt-2',
          isExpanded ? 'px-5' : 'items-center',
        )}
      >
        <Separator className='bg-[rgba(124,92,252,0.12)]' />

        {user && (
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl transition-all',
              isExpanded
                ? 'p-2.5 px-3 bg-[rgba(124,92,252,0.08)] border border-[rgba(124,92,252,0.15)]'
                : 'justify-center',
            )}
          >
            {isExpanded ? (
              <Avatar className='w-[38px] h-[38px] rounded-xl shrink-0'>
                <AvatarFallback className='rounded-xl bg-gradient-to-br from-[rgba(124,92,252,0.3)] to-[rgba(0,212,255,0.2)] border border-[rgba(124,92,252,0.3)] text-[--violet-bright] font-display font-bold text-sm'>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <SidebarTooltip
                content={
                  <div>
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 600,
                        fontSize: '13px',
                        color: '#f0efff',
                        marginBottom: 2,
                      }}
                    >
                      {user.name}
                    </p>
                    <p
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '11px',
                        color: '#8b89b0',
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                }
              >
                <Avatar className='w-[38px] h-[38px] rounded-xl shrink-0 cursor-default'>
                  <AvatarFallback className='rounded-xl bg-gradient-to-br from-[rgba(124,92,252,0.3)] to-[rgba(0,212,255,0.2)] border border-[rgba(124,92,252,0.3)] text-[--violet-bright] font-display font-bold text-sm'>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </SidebarTooltip>
            )}
            {isExpanded && (
              <div className='min-w-0 flex-1'>
                <div className='font-sans text-[13px] font-semibold text-[--foreground] truncate'>
                  {user.name}
                </div>
                <div className='font-mono text-[10px] text-[--foreground-subtle] truncate'>
                  {user.email}
                </div>
              </div>
            )}
          </div>
        )}

        {isExpanded ? (
          <Button
            variant='ghost'
            onClick={() => signOut()}
            disabled={isPending}
            className='w-full h-[38px] justify-start gap-2.5 px-3.5 text-[#8b89b0] hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/40 border border-transparent transition-all font-sans text-sm font-medium disabled:opacity-50'
          >
            <LogOut className='h-4 w-4 shrink-0' />
            <span>Sign Out</span>
          </Button>
        ) : (
          <SidebarTooltip
            content={
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 500,
                  fontSize: '13px',
                  color: '#ff6b6b',
                }}
              >
                Sign Out
              </span>
            }
          >
            <Button
              variant='ghost'
              size='icon'
              onClick={() => signOut()}
              disabled={isPending}
              className='w-[38px] h-[38px] text-[#8b89b0] hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/40 border border-transparent transition-all disabled:opacity-50'
            >
              <LogOut className='h-4 w-4' />
            </Button>
          </SidebarTooltip>
        )}
      </div>
    </div>
  );
}

// ─── Mobile: top logo bar (branding only, no hamburger) ───────────────────────
function MobileTopBar() {
  return (
    <div
      className='md:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 h-14'
      style={{
        background: 'rgba(8,8,16,0.97)',
        borderBottom: '1px solid rgba(124,92,252,0.12)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className='flex items-center gap-2.5'>
        <div
          className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0'
          style={{
            background: 'rgba(124,92,252,0.08)',
            border: '1px solid rgba(124,92,252,0.2)',
            boxShadow: '0 0 14px rgba(124,92,252,0.15)',
          }}
        >
          <img src="/logo.svg" alt="Spendly Logo" className="w-5 h-5" />
        </div>
        <div>
          <span className='font-display text-base font-extrabold text-[--foreground] tracking-tight'>
            Spendly
          </span>
          <span className='font-mono text-[9px] text-[#4a4870] tracking-widest uppercase ml-2 hidden xs:inline'>
            Smart Tracking
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile: bottom navigation bar ───────────────────────────────────────
function MobileBottomNav() {
  const location = useLocation();
  const { mutate: signOut } = useSignOut();
  const user = useAuthStore((s) => s.user);
  const [moreOpen, setMoreOpen] = useState(false);

  const allItems = getNavItems(user?.role);
  const primaryItems = allItems.slice(0, 4);
  const moreItems = allItems.slice(4);

  return (
    <>
      <nav
        className='md:hidden fixed bottom-0 left-0 right-0 z-50'
        style={{
          background: 'rgba(8,8,16,0.97)',
          borderTop: '1px solid rgba(124,92,252,0.15)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className='flex items-stretch justify-around'>
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className='flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all relative'
                style={{ color: isActive ? '#9d7fff' : '#4a4870' }}
              >
                {isActive && (
                  <div
                    className='absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full'
                    style={{ background: 'linear-gradient(90deg, #7c5cfc, #00d4ff)' }}
                  />
                )}
                <div
                  className='flex items-center justify-center w-8 h-8 rounded-xl transition-all'
                  style={{ background: isActive ? 'rgba(124,92,252,0.15)' : 'transparent' }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span
                  className='font-mono text-[8px] tracking-wide leading-none'
                  style={{ color: isActive ? '#9d7fff' : '#4a4870' }}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className='flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all'
            style={{ color: moreOpen ? '#9d7fff' : '#4a4870' }}
          >
            <div className='flex items-center justify-center w-8 h-8 rounded-xl'>
              <MoreHorizontal size={18} strokeWidth={1.8} />
            </div>
            <span className='font-mono text-[8px] tracking-wide leading-none'>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet overlay */}
      {moreOpen && (
        <>
          <div className='fixed inset-0 bg-black/60 z-[60] md:hidden' onClick={() => setMoreOpen(false)} />
          <div
            className='fixed bottom-0 left-0 right-0 z-[61] md:hidden rounded-t-3xl'
            style={{
              background: 'rgba(13,13,26,0.98)',
              borderTop: '1px solid rgba(124,92,252,0.2)',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <div className='flex justify-center py-3'>
              <div className='w-10 h-1 rounded-full bg-[rgba(124,92,252,0.3)]' />
            </div>
            <div className='px-4 pb-2 flex items-center justify-between'>
              <span className='font-display text-sm font-bold text-[#f0efff]'>More</span>
              <button onClick={() => setMoreOpen(false)} className='p-1.5 rounded-lg hover:bg-[rgba(124,92,252,0.1)] text-[#4a4870]'>
                <XIcon className='w-4 h-4' />
              </button>
            </div>
            <div className='px-3 space-y-1'>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className='flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all'
                    style={{
                      background: isActive ? 'rgba(124,92,252,0.12)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(124,92,252,0.25)' : 'transparent'}`,
                      color: isActive ? '#9d7fff' : '#8b89b0',
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    <span className='font-sans text-sm font-medium'>{item.label}</span>
                  </NavLink>
                );
              })}
              <button
                onClick={() => { signOut(); setMoreOpen(false); }}
                className='flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left transition-all text-[#8b89b0] hover:text-[#ff6b6b] hover:bg-[rgba(255,59,92,0.08)]'
              >
                <LogOut size={18} strokeWidth={2} />
                <span className='font-sans text-sm font-medium'>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen shrink-0 relative transition-all duration-300 ease-in-out overflow-visible',
          'bg-[rgba(8,8,16,0.95)] border-r border-[rgba(124,92,252,0.12)] backdrop-blur-xl',
          isExpanded ? 'w-60' : 'w-[72px]',
        )}
        style={{ padding: '20px 0' }}
      >
        {/* Vertical gradient accent line */}
        <div
          className='absolute right-0 top-[20%] bottom-[20%] w-px'
          style={{
            background:
              'linear-gradient(180deg, transparent, rgba(124,92,252,0.4), rgba(0,212,255,0.3), transparent)',
          }}
        />

        {/* Expand/collapse toggle */}
        <div
          className={cn(
            'mb-4 transition-all',
            isExpanded ? 'px-5 flex justify-end' : 'flex justify-center',
          )}
        >
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setIsExpanded(!isExpanded)}
            className='h-8 w-8 bg-[rgba(124,92,252,0.1)] border border-[rgba(124,92,252,0.2)] hover:bg-[rgba(124,92,252,0.2)] hover:border-[rgba(124,92,252,0.4)] text-[--violet-bright]'
          >
            {isExpanded ? (
              <ChevronLeft className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )}
          </Button>
        </div>

        <DesktopNavItems isExpanded={isExpanded} />
      </aside>

      {/* ── Mobile: logo bar at top + nav at bottom ── */}
      <MobileTopBar />
      <MobileBottomNav />
    </>
  );
}
