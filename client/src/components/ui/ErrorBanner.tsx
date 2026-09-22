export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-[#ff6b6b]-container/10 border border-[#ff6b6b]/20-container/40 rounded-2xl px-4 py-3">
      <span className="material-symbols-outlined text-[#ff6b6b] text-xl">error</span>
      <p className="text-sm text-[#ff6b6b] font-medium leading-relaxed">{message}</p>
    </div>
  );
}
