interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="w-full rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(37,99,235,0.16)' }}>
        <span className="material-symbols-outlined text-[var(--accent)] text-2xl"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'opsz' 24" }}>{icon}</span>
      </div>
      <div>
        <h3 className="font-semibold text-[var(--text-primary)] text-base" >{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-sm leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="mt-1 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
