import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryBoundary } from '@/components/states/QueryBoundary';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ScoreProgressRing } from '@/components/charts/ScoreProgressRing';
import { SkillRadarChart } from '@/components/charts/SkillRadarChart';
import {
  useHistory,
  useDeleteHistoryEntry,
  useDeleteHistoryBatch,
  useDeleteAllHistory,
} from '@/hooks/useHistory';
import { useComparison } from '@/hooks/useComparison';
import { InlineSpinner } from '@/components/ui/FullScreenSpinner';
import type { HistoryEntry, RichComparisonResult } from '@/types/api';

type Mode = 'view' | 'edit' | 'compare';

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-[var(--text-secondary)] text-xs font-bold">→ unchanged</span>;
  const color = value > 0 ? 'text-[var(--accent)]' : 'text-[#ff6b6b]';
  const arrow = value > 0 ? '↑' : '↓';
  return <span className={`text-xs font-black ${color}`}>{arrow} {value > 0 ? '+' : ''}{value}</span>;
}

function ScoreDeltaRow({ label, base, compare, delta }: { label: string; base: number; compare: number; delta: number }) {
  const color = delta > 0 ? 'text-[var(--accent)]' : delta < 0 ? 'text-[#ff6b6b]' : 'text-[var(--text-secondary)]';
  const bg = delta > 0 ? 'bg-[var(--accent)]/10' : delta < 0 ? 'bg-[#ff6b6b]/10' : 'bg-[var(--bg-subtle)]';
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${bg}`}>
      <span className="text-sm text-[var(--text-secondary)] font-medium">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-[var(--text-secondary)]">{base}</span>
        <span className="material-symbols-outlined text-xs text-[var(--text-secondary)]">arrow_forward</span>
        <span className={`text-sm font-bold ${color}`}>{compare}</span>
        <DeltaBadge value={delta} />
      </div>
    </div>
  );
}

function SkillChip({ skill, type }: { skill: string; type: 'added' | 'removed' | 'missing' }) {
  const styles = {
    added:   'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30',
    removed: 'bg-[#ff6b6b]/15 text-[#ff6b6b] border border-[#ff6b6b]/30',
    missing: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]',
  };
  const icons = { added: '↑', removed: '↓', missing: '○' };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
      <span className="font-bold">{icons[type]}</span> {skill}
    </span>
  );
}

export function HistoryPage() {
  const [mode, setMode] = useState<Mode>('view');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<'selected' | 'all'>('selected');
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

  const { data, isLoading, isError, refetch } = useHistory();
  const deleteSingle = useDeleteHistoryEntry();
  const deleteBatch = useDeleteHistoryBatch();
  const deleteAll = useDeleteAllHistory();

  const { data: comparison, isLoading: isComparing, isError: compareError } = useComparison(
    compareIds?.[0] ?? null,
    compareIds?.[1] ?? null
  );

  const entries = data?.entries ?? [];
  const isBusy = deleteSingle.isPending || deleteBatch.isPending || deleteAll.isPending;

  const exitEditMode = () => { setMode('view'); setSelectedIds(new Set()); };
  const exitCompareMode = () => { setMode('view'); setCompareIds(null); };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };
  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === entries.length ? new Set() : new Set(entries.map(e => e.id)));
  };

  const handleCompareSelect = (id: string) => {
    if (!compareIds) { setCompareIds([id, ''] as unknown as [string, string]); return; }
    if (compareIds[0] === id || compareIds[1] === id) { setCompareIds(null); return; }
    if (compareIds[0] && !compareIds[1]) setCompareIds([compareIds[0], id]);
  };

  const handleDeleteConfirm = async () => {
    setConfirmOpen(false);
    if (confirmType === 'all') { await deleteAll.mutateAsync(); exitEditMode(); }
    else { await deleteBatch.mutateAsync([...selectedIds]); exitEditMode(); }
  };

  const compareSelected = (id: string) => compareIds?.[0] === id || compareIds?.[1] === id;
  const bothSelected = !!(compareIds?.[0] && compareIds?.[1]);

  return (
    <PageShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Analysis History</h2>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            {entries.length} scan{entries.length !== 1 ? 's' : ''} — each saved as an independent snapshot
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {mode === 'view' && (<>
            <button onClick={() => setMode('compare')} disabled={entries.length < 2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-40 text-sm">
              <span className="material-symbols-outlined text-sm">compare_arrows</span> Compare
            </button>
            <button onClick={() => setMode('edit')} disabled={entries.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-40 text-sm">
              <span className="material-symbols-outlined text-sm">edit</span> Edit
            </button>
          </>)}
          {mode === 'edit' && (<>
            <button onClick={toggleSelectAll} className="px-5 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-all text-sm">
              {selectedIds.size === entries.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedIds.size > 0 && (
              <button onClick={() => { setConfirmType('selected'); setConfirmOpen(true); }} disabled={isBusy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 hover:bg-[#ff6b6b]/20 transition-all text-sm">
                {isBusy ? <InlineSpinner className="border-[#ff6b6b]/30 border-t-error" /> : <span className="material-symbols-outlined text-sm">delete</span>}
                Delete ({selectedIds.size})
              </button>
            )}
            <button onClick={() => { setConfirmType('all'); setConfirmOpen(true); }} disabled={isBusy || entries.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20 hover:bg-[#ff6b6b]/20 transition-all text-sm disabled:opacity-40">
              <span className="material-symbols-outlined text-sm">delete_forever</span> Delete All
            </button>
            <button onClick={exitEditMode} className="px-5 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-all text-sm">Done</button>
          </>)}
          {mode === 'compare' && (<>
            <span className="text-xs text-[var(--text-secondary)] self-center">
              {!compareIds?.[0] ? 'Select first' : !compareIds?.[1] ? 'Select second' : '✓ Both selected'}
            </span>
            <button onClick={exitCompareMode} className="px-5 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-all text-sm">Cancel</button>
          </>)}
        </div>
      </div>

      {mode === 'compare' && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--accent)] shrink-0">info</span>
          <p className="text-sm text-[var(--text-secondary)]">
            Select <strong className="text-[var(--text-primary)]">exactly two</strong> analyses for a detailed side-by-side comparison.
          </p>
        </div>
      )}

      {/* History list */}
      <QueryBoundary isLoading={isLoading} isError={isError} data={data} onRetry={refetch}
        loadingHeightClassName="h-64"
        isEmpty={(d) => d.entries.length === 0}
        emptyProps={{ icon: 'history', title: 'No scans yet', description: 'Run your first career analysis from the Dashboard.', onAction: () => window.location.href = '/dashboard', actionLabel: 'Go to Dashboard' }}>
        {(d) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {d.entries.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} mode={mode}
                selected={selectedIds.has(entry.id)} compareSelected={compareSelected(entry.id)}
                compareDisabled={mode === 'compare' && !compareSelected(entry.id) && (compareIds?.filter(Boolean).length ?? 0) >= 2}
                onToggleSelect={() => toggleSelect(entry.id)}
                onCompareSelect={() => handleCompareSelect(entry.id)}
                onDelete={() => deleteSingle.mutate(entry.id)} />
            ))}
          </div>
        )}
      </QueryBoundary>

      {/* Rich Comparison Panel */}
      {bothSelected && (
        <RichComparisonPanel
          comparison={comparison as RichComparisonResult | undefined}
          isLoading={isComparing} isError={compareError}
          onClose={exitCompareMode} />
      )}

      <ConfirmDialog open={confirmOpen}
        title={confirmType === 'all' ? 'Delete all history?' : `Delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}?`}
        description={confirmType === 'all' ? 'This permanently deletes your entire analysis history. Cannot be undone.' : `Permanently delete ${selectedIds.size} selected analyses. Cannot be undone.`}
        confirmLabel="Delete" danger onConfirm={handleDeleteConfirm} onCancel={() => setConfirmOpen(false)} />
    </PageShell>
  );
}

// ── HistoryCard ───────────────────────────────────────────────────────────────
function HistoryCard({ entry, mode, selected, compareSelected, compareDisabled, onToggleSelect, onCompareSelect, onDelete }: {
  entry: HistoryEntry; mode: Mode; selected: boolean; compareSelected: boolean;
  compareDisabled: boolean; onToggleSelect: () => void; onCompareSelect: () => void; onDelete: () => void;
}) {
  return (
    <div onClick={() => { if (mode === 'edit') onToggleSelect(); if (mode === 'compare') onCompareSelect(); }}
      className={`rounded-2xl p-5 transition-all ${
        selected || compareSelected ? 'border-[var(--accent)]/60 bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      } ${compareDisabled ? 'opacity-40 pointer-events-none' : mode !== 'view' ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start gap-4">
        {mode === 'edit' && (
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${selected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-outline-variant'}`}>
            {selected && <span className="material-symbols-outlined text-on-primary text-sm">check</span>}
          </div>
        )}
        {mode === 'compare' && (
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${compareSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-outline-variant'}`} />
        )}
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[var(--accent)]">{entry.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-on-surface truncate">{entry.title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-extrabold text-[var(--accent)] font-syne leading-none">{entry.score}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">/ 100</p>
          </div>
          {mode === 'edit' && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-xl text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-all" title="Delete">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Rich Comparison Panel ─────────────────────────────────────────────────────
function RichComparisonPanel({ comparison, isLoading, isError, onClose }: {
  comparison: RichComparisonResult | undefined; isLoading: boolean; isError: boolean; onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'coding'>('overview');

  const TABS = [
    { id: 'overview' as const, label: 'Scores',    icon: 'analytics'       },
    { id: 'skills'   as const, label: 'Skills',    icon: 'psychology'      },
    { id: 'coding'   as const, label: 'Progress',  icon: 'trending_up'     },
  ];

  return (
    <div className="mt-4 rounded-2xl  p-4 text-center border border-[var(--accent)]/20 overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[var(--accent)]">compare_arrows</span>
          <h3 className="text-xl font-bold font-bold uppercase tracking-tight">Side-by-Side Comparison</h3>
        </div>
        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <InlineSpinner className="w-8 h-8 border-[var(--accent)]/30 border-t-[var(--accent)]" />
        </div>
      )}
      {isError && (
        <div className="text-center py-12 text-[var(--text-secondary)] p-6">
          <span className="material-symbols-outlined text-4xl mb-3 block">error</span>
          <p>Failed to load comparison data. Please try again.</p>
        </div>
      )}

      {comparison && !isLoading && (
        <div className="p-6 space-y-6">
          {/* Delta Banner */}
          <div className={`p-4 rounded-2xl flex items-start gap-4 ${comparison.deltaPercent >= 0 ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30' : 'bg-[#ff6b6b]/10 border border-[#ff6b6b]/30'}`}>
            <span className={`material-symbols-outlined text-3xl shrink-0 ${comparison.deltaPercent >= 0 ? 'text-[var(--accent)]' : 'text-[#ff6b6b]'}`}>
              {comparison.deltaPercent >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <div>
              <p className="font-bold text-[var(--text-primary)]">
                {comparison.deltaPercent >= 0 ? '+' : ''}{comparison.deltaPercent}% career score change
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{comparison.insight}</p>
            </div>
          </div>

          {/* Score Rings */}
          <div className="grid grid-cols-2 gap-6">
            {[
              { snapshot: comparison.base,    label: 'Earlier Scan' },
              { snapshot: comparison.compare, label: 'Latest Scan'  },
            ].map(({ snapshot, label }, i) => (
              <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">{label}</p>
                <p className="font-bold text-on-surface truncate mb-1">{snapshot.roleTitle}</p>
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                  {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex justify-center">
                  <ScoreProgressRing label="Career Score"
                    value={snapshot.score}
                    color={i === 1 ? (comparison.deltaPercent >= 0 ? 'var(--accent)' : '#ef4444') : '#ffffff'}
                    size={130} />
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[var(--border)] pb-0">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-px ${
                  activeTab === tab.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--text-secondary)] hover:text-on-surface'
                }`}>
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Score Breakdown</p>
              <ScoreDeltaRow label="Career Score"   base={comparison.base.scores.careerScore}     compare={comparison.compare.scores.careerScore}     delta={comparison.scoreDeltas.careerScore} />
              <ScoreDeltaRow label="Resume Score"   base={comparison.base.scores.resumeScore}     compare={comparison.compare.scores.resumeScore}     delta={comparison.scoreDeltas.resumeScore} />
              <ScoreDeltaRow label="ATS Score"      base={comparison.base.scores.atsScore}        compare={comparison.compare.scores.atsScore}        delta={comparison.scoreDeltas.atsScore} />
              <ScoreDeltaRow label="GitHub Score"   base={comparison.base.scores.githubScore}     compare={comparison.compare.scores.githubScore}     delta={comparison.scoreDeltas.githubScore} />
              <ScoreDeltaRow label="Coding Score"   base={comparison.base.scores.codingScore}     compare={comparison.compare.scores.codingScore}     delta={comparison.scoreDeltas.codingScore} />
              {comparison.base.scores.skillMatchScore !== undefined && (
                <ScoreDeltaRow label="Skill Match"  base={comparison.base.scores.skillMatchScore ?? 0} compare={comparison.compare.scores.skillMatchScore ?? 0} delta={comparison.scoreDeltas.skillMatchScore} />
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-5">
              {comparison.newlyMatchedSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-3">
                    ↑ Skills Gained ({comparison.newlyMatchedSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.newlyMatchedSkills.map(s => <SkillChip key={s} skill={s} type="added" />)}
                  </div>
                </div>
              )}
              {comparison.skillsLost.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[#ff6b6b] uppercase tracking-widest mb-3">
                    ↓ Skills Lost ({comparison.skillsLost.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.skillsLost.map(s => <SkillChip key={s} skill={s} type="removed" />)}
                  </div>
                </div>
              )}
              {comparison.stillMissingSkills.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                    Still Missing ({comparison.stillMissingSkills.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.stillMissingSkills.map(s => <SkillChip key={s} skill={s} type="missing" />)}
                  </div>
                </div>
              )}
              {comparison.newlyMatchedSkills.length === 0 && comparison.skillsLost.length === 0 && (
                <p className="text-[var(--text-secondary)] text-sm text-center py-8">No skill changes between these snapshots.</p>
              )}
            </div>
          )}

          {activeTab === 'coding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Matched Skills', base: comparison.base.skillMatch?.matchedSkills?.length ?? 0, compare: comparison.compare.skillMatch?.matchedSkills?.length ?? 0 },
                  { label: 'Missing Skills',  base: comparison.base.skillMatch?.missingSkills?.length ?? 0, compare: comparison.compare.skillMatch?.missingSkills?.length ?? 0 },
                ].map(({ label, base, compare: cmp }) => (
                  <div key={label} className="rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest mb-3">{label}</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xl font-bold text-[var(--text-secondary)]">{base}</span>
                      <span className="material-symbols-outlined text-[var(--text-secondary)] text-sm">arrow_forward</span>
                      <span className={`text-xl font-bold ${cmp < base ? 'text-[var(--accent)]' : cmp > base ? 'text-[#ff6b6b]' : 'text-on-surface'}`}>{cmp}</span>
                    </div>
                  </div>
                ))}
              </div>
              {comparison.base.skillMatch?.requiredSkills && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Required Skills for Role</p>
                  <div className="flex flex-wrap gap-2">
                    {comparison.compare.skillMatch?.requiredSkills?.map(skill => {
                      const matched = comparison.compare.skillMatch?.matchedSkills?.includes(skill);
                      return (
                        <span key={skill} className={`px-3 py-1 rounded-full text-xs font-medium ${matched ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
                          {matched ? '✓' : '○'} {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
