import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { QueryBoundary } from '@/components/states/QueryBoundary';
import { ScoreProgressRing } from '@/components/charts/ScoreProgressRing';
import { ReAnalyzeModal } from '@/components/ui/ReAnalyzeModal';
import { InlineSpinner } from '@/components/ui/FullScreenSpinner';
import { toast } from '@/components/ui/Toast';
import { useScoreOverview } from '@/hooks/useScoreOverview';
import { useTriggerAnalysis } from '@/hooks/useAnalysis';
import { useAuth } from '@/hooks/useAuth';

function ScoreCard({ label, value, color, ring = false }: { label: string; value: number; color: string; ring?: boolean }) {
  return (
    <div className={`rounded-xl p-5 border flex flex-col items-center text-center gap-2 transition-all ${ring ? 'border-[var(--accent)]/30' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
      style={{ background: 'var(--bg-card)', boxShadow: ring ? '0 0 0 1px rgba(37,99,235,0.1), var(--shadow-sm)' : 'var(--shadow-sm)' }}>
      <ScoreProgressRing label={label} value={value} color={color} size={ring ? 150 : 110} />
      {ring && <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Overall career readiness</p>}
    </div>
  );
}

function QuickStat({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="rounded-xl p-4 border border-[var(--border)] transition-all hover:border-[var(--border-strong)]"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <span className="material-symbols-outlined text-[16px]"
            style={{ color, fontVariationSettings: "'FILL' 1,'wght' 400,'opsz' 20" }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useScoreOverview();
  const triggerAnalysis = useTriggerAnalysis();
  const [modalOpen, setModalOpen] = useState(false);

  const handleAnalysisStarted = async (payload: import('@/api/analysisApi').TriggerAnalysisPayload) => {
    try {
      await triggerAnalysis.mutateAsync(payload);
      setModalOpen(false);
      toast.success('Analysis complete! Your scores have been updated.');
    } catch (err) {
      toast.error((err as Error).message ?? 'Analysis failed — please try again.');
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const headerActions = (
    <div className="flex items-center gap-2">
      <button onClick={() => setModalOpen(true)} disabled={triggerAnalysis.isPending}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        {triggerAnalysis.isPending
          ? <InlineSpinner className="border-white/30 border-t-white" />
          : <span className="material-symbols-outlined text-[16px]">rocket_launch</span>}
        {triggerAnalysis.isPending ? 'Analyzing…' : data ? 'Re-Analyze' : 'Run Analysis'}
      </button>
      <Link to="/analytics"
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] transition-all hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)]"
        style={{ color: 'var(--text-secondary)' }}>
        <span className="material-symbols-outlined text-[16px]">bar_chart_4_bars</span>
        Analytics
      </Link>
    </div>
  );

  const scanTime = data
    ? new Date(data.computedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : undefined;

  return (
    <PageShell title={`Welcome back, ${firstName}`} subtitle={scanTime ? `Last scan · ${scanTime}` : 'No analysis yet'} actions={headerActions}>
      {/* Analysis error */}
      {triggerAnalysis.isError && (
        <div className="mb-5 p-3.5 rounded-xl flex items-center gap-3 text-sm border"
          style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--error)' }}>error_outline</span>
          <span className="flex-1" style={{ color: 'var(--error)' }}>{(triggerAnalysis.error as Error)?.message ?? 'Scan failed.'}</span>
          <button onClick={() => triggerAnalysis.reset()} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>Dismiss</button>
        </div>
      )}

      <QueryBoundary isLoading={isLoading || triggerAnalysis.isPending} isError={isError} data={data}
        onRetry={refetch} loadingHeightClassName="h-72" isEmpty={() => false}
        emptyProps={{ icon: 'rocket_launch', title: 'No analysis yet',
          description: 'Connect your resume and profiles, then click Run Analysis to get your career score.',
          actionLabel: 'Run Analysis', onAction: () => setModalOpen(true) }}>
        {(overview) => (
          <div className="space-y-5">
            {/* Score grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Career score — spanning 2 cols on mobile */}
              <div className="col-span-2 md:col-span-1">
                <ScoreCard label="Career Score" value={overview.breakdown.careerScore} color="var(--accent)" ring />
              </div>
              <div className="contents">
                {[
                  { label: 'ATS Score',    value: overview.breakdown.atsScore,    color: 'var(--cyan)' },
                  { label: 'Resume Score', value: overview.breakdown.resumeScore, color: 'var(--success)' },
                  { label: 'GitHub Score', value: overview.breakdown.githubScore, color: '#8B5CF6' },
                  { label: 'Coding Score', value: overview.breakdown.codingScore, color: '#F59E0B' },
                ].map(p => <ScoreCard key={p.label} {...p} />)}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickStat label="Skills Matched" value={overview.skillMix?.filter(s => (s.current ?? 0) > 0).length ?? 0} icon="check_circle" color="var(--success)" />
              <QuickStat label="Skill Gaps"     value={overview.competencyGaps?.length ?? 0}                              icon="warning"      color="var(--warning)" />
              <QuickStat label="Analyses Run"   value={overview.careerVelocity?.length ?? 0}                             icon="history"      color="var(--accent)" />
              <QuickStat label="Overall Score"  value={overview.breakdown.careerScore}                                    icon="star"         color="var(--cyan)" />
            </div>

            {/* AI recommendation */}
            <div className="rounded-xl p-5 border flex items-start gap-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--accent)', borderLeftWidth: '3px', boxShadow: 'var(--shadow-sm)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'var(--accent-subtle)' }}>
                <span className="material-symbols-outlined text-[18px]"
                  style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1,'opsz' 20" }}>auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {overview.recommendation.message}
                </p>
              </div>
              <Link to="/ai-report"
                className="shrink-0 flex items-center gap-1 text-xs font-semibold hover:gap-2 transition-all"
                style={{ color: 'var(--accent)' }}>
                {overview.recommendation.ctaLabel}
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </QueryBoundary>

      <ReAnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)}
        onAnalysisStarted={handleAnalysisStarted} isAnalyzing={triggerAnalysis.isPending} />
    </PageShell>
  );
}
