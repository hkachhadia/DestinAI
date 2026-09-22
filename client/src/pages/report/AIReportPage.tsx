import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { QueryBoundary } from '@/components/states/QueryBoundary';
import { InlineSpinner } from '@/components/ui/FullScreenSpinner';
import { toast } from '@/components/ui/Toast';
import { ScoreProgressRing } from '@/components/charts/ScoreProgressRing';
import { useAIReport, useRefreshAIInsights, useInterviewPrep } from '@/hooks/useAIReport';
import { useScoreOverview } from '@/hooks/useScoreOverview';
import type { AICareerReport, InterviewQuestion } from '@/types/api';

type Tab = 'report' | 'breakdown' | 'roadmap' | 'interview' | 'plans';

// ── Confidence Badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ label, value }: { label: 'Low' | 'Medium' | 'High'; value: number }) {
  const styles = { High: 'bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30', Medium: 'bg-[var(--cyan)]/10 text-secondary-container border-[var(--cyan)]/30', Low: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[label]}`}>
      <span className="w-1.5 h-1.5 rounded-full  p-5 flex flex-col gap-4" style={{ backgroundColor: label === 'High' ? 'var(--accent)' : label === 'Medium' ? 'var(--purple)' : '#6b7280' }} />
      {label} ({value}%)
    </span>
  );
}

export function AIReportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('report');
  const { data: report, isLoading, isError, refetch } = useAIReport();
  const { data: overview } = useScoreOverview();
  const refresh = useRefreshAIInsights();   // CHANGE 2: not "regenerate"

  const handleRefresh = async () => {
    try {
      await refresh.mutateAsync();
      toast.success('AI insights refreshed successfully.');
    } catch {
      toast.error('Refresh failed — please try again.');
    }
  };

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'report',    label: 'AI Insights',    icon: 'auto_awesome'   },
    { id: 'breakdown', label: 'Score Details',   icon: 'analytics'      },
    { id: 'roadmap',   label: 'Learning Path',   icon: 'map'            },
    { id: 'interview', label: 'Interview Prep',  icon: 'quiz'           },
    { id: 'plans',     label: '30 / 60 / 90',    icon: 'calendar_month' },
  ];

  return (
    <PageShell>
      {/* Header — CHANGE 5: no "Gemini" branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-headline-lg-mobile md:text-headline-lg tracking-tight">AI Career Report</h2>
          <p className="text-[var(--text-secondary)] font-body-md">Personalized analysis based on your live profile data.</p>
        </div>
        {/* CHANGE 2: "Refresh AI Insights" replaces "Regenerate Report" */}
        <button onClick={handleRefresh} disabled={refresh.isPending}
          className="flex items-center gap-2 bg-[var(--bg-subtle)] text-on-surface border border-[var(--border)] px-5 py-2.5 rounded-xl font-bold hover:bg-[var(--bg-subtle)] transition-all disabled:opacity-60 self-start text-sm">
          {refresh.isPending ? <InlineSpinner className="border-[var(--text-primary)]/30 border-t-[var(--text-primary)]" /> : <span className="material-symbols-outlined text-sm">refresh</span>}
          {refresh.isPending ? 'Refreshing…' : 'Refresh AI Insights'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 custom-scrollbar">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
            }`}>
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError} data={report} onRetry={refetch}
        loadingHeightClassName="h-96" isEmpty={() => false}
        emptyProps={{ icon: 'auto_awesome', title: 'AI report not generated yet', description: 'Your career scores are ready. Click "Refresh AI Insights" above to generate your personalized AI narrative, roadmap, and interview prep. This requires a valid GEMINI_API_KEY on the server.', onAction: handleRefresh, actionLabel: 'Refresh AI Insights' }}>
        {r => (
          <>
            {activeTab === 'report'    && <ReportTab    report={r} />}
            {activeTab === 'breakdown' && <BreakdownTab report={r} overview={overview} />}
            {activeTab === 'roadmap'   && <RoadmapTab   report={r} />}
            {activeTab === 'interview' && <InterviewTab />}
            {activeTab === 'plans'     && <PlansTab     report={r} />}
          </>
        )}
      </QueryBoundary>
    </PageShell>
  );
}

