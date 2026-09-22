import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageShell({ children, title, subtitle, actions }: PageShellProps) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <Sidebar />

      <main className="flex-1 md:pl-56 flex flex-col min-h-screen">
        {/* Top bar */}
        {(title || actions) && (
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 md:px-8 h-14 border-b border-[var(--border)]"
            style={{ background: 'var(--bg-card)' }}>
            <div className="min-w-0 pl-10 md:pl-0">
              {title && <h1 className="text-sm font-semibold leading-none truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>}
              {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          </header>
        )}

        {/* Page body */}
        <div className="flex-1 px-4 md:px-8 py-6 max-w-[1280px] w-full mx-auto pb-20 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
