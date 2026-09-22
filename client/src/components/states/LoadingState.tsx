interface LoadingStateProps {
  heightClassName?: string;
  label?: string;
}

export function LoadingState({ heightClassName = 'h-64', label = 'Loading data' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full ${heightClassName} rounded-2xl flex flex-col items-center justify-center gap-3`}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(37,99,235,0.18)', borderTopColor: 'var(--accent)' }} />
      <span className="text-[var(--text-secondary)] text-xs uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
}
