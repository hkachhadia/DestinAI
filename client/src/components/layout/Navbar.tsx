import { useAuth } from "@/hooks/useAuth";

// Markup/classes copied verbatim from
// stitch_destinai_career_intelligence_platform/main_dashboard/code.html (<header> block).
export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-4 w-full bg-[var(--bg-card)] backdrop-blur-xl border-b border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
            search
          </span>
          <input
            className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/50 transition-all"
            placeholder="Search analytics or history..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--purple)] rounded-full border border-[var(--border)]" />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[var(--text-primary)]">{user?.name ?? "Loading..."}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                {user?.targetRole ?? "Set a target role"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-[var(--accent)]/20 bg-[var(--bg-subtle)] flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img alt={user.name} className="w-full h-full object-cover" src={user.avatarUrl} />
              ) : (
                <span className="material-symbols-outlined text-[var(--text-secondary)]">person</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
