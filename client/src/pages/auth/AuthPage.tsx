import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InlineSpinner } from "@/components/ui/FullScreenSpinner";
import { toast } from "@/components/ui/Toast";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { DestinAILogo } from "@/components/brand/DestinAILogo";
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/utils/validators";
import type { NormalizedApiError } from "@/api/axiosClient";

const inputCls = "w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[var(--ring-focus)]";
const labelCls = "block text-xs font-semibold mb-1.5 tracking-wide";
const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' };

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="min-h-screen bg-base text-primary">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher compact />
      </div>

      <div className="min-h-screen grid lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
        {/* Brand panel — intentionally logo-free to keep one centered primary logo on the auth page. */}
        <aside className="hidden lg:flex relative overflow-hidden border-r border-[var(--border)] bg-card">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.10),transparent_42%)]" />
          <div className="relative z-10 flex flex-col justify-center p-12 xl:p-16 max-w-2xl">
            <p className="text-sm font-semibold text-accent mb-4">AI-Powered Career Intelligence</p>
            <h2 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.08]">
              Turn your career data into a clearer next step.
            </h2>
            <p className="mt-6 text-base leading-7 text-secondary max-w-lg">
              DestinAI combines your resume, GitHub activity, coding profiles, and target role into one personalized career intelligence experience.
            </p>
            <div className="mt-9 grid grid-cols-2 gap-3 max-w-lg">
              {[
                ['analytics', 'Career & ATS scoring'],
                ['auto_awesome', 'AI recommendations'],
                ['trending_up', 'Learning roadmap'],
                ['calendar_month', '30 / 60 / 90-day plan'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
                  <span className="material-symbols-outlined text-accent text-[18px]" aria-hidden="true">{icon}</span>
                  <span className="text-sm text-secondary">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-h-screen flex items-center justify-center px-5 sm:px-8 py-16">
          <div className="w-full max-w-[430px]">
            <div className="text-center mb-8">
              <Link to="/" aria-label="DestinAI home" className="inline-flex justify-center">
                <DestinAILogo variant="vertical" height={150} />
              </Link>
              <p className="mt-2 text-sm text-secondary">Shape Your Future with AI.</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-card p-6 sm:p-8 shadow-token-md">
              {mode === "login"
                ? <LoginForm onSwitchToSignup={() => setMode("signup")} />
                : <SignupForm onSwitchToLogin={() => setMode("login")} />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(values);
      toast.success("Welcome back!");
      navigate(user.isOnboarded ? "/dashboard" : "/onboarding", { replace: true });
    } catch (err) {
      setServerError((err as NormalizedApiError).message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Sign in</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Welcome back — let's check your career progress.</p>
      </div>
      <ErrorBanner message={serverError} />
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Email address</label>
          <input className={inputCls} style={inputStyle} type="email" placeholder="you@example.com"
            autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Password</label>
          <input className={inputCls} style={inputStyle} type="password" placeholder="••••••••"
            autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 mt-2"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {isSubmitting ? <InlineSpinner className="border-white/30 border-t-white" /> : 'Sign in to DestinAI'}
        </button>
      </form>
      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        No account?{' '}
        <button type="button" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}
          onClick={onSwitchToSignup}>Create one free</button>
      </p>
    </div>
  );
}

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    try {
      const { agreeToTerms: _a, firstName, lastName, ...rest } = values;
      await signup({ ...rest, name: `${firstName} ${lastName}`.trim() });
      toast.success("Account created! Let's set up your profile.");
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setServerError((err as NormalizedApiError).message ?? "Signup failed.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Create account</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Start your career intelligence journey today.</p>
      </div>
      <ErrorBanner message={serverError} />
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          {(['firstName','lastName'] as const).map((name) => (
            <div key={name}>
              <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>
                {name === 'firstName' ? 'First name' : 'Last name'}
              </label>
              <input className={inputCls} style={inputStyle} type="text"
                placeholder={name === 'firstName' ? 'John' : 'Doe'}
                autoComplete={name === 'firstName' ? 'given-name' : 'family-name'}
                {...register(name)} />
              {errors[name] && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors[name]?.message}</p>}
            </div>
          ))}
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Email address</label>
          <input className={inputCls} style={inputStyle} type="email" placeholder="you@example.com"
            autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--text-secondary)' }}>Password</label>
          <input className={inputCls} style={inputStyle} type="password"
            placeholder="8+ characters with uppercase, lowercase & number"
            autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password.message}</p>}
        </div>
        <div className="flex items-start gap-2.5">
          <input type="checkbox" className="mt-0.5" style={{ accentColor: 'var(--accent)' }} {...register("agreeToTerms")} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            I agree to the <a className="hover:underline" style={{ color: 'var(--accent)' }} href="#">Terms of Service</a>{' '}and{' '}
            <a className="hover:underline" style={{ color: 'var(--accent)' }} href="#">Privacy Policy</a>
          </p>
        </div>
        {errors.agreeToTerms && <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.agreeToTerms.message}</p>}
        <button type="submit" disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 mt-1"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {isSubmitting ? <InlineSpinner className="border-white/30 border-t-white" /> : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <button type="button" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}
          onClick={onSwitchToLogin}>Sign in</button>
      </p>
    </div>
  );
}