// ── Report Tab ────────────────────────────────────────────────────────────────
function ReportTab({ report }: { report: AICareerReport }) {
  return (
    <div className="space-y-5 pb-10">
      {/* Hero */}
      <div className="rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex-1 space-y-3">
          <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">Executive Summary</p>
          <h3 className="font-bold text-on-surface text-lg">{report.roleTitle}</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{report.executiveSummary || 'Refresh AI Insights to generate your personalized summary.'}</p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ScoreProgressRing label="Match Score" value={report.matchScore} color="var(--accent)" size={110} />
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            {report.interviewReadiness !== undefined && <div><p className="text-[var(--text-secondary)]">Interview</p><p className="font-bold text-secondary-container">{report.interviewReadiness}%</p></div>}
            {report.industryReadiness !== undefined  && <div><p className="text-[var(--text-secondary)]">Industry</p><p className="font-bold text-[var(--accent)]">{report.industryReadiness}%</p></div>}
          </div>
        </div>
      </div>

      {/* Strengths + Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { label: 'Strengths',    items: report.strengths,   color: 'text-[var(--accent)]',  icon: 'verified',    dot: 'bg-[var(--accent)]'        },
          { label: 'Growth Areas', items: report.growthAreas, color: 'text-secondary-container', icon: 'trending_up', dot: 'bg-secondary-container' },
        ].map(({ label, items, color, icon, dot }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`material-symbols-outlined ${color}`}>{icon}</span>
              <h3 className="font-bold text-[var(--text-primary)]">{label}</h3>
            </div>
            {items.length > 0 ? (
              <div className="space-y-3">
                {items.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${dot} mt-2 shrink-0`} />
                    <div><p className="font-medium text-on-surface text-sm">{s.title}</p><p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{s.description}</p></div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-[var(--text-secondary)] opacity-60">Refresh AI Insights to generate this section.</p>}
          </div>
        ))}
      </div>

      {/* AI Confidence — Explainable AI */}
      {(report.recommendationConfidence?.length ?? 0) > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[var(--accent)]">psychology</span>
            <h3 className="font-bold text-[var(--text-primary)]">AI Confidence Breakdown</h3>
            <span className="text-xs text-[var(--text-secondary)] ml-1">— why each recommendation was made</span>
          </div>
          <div className="space-y-4">
            {report.recommendationConfidence!.map((rc, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--bg-subtle)] space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="font-medium text-on-surface text-sm">{rc.recommendation}</p>
                  <ConfidenceBadge label={rc.confidenceLabel} value={rc.confidence} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{rc.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing skills */}
      {report.missingSkills.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#ff6b6b]">warning</span>
            <h3 className="font-bold text-[var(--text-primary)]">Missing Skills for {report.roleTitle}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.missingSkills.map(skill => (
              <span key={skill} className="px-3 py-1 rounded-full text-xs font-medium bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/20">{skill}</span>
            ))}
          </div>
          {report.urgentGap && <p className="mt-3 text-xs font-bold text-[#ff6b6b] bg-[#ff6b6b]/5 border border-[#ff6b6b]/10 rounded-xl px-3 py-2">{report.urgentGap}</p>}
        </div>
      )}

      {/* Certifications */}
      {(report.certifications?.length ?? 0) > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[var(--accent)]">workspace_premium</span>
            <h3 className="font-bold text-[var(--text-primary)]">Recommended Certifications</h3>
          </div>
          <div className="space-y-2">
            {report.certifications!.map((cert, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)]">
                <span className="material-symbols-outlined text-[var(--accent)] text-sm">verified_user</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {report.recommendedProjects.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[var(--accent)]">code</span>
            <h3 className="font-bold text-[var(--text-primary)]">Recommended Projects</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.recommendedProjects.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-on-surface text-sm">{p.title}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold uppercase shrink-0">{p.category}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach tip */}
      {report.coachTip && (
        <div className="rounded-2xl p-5 border-l-4 border-[var(--accent)]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[var(--accent)] shrink-0">tips_and_updates</span>
            <div>
              <p className="font-bold text-on-surface mb-1 text-sm">Career Coach Tip</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{report.coachTip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Score Breakdown Tab ───────────────────────────────────────────────────────
function BreakdownTab({ report, overview }: { report: AICareerReport; overview: ReturnType<typeof useScoreOverview>['data'] }) {
  const bd = overview?.breakdown;
  if (!bd) return <p className="text-[var(--text-secondary)] text-center py-16">Run a scan to see score breakdown.</p>;

  // CHANGE 3: All reasons and improvements derived from real analysis data
  const connected = overview?.connectedSources;
  const topGaps = overview?.competencyGaps?.slice(0, 3).map(g => g.skill) ?? [];
  const topMissing = report.missingSkills.slice(0, 3);

  const components = [
    {
      label: 'Resume Quality', score: bd.resumeScore, icon: 'description', color: 'var(--accent)',
      reason: connected?.resume
        ? `Scored from resume completeness, section coverage, and ${overview?.competencyGaps?.length ?? 0} identified skill gaps.`
        : 'No resume connected. Upload your resume to receive a Resume Score.',
      improvement: connected?.resume
        ? `Focus on quantified achievements and add keywords: ${topMissing.join(', ') || 'role-specific terms'}.`
        : 'Upload a PDF or DOCX resume to activate Resume Scoring.',
      gain: Math.max(0, 90 - bd.resumeScore),
    },
    {
      label: 'ATS Compatibility', score: bd.atsScore, icon: 'verified', color: 'var(--accent-hover)',
      reason: connected?.resume
        ? `Based on keyword match between your resume and ${report.roleTitle} job requirements.`
        : 'No resume to analyze for ATS compatibility.',
      improvement: topMissing.length > 0
        ? `Add these missing ATS keywords: ${topMissing.join(', ')}.`
        : 'Your ATS score is strong — maintain keyword consistency on role changes.',
      gain: Math.max(0, 85 - bd.atsScore),
    },
    {
      label: 'GitHub Activity', score: bd.githubScore, icon: 'code', color: 'var(--cyan)',
      reason: connected?.github
        ? `Scored from public repos, commit frequency, language diversity, and star count.`
        : 'GitHub not connected — score is 0 until you link your profile.',
      improvement: connected?.github
        ? 'Push more public repos, contribute to open source, and maintain daily commits.'
        : 'Connect your GitHub account in Settings → Re-analyze to activate GitHub scoring.',
      gain: Math.max(0, 80 - bd.githubScore),
    },
    {
      label: 'Coding Proficiency', score: bd.codingScore, icon: 'terminal', color: 'var(--purple)',
      reason: connected?.cp
        ? `Aggregated from your connected competitive programming profiles (LeetCode, Codeforces, etc.).`
        : 'No coding platforms connected — connect LeetCode or Codeforces to activate Coding Score.',
      improvement: connected?.cp
        ? `Solve medium/hard problems regularly and participate in contests to raise your rating.`
        : 'Add LeetCode or Codeforces in Re-analyze → Run New Analysis to get scored.',
      gain: Math.max(0, 80 - bd.codingScore),
    },
    {
      label: 'Skill Match', score: bd.skillMatchScore ?? 0, icon: 'psychology', color: 'var(--accent)',
      reason: `How many skills required for ${report.roleTitle} are present across your resume and profile.`,
      improvement: topGaps.length > 0
        ? `Your biggest skill gaps are: ${topGaps.join(', ')}. Address these first.`
        : topMissing.length > 0
        ? `Learn: ${topMissing.join(', ')} to close remaining gaps.`
        : 'Skill match is strong — focus on deepening expertise rather than breadth.',
      gain: Math.max(0, 85 - (bd.skillMatchScore ?? 0)),
    },
  ];

  const totalGain = Math.min(components.reduce((a, c) => a + c.gain, 0), 100 - bd.careerScore);

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl p-5 flex items-center gap-4 border-l-4 border-[var(--accent)]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <span className="material-symbols-outlined text-[var(--accent)] text-2xl shrink-0">insights</span>
        <div>
          <p className="font-bold text-[var(--text-primary)]">Career Score: {bd.careerScore}/100</p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Addressing all gaps below could add up to <span className="text-[var(--accent)] font-bold">+{totalGain} points</span>.</p>
        </div>
      </div>
      {components.map(({ label, score, icon, color, reason, improvement, gain }) => (
        <div key={label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18` }}>
              <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-bold text-on-surface text-sm">{label}</h3>
                <span className="text-xl font-extrabold font-syne" style={{ color }}>{score}<span className="text-sm text-[var(--text-secondary)] font-normal">/100</span></span>
              </div>
              <div className="h-2 bg-[var(--bg-subtle)] rounded-full mb-4 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
                  <p className="font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">Why this score</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{reason}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)]">
                  <p className="font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider">How to improve</p>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{improvement}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/20 text-center">
                  <p className="font-bold text-[var(--accent)] mb-1 uppercase tracking-wider">Potential gain</p>
                  <p className="text-3xl font-extrabold text-[var(--accent)] font-syne">+{gain}</p>
                  <p className="text-[var(--text-secondary)]">points</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Learning Roadmap Tab (CHANGE 1: complete) ─────────────────────────────────
function RoadmapTab({ report }: { report: AICareerReport }) {
  if (report.roadmap.length === 0) {
    return (
      <div className="text-center py-16 space-y-3" style={{ color: 'var(--text-secondary)' }}>
        <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] block">map</span>
        <p className="text-[var(--text-secondary)]">Refresh AI Insights to generate your personalized learning roadmap.</p>
      </div>
    );
  }

  const STATUS_STYLES = {
    in_progress: 'bg-[var(--accent)] text-white border-[var(--accent)]',
    locked:      'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-outline-variant',
    completed:   'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border)]',
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl p-5 border-l-4 border-[var(--accent)] mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm text-[var(--text-secondary)]">This roadmap is <strong className="text-[var(--text-primary)]">specific to your gaps</strong> for <strong className="text-[var(--accent)]">{report.roleTitle}</strong>. Complete each phase before advancing.</p>
      </div>
      {report.roadmap.map((phase, i) => (
        <div key={phase.id} className={`rounded-2xl p-5 border-l-4 ${phase.status === 'in_progress' ? 'border-[var(--accent)]' : phase.status === 'completed' ? 'border-[var(--border-strong)]' : 'border-[var(--border)]'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${STATUS_STYLES[phase.status]}`}>
              {phase.status === 'in_progress'
                ? <span className="material-symbols-outlined text-sm">play_arrow</span>
                : phase.status === 'completed'
                ? <span className="material-symbols-outlined text-sm">check</span>
                : <span className="text-sm font-bold">{i + 1}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{phase.phase}</span>
                {phase.status === 'in_progress' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold">Start here</span>}
              </div>
              <h3 className="font-bold text-on-surface mb-2">{phase.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{phase.description}</p>
              {phase.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {phase.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Interview Prep Tab (CHANGE 1: complete) ────────────────────────────────────
function InterviewTab() {
  const { data: questions, isLoading, isError, refetch } = useInterviewPrep();
  const DIFF = { easy: 'bg-[var(--accent)]/10 text-[var(--accent)]', medium: 'bg-[var(--cyan)]/10 text-secondary-container', hard: 'bg-[#ff6b6b]/10 text-[#ff6b6b]' };

  return (
    <QueryBoundary isLoading={isLoading} isError={isError} data={questions} onRetry={refetch}
      loadingHeightClassName="h-64"
      isEmpty={q => q.length === 0}
      emptyProps={{ icon: 'quiz', title: 'No questions yet', description: 'Refresh AI Insights to generate personalized interview questions.' }}>
      {qs => (
        <div className="space-y-4 pb-10">
          <div className="rounded-2xl p-4 border-l-4 border-[var(--accent)] mb-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-sm text-[var(--text-secondary)]">Questions are tailored to <strong className="text-[var(--text-primary)]">your background and target role</strong>. Practice answering each before your interview.</p>
          </div>
          {qs.map((q: InterviewQuestion, i: number) => (
            <div key={q.id ?? i} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest px-2 py-1 bg-[var(--bg-subtle)] rounded-lg">{q.category}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${DIFF[q.difficulty]}`}>{q.difficulty}</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-secondary)] opacity-40 shrink-0">#{i + 1}</span>
              </div>
              <p className="font-bold text-on-surface mb-3 leading-snug">{q.question}</p>
              {q.sampleApproach && (
                <div className="p-3 rounded-xl bg-[var(--bg-subtle)] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[var(--accent)] text-sm shrink-0 mt-0.5">lightbulb</span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{q.sampleApproach}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </QueryBoundary>
  );
}

// ── 30/60/90 Day Plans Tab (CHANGE 1: complete) ────────────────────────────────
function PlansTab({ report }: { report: AICareerReport }) {
  const plans = [
    { label: '30-Day Plan', color: 'var(--accent)', icon: 'my_location',   desc: 'Foundation & quick wins',          items: report.plan30Day ?? [] },
    { label: '60-Day Plan', color: 'var(--cyan)',   icon: 'trending_up',   desc: 'Skill building & portfolio growth', items: report.plan60Day ?? [] },
    { label: '90-Day Plan', color: 'var(--success)',icon: 'workspace_premium', desc: 'Advanced goals & job readiness',items: report.plan90Day ?? [] },
  ];

  if (plans.every(p => p.items.length === 0)) {
    return (
      <div className="text-center py-16 space-y-3">
        <span className="material-symbols-outlined text-4xl text-[var(--text-secondary)] block">calendar_month</span>
        <p className="text-[var(--text-secondary)]">Refresh AI Insights to generate your personalized 30/60/90-day career plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="rounded-2xl p-5 border-l-4 border-[var(--accent)]" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-sm text-[var(--text-secondary)]">This plan is <strong className="text-[var(--text-primary)]">specific to your profile</strong> — tailored to your current scores, missing skills, and target role of <strong className="text-[var(--accent)]">{report.roleTitle}</strong>.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(({ label, color, icon, desc, items }) => (
          <div key={label} className="rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
              </div>
            </div>
            <div className="h-px bg-[var(--accent-subtle)]" />
            <div className="space-y-3">
              {items.length > 0 ? items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: color }}>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{i + 1}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item}</p>
                </div>
              )) : (
                <p className="text-xs text-[var(--text-secondary)] opacity-50">No items yet — refresh AI insights.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
