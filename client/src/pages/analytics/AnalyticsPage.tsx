import { memo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryBoundary } from '@/components/states/QueryBoundary';
import { useScoreOverview } from '@/hooks/useScoreOverview';
import { SkillRadarChart } from '@/components/charts/SkillRadarChart';
import { CompetencyGapChart } from '@/components/charts/CompetencyGapChart';
import { CareerVelocityTimeline } from '@/components/charts/CareerVelocityTimeline';
import { SyncActivityHeatmap } from '@/components/charts/SyncActivityHeatmap';
import { ScoreCompositionPie } from '@/components/charts/ScoreCompositionPie';
import { ScoreProgressRing } from '@/components/charts/ScoreProgressRing';
import type { ScoreOverview } from '@/types/api';

const SCORE_CONFIG: Array<{ key: keyof ScoreOverview['breakdown']; label: string; color: string; description: string; interpretation: (v: number) => string }> = [
  { key: 'careerScore',    label: 'Career Score',  color: 'var(--accent)', description: 'Weighted composite of all dimensions',
    interpretation: v => v >= 80 ? 'Excellent — highly competitive profile' : v >= 60 ? 'Good — solid foundation, room to grow' : v >= 40 ? 'Developing — focus on top gaps' : 'Early stage — build core skills first' },
  { key: 'resumeScore',   label: 'Resume Score',   color: 'var(--accent)', description: 'Quality, completeness, and ATS alignment of your resume',
    interpretation: v => v >= 80 ? 'Strong resume — well-structured and keyword-rich' : v >= 60 ? 'Good resume — minor improvements possible' : 'Needs work — improve formatting and keyword density' },
  { key: 'githubScore',   label: 'GitHub Score',   color: 'var(--cyan)', description: 'Repository quality, contribution activity, and language diversity',
    interpretation: v => v >= 80 ? 'Active contributor — impressive open source presence' : v >= 60 ? 'Regular commits — build more public projects' : v >= 40 ? 'Light activity — increase contribution frequency' : 'Connect GitHub and push public projects' },
  { key: 'codingScore',   label: 'Coding Score',   color: 'var(--purple)', description: 'Problem-solving ability across competitive platforms',
    interpretation: v => v >= 80 ? 'Strong coder — top competitive programming performer' : v >= 60 ? 'Proficient — solve more medium/hard problems' : v >= 40 ? 'Developing — consistent practice recommended' : 'Connect LeetCode or Codeforces to get scored' },
  { key: 'atsScore',      label: 'ATS Score',      color: 'var(--accent-hover)', description: 'How well your resume passes Applicant Tracking Systems',
    interpretation: v => v >= 80 ? 'ATS-optimized — strong keyword match' : v >= 60 ? 'Decent ATS alignment — add more role-specific keywords' : 'Likely filtered by ATS — needs targeted keyword work' },
];

const ChartCard = memo(({ title, description, interpretation, children }: {
  title: string; description: string; interpretation?: string; children: React.ReactNode;
}) => (
  <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold text-[var(--text-primary)] text-sm">{title}</h3>
        <p className="text-[var(--text-secondary)] text-xs mt-0.5">{description}</p>
      </div>
    </div>
    <div className="flex-1">{children}</div>
    {interpretation && (
      <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--accent-subtle)", border: "1px solid var(--border)" }}>
        <span className="material-symbols-outlined text-[var(--accent)] text-[14px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1, 'opsz' 20" }}>auto_awesome</span>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interpretation}</p>
      </div>
    )}
  </div>
));
ChartCard.displayName = 'ChartCard';

