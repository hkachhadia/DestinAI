import type { SyncActivityDay } from '@/types/api';

interface Props {
  data: SyncActivityDay[];
}

function intensityClass(count: number): string {
  if (count === 0) return 'bg-[var(--bg-subtle)]';
  if (count <= 2) return 'bg-[var(--accent)]/20';
  if (count <= 6) return 'bg-[var(--accent)]/50';
  return 'bg-[var(--accent)]';
}

/** NOTE ON CHART LIBRARY: Recharts has no built-in heatmap chart type.
 * Rather than force-fit a Treemap/Scatter into a heatmap shape (which would
 * lose the grid semantics GitHub-style activity calendars need), this is a
 * small CSS-grid component driven entirely by the same `syncActivity` array
 * the rest of the Analytics screen consumes — no hardcoded cells. */
export function SyncActivityHeatmap({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <span className="text-[20px] font-black text-[var(--text-primary)] font-headline">
          {total.toLocaleString()} <span className="text-[12px] font-normal text-[var(--text-secondary)]">total</span>
        </span>
      </div>
      <div className="grid grid-cols-12 md:grid-cols-24 gap-1">
        {data.map((day) => (
          <div
            key={day.date}
            title={`${new Date(day.date).toLocaleDateString()}: ${day.count} contributions`}
            className={`heatmap-cell ${intensityClass(day.count)}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-[var(--text-secondary)] font-headline uppercase tracking-tighter">
        <span>Less</span>
        <div className="w-2 h-2 bg-[var(--bg-subtle)] rounded" />
        <div className="w-2 h-2 bg-[var(--accent)]/20 rounded" />
        <div className="w-2 h-2 bg-[var(--accent)]/50 rounded" />
        <div className="w-2 h-2 bg-[var(--accent)] rounded" />
        <span>More</span>
      </div>
    </div>
  );
}
