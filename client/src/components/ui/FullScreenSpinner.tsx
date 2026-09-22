export function FullScreenSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background text-[var(--text-primary)]">
      <div className="w-12 h-12 rounded-full border-4 border-[var(--border)]-container-highest border-t-[var(--accent)] animate-spin" />
      <p className="font-body-md text-body-md text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin ${className}`}
    />
  );
}