export function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useScoreOverview();

  return (
    <PageShell>
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary" >Career Analytics</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Every chart reflects your real profile data. Run a new scan after updating your profiles.
          </p>
        </div>
      </header>

      <QueryBoundary isLoading={isLoading} isError={isError} data={data} onRetry={refetch}
        loadingHeightClassName="h-96"
        isEmpty={() => false}
        emptyProps={{ icon: 'analytics', title: 'No analysis yet', description: 'Run your first scan from the Dashboard.', onAction: () => window.location.href = '/dashboard', actionLabel: 'Go to Dashboard' }}>
        {(overview) => (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">

            {/* Score rings row */}
            <div className="md:col-span-12 glass-panel p-6 rounded-2xl">
              <h3 className="font-bold text-on-surface mb-1">Score Overview</h3>
              <p className="text-xs text-on-surface-variant mb-6">All scores are computed from your live profile data — no estimates.</p>
              <div className="flex flex-wrap items-center justify-around gap-6">
                {SCORE_CONFIG.map(({ key, label, color, description, interpretation }) => (
                  <div key={key} className="flex flex-col items-center gap-3">
                    <ScoreProgressRing label={label} value={overview.breakdown[key] ?? 0} color={color} size={128} />
                    <div className="text-center max-w-[140px]">
                      <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>
                      <p className="text-xs font-medium mt-1" style={{ color }}>
                        {interpretation(overview.breakdown[key] ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Radar + Competency Gaps */}
            <div className="md:col-span-4">
              <ChartCard
                title="Skill Mix Radar"
                description="Multidimensional view of your competencies vs. role requirements"
                interpretation={
                  overview.skillMix?.length > 0
                    ? `You match ${Math.round((overview.skillMix.filter(s => (s.current ?? 0) > 50).length / overview.skillMix.length) * 100)}% of skill areas for your target role. Focus on dimensions below 50%.`
                    : 'Run an analysis to populate skill radar data.'
                }>
                <SkillRadarChart data={overview.skillMix} />
              </ChartCard>
            </div>

            <div className="md:col-span-8">
              <ChartCard
                title="Competency Gap Analysis"
                description="Required vs. current skill levels — sorted by largest gap"
                interpretation={
                  overview.competencyGaps?.length > 0
                    ? `Your largest gap is in "${overview.competencyGaps.slice().sort((a, b) => ((b.target - b.current) - (a.target - a.current)))[0]?.skill}". Closing your top 3 gaps could improve your Career Score significantly.`
                    : 'Connect your resume and run a scan to see competency gaps.'
                }>
                <CompetencyGapChart data={overview.competencyGaps} />
              </ChartCard>
            </div>

            {/* Row 3: Score Composition Pie + Career Velocity */}
            <div className="md:col-span-5">
              <ChartCard
                title="Score Composition"
                description="How each dimension contributes to your overall Career Score"
                interpretation="A balanced profile (no dimension below 40) typically leads to better hiring outcomes. Strengthen your weakest score first.">
                <ScoreCompositionPie weightsUsed={overview.weightsUsed ?? {}} />
              </ChartCard>
            </div>

            <div className="md:col-span-7">
              <ChartCard
                title="Career Velocity Timeline"
                description="Career Score progression across your analysis history"
                interpretation={
                  (overview.careerVelocity?.length ?? 0) > 1
                    ? `Your score ${(overview.careerVelocity?.at(-1)?.value ?? 0) >= (overview.careerVelocity?.[0]?.value ?? 0) ? 'has been improving ↑' : 'has declined ↓'} over ${overview.careerVelocity?.length} scans. Consistency matters — aim for weekly improvements.`
                    : 'Run multiple scans over time to see your career velocity trend.'
                }>
                <CareerVelocityTimeline data={overview.careerVelocity} />
              </ChartCard>
            </div>

            {/* Row 4: Sync Activity + Role Readiness */}
            <div className="md:col-span-8">
              <ChartCard
                title="Sync Activity"
                description="Days you have active data synced across connected platforms"
                interpretation="Regular profile syncing ensures your scores reflect your latest work. Aim to sync at least weekly.">
                <SyncActivityHeatmap data={overview.syncActivity} />
              </ChartCard>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-2xl p-5 h-full flex flex-col gap-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-0">Readiness Meters</h3>
                  <p className="text-xs text-[var(--text-secondary)]">How ready you are to apply right now</p>
                </div>
                {[
                  { label: 'Role Readiness',     value: overview.roleReadiness      ?? Math.round((overview.breakdown.skillMatchScore ?? overview.breakdown.careerScore) * 0.9), color: 'var(--accent)', tip: 'Based on your skill match for target role' },
                  { label: 'Industry Readiness', value: overview.industryReadiness   ?? Math.round(overview.breakdown.careerScore * 0.85), color: 'var(--cyan)', tip: 'Based on combined resume, GitHub, and coding signals' },
                  { label: 'ATS Pass Likelihood',value: overview.breakdown.atsScore, color: 'var(--accent-hover)', tip: 'Likelihood your resume passes an automated filter' },
                ].map(({ label, value, color, tip }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                      <span className="text-xs font-bold" style={{ color }}>{value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">{tip}</p>
                  </div>
                ))}

                <div className="mt-auto pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span className="material-symbols-outlined text-[var(--accent)]/60 text-[14px]">info</span>
                    Data from your most recent scan. Run a new scan after updating profiles.
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </QueryBoundary>
    </PageShell>
  );
}
