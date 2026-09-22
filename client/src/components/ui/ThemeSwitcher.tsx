import { useTheme } from '@/context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

/**
 * DestinAI has one visual theme control: a single Light/Dark toggle.
 * The user's preference is persisted by ThemeContext. System mode remains
 * supported internally for compatibility, but the UI intentionally exposes
 * only the professional one-button toggle requested for the product.
 */
export function ThemeSwitcher({ compact = true }: ThemeSwitcherProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={[
        compact
          ? 'h-9 w-9'
          : 'h-10 px-3.5',
        'inline-flex items-center justify-center gap-2 rounded-lg border transition-colors',
        'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]',
        'hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30',
      ].join(' ')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span
        className="material-symbols-outlined text-[18px]"
        style={{ fontVariationSettings: "'FILL' 0, 'wght' 450, 'opsz' 20" }}
        aria-hidden="true"
      >
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
      {!compact && <span className="text-xs font-semibold">{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
