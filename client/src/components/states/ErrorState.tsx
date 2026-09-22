interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message = 'Failed to load data. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <div className="w-full rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4"
      style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,107,107,0.15)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)' }}>
        <span className="material-symbols-outlined text-[#ff6b6b] text-2xl"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'opsz' 24" }}>error_outline</span>
      </div>
      <div>
        <h3 className="font-semibold text-[var(--text-primary)] text-base">{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-sm leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry}
          className="mt-1 px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
          style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
          <span className="material-symbols-outlined text-[15px] mr-1.5 align-middle">refresh</span>
          Try again
        </button>
      )}
    </div>
  );
}
