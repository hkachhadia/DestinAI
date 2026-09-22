function Bone({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg animate-pulse ${className}`}
      style={{ background: 'linear-gradient(90deg, var(--bg-subtle) 25%, var(--bg-overlay) 50%, var(--bg-subtle) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s ease infinite' }} />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <Bone className="h-4 w-2/5" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  );
}

export function RingSkeleton({ size = 128 }: { size?: number }) {
  return (
    <div className="rounded-full animate-pulse" style={{ width: size, height: size, background: 'var(--border)' }} />
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      <div className="md:col-span-12"><div className="rounded-2xl p-5 flex flex-wrap gap-8 justify-around" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {[1,2,3,4,5].map(i => <RingSkeleton key={i} size={110} />)}
      </div></div>
      <div className="md:col-span-4"><CardSkeleton rows={6} /></div>
      <div className="md:col-span-8"><CardSkeleton rows={8} /></div>
    </div>
  );
}

export function HistoryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <Bone className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2"><Bone className="h-3 w-3/5" /><Bone className="h-2.5 w-2/5" /></div>
          <Bone className="w-10 h-8 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 flex gap-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex-1 space-y-2"><Bone className="h-3 w-1/4" /><Bone className="h-5 w-2/5" /><Bone className="h-3 w-full" /><Bone className="h-3 w-4/5" /></div>
        <RingSkeleton size={110} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><CardSkeleton rows={4} /><CardSkeleton rows={4} /></div>
      <CardSkeleton rows={3} />
    </div>
  );
}
