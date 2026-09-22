import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DestinAILogo, DestinAIIcon } from '@/components/brand/DestinAILogo';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

const NAV = [
  { to: '/dashboard', icon: 'grid_view',        label: 'Dashboard' },
  { to: '/analytics', icon: 'bar_chart_4_bars', label: 'Analytics' },
  { to: '/ai-report', icon: 'auto_awesome',     label: 'AI Report' },
  { to: '/history',   icon: 'history',          label: 'History'   },
  { to: '/settings',  icon: 'settings',         label: 'Settings'  },
];

function NavContent({ onNav }: { onNav?: () => void }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  return (
    <div className="flex flex-col h-full">
      {/* Logo — compact brand asset */}
      <div className="px-5 py-5 border-b border-[var(--border)] flex items-center" style={{ height: '76px' }}>
        <DestinAILogo variant="sidebar" height={38} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => {
          const active = location.pathname === to ||
            (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink key={to} to={to} onClick={onNav}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
              ].join(' ')}>
              <span className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: active ? "'FILL' 1,'wght' 500,'opsz' 20" : "'FILL' 0,'wght' 350,'opsz' 20" }}>
                {icon}
              </span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer — user + theme toggle */}
      <div className="px-2 py-3 border-t border-[var(--border)] space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name ?? 'User'}</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          <ThemeSwitcher compact />
        </div>
        <button onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-red-500/10 hover:text-red-500"
          style={{ color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'wght' 350,'opsz' 20" }}>logout</span>
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 fixed left-0 top-0 bottom-0 z-40 border-r border-[var(--border)]"
        style={{ background: 'var(--bg-card)' }}>
        <NavContent />
      </aside>

      {/* Mobile hamburger */}
      <button onClick={() => setOpen(true)} aria-label="Open navigation"
        className="md:hidden fixed top-3.5 left-4 z-50 w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--border)] transition-all hover:bg-[var(--bg-subtle)]"
        style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-56 flex flex-col h-full z-10 border-r border-[var(--border)]"
            style={{ background: 'var(--bg-card)' }}>
            <button onClick={() => setOpen(false)} aria-label="Close navigation"
              className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-subtle)] transition-all"
              style={{ color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <NavContent onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
