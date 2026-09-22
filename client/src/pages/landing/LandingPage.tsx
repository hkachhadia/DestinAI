import { Link } from 'react-router-dom';
import { DestinAILogo, DestinAIIcon } from '@/components/brand/DestinAILogo';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

const FEATURES = [
  { icon: 'description', title: 'Resume Intelligence', desc: 'Analyze resume quality, keyword coverage, and ATS compatibility.' },
  { icon: 'code', title: 'GitHub Intelligence', desc: 'Evaluate repositories, contributions, languages, and development activity.' },
  { icon: 'terminal', title: 'Coding Profiles', desc: 'Connect supported coding platforms to understand your problem-solving profile.' },
  { icon: 'analytics', title: 'Career Score', desc: 'Bring your career signals together in one clear readiness score.' },
  { icon: 'psychology', title: 'Skill Gap Analysis', desc: 'Identify missing skills for your target role and prioritize what to learn next.' },
  { icon: 'auto_awesome', title: 'AI Career Report', desc: 'Get personalized insights, a learning path, interview preparation, and a 30/60/90-day plan.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Build your profile', desc: 'Add your resume, target role, GitHub, and supported coding profiles.' },
  { step: '02', title: 'Run your analysis', desc: 'DestinAI evaluates the career signals available in your profile.' },
  { step: '03', title: 'Understand your gaps', desc: 'See scores, strengths, missing skills, and role-specific recommendations.' },
  { step: '04', title: 'Follow your roadmap', desc: 'Use the AI report, learning path, interview prep, and 30/60/90-day plan.' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-base text-primary">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-md" style={{ background: 'var(--bg-card)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          <Link to="/" aria-label="DestinAI home" className="shrink-0">
            <DestinAILogo variant="horizontal" height={42} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher compact />
            <Link to="/auth" className="hidden sm:inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[var(--border)] text-sm font-medium text-secondary hover:bg-subtle hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/auth" className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-5 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-28">
          <div className="absolute inset-x-0 top-0 h-[520px] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.10),transparent_62%)]" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <DestinAIIcon size={76} className="mx-auto mb-7" />
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-card px-3.5 py-1.5 mb-7 text-xs font-semibold text-secondary shadow-token-sm">
              <span className="material-symbols-outlined text-[15px] text-accent" aria-hidden="true">auto_awesome</span>
              AI-Powered Career Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-primary">
              Shape Your Future<br className="hidden sm:block" />{' '}
              <span className="text-accent">with AI.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg leading-8 text-secondary">
              DestinAI analyzes your resume, GitHub activity, and coding profiles to create a personalized career intelligence report and a clear path toward your next role.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-accent text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-token-md">
                Get Started Free
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </Link>
              <Link to="/auth" className="inline-flex items-center justify-center h-12 px-7 rounded-xl border border-[var(--border)] bg-card text-secondary font-medium hover:bg-subtle hover:text-primary transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-6 py-20 border-t border-[var(--border)]">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-semibold text-accent mb-2">One career intelligence platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Understand where you are. Know what to do next.</h2>
              <p className="mt-4 text-base leading-7 text-secondary">DestinAI brings the career signals you already have into one structured view.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ icon, title, desc }) => (
                <article key={title} className="rounded-2xl border border-[var(--border)] bg-card p-6 shadow-token-sm hover:shadow-token-md hover:border-[var(--border-strong)] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[20px] text-accent" aria-hidden="true">{icon}</span>
                  </div>
                  <h3 className="font-semibold text-base">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-6 py-20 border-t border-[var(--border)] bg-subtle">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How DestinAI Works</h2>
              <p className="mt-3 text-secondary">A simple flow from profile data to a practical career plan.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <article key={step} className="rounded-2xl border border-[var(--border)] bg-card p-6 flex gap-5">
                  <span className="text-sm font-bold text-accent tabular-nums pt-0.5">{step}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 sm:px-6 py-24 border-t border-[var(--border)]">
          <div className="max-w-3xl mx-auto rounded-3xl border border-[var(--border)] bg-card p-8 sm:p-12 text-center shadow-token-sm">
            <DestinAIIcon size={52} className="mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to shape your future?</h2>
            <p className="mt-4 text-base leading-7 text-secondary">Create your profile and turn your career data into a practical next step.</p>
            <Link to="/auth" className="mt-8 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-accent text-white font-semibold hover:bg-[var(--accent-hover)] transition-colors">
              Get Started Free
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] px-5 sm:px-6 py-7">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <DestinAILogo variant="compact" height={28} />
          <span>Shape Your Future with AI.</span>
        </div>
      </footer>
    </div>
  );
}
