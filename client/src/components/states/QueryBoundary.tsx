import type { ReactNode } from 'react';
import { CardSkeleton } from '@/components/ui/Skeleton';

interface EmptyProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface QueryBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | null | undefined;
  onRetry?: () => void;
  loadingHeightClassName?: string;
  isEmpty?: (data: T) => boolean;
  emptyProps?: EmptyProps;
  skeletonRows?: number;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({
  isLoading, isError, data, onRetry,
  loadingHeightClassName = 'h-48',
  isEmpty, emptyProps, skeletonRows = 4, children,
}: QueryBoundaryProps<T>) {
  if (isLoading) {
    return (
      <div className={`${loadingHeightClassName} flex flex-col gap-3`}>
        <CardSkeleton rows={skeletonRows} />
        <CardSkeleton rows={skeletonRows} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,107,107,0.15)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,107,107,0.08)' }}>
          <span className="material-symbols-outlined text-[#ff6b6b] text-xl"
            style={{ fontVariationSettings: "'FILL' 1, 'opsz' 24" }}>cloud_off</span>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] mb-1">Failed to load</p>
          <p className="text-sm text-[var(--text-secondary)]">Check your connection and try again.</p>
        </div>
        {onRetry && (
          <button onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!data || (isEmpty && isEmpty(data))) {
    if (!emptyProps) return null;
    return (
      <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(37,99,235,0.14)' }}>
          <span className="material-symbols-outlined text-[var(--accent)] text-2xl"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'opsz' 24" }}>{emptyProps.icon}</span>
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)] text-base mb-1.5" >{emptyProps.title}</p>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">{emptyProps.description}</p>
        </div>
        {emptyProps.onAction && emptyProps.actionLabel && (
          <button onClick={emptyProps.onAction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 mt-1"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            {emptyProps.actionLabel}
          </button>
        )}
      </div>
    );
  }

  return <>{children(data)}</>;
}
