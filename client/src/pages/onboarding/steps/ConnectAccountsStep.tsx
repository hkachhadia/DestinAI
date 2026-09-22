import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useConnectGithub } from "@/hooks/useGithubConnect";
import { useConnectCP } from "@/hooks/useCPConnect";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InlineSpinner } from "@/components/ui/FullScreenSpinner";
import type { CPPlatform } from "@/contracts/cp.types";

const schema = z.object({
  githubUsername:     z.string().trim().max(39).optional(),
  leetcodeUsername:   z.string().trim().max(50).optional(),
  codeforcesHandle:   z.string().trim().max(50).optional(),
  codechefUsername:   z.string().trim().max(50).optional(),
  gfgUsername:        z.string().trim().max(50).optional(),
  hackerrankUsername: z.string().trim().max(50).optional(),
  linkedinUrl:        z.string().trim().url("Enter a valid LinkedIn URL").optional().or(z.literal("")),
  portfolioUrl:       z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  kaggleUsername:     z.string().trim().max(50).optional(),
  mediumUsername:     z.string().trim().max(50).optional(),
  devtoUsername:      z.string().trim().max(50).optional(),
});

type FormValues = z.infer<typeof schema>;

interface FieldConfig {
  name: keyof FormValues;
  label: string;
  placeholder: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  ring: string;
  optional?: boolean;
}

const FIELDS: FieldConfig[] = [
  { name: "githubUsername",     label: "GitHub Username",     placeholder: "your-username",       icon: "code",          iconBg: "bg-[var(--accent-subtle)]",               iconColor: "text-[var(--accent)]",               ring: "focus-within:ring-[var(--accent)]/20"            },
  { name: "leetcodeUsername",   label: "LeetCode Username",   placeholder: "your_handle",         icon: "terminal",      iconBg: "bg-[var(--purple)]/20",  iconColor: "text-[var(--purple)]",  ring: "focus-within:ring-[var(--cyan)]" },
  { name: "codeforcesHandle",   label: "Codeforces Handle",   placeholder: "your_handle",         icon: "military_tech", iconBg: "bg-[var(--accent)]/10",        iconColor: "text-[var(--accent)]",        ring: "focus-within:ring-[var(--accent)]"       },
  { name: "codechefUsername",   label: "CodeChef Username",   placeholder: "your_handle",         icon: "restaurant",    iconBg: "bg-orange-500/20",           iconColor: "text-orange-400",           ring: "focus-within:ring-orange-400"          },
  { name: "gfgUsername",        label: "GeeksForGeeks",       placeholder: "your_handle",         icon: "school",        iconBg: "bg-green-500/20",            iconColor: "text-green-400",            ring: "focus-within:ring-green-400"           },
  { name: "hackerrankUsername", label: "HackerRank",          placeholder: "your_handle",         icon: "star",          iconBg: "bg-teal-500/20",             iconColor: "text-teal-400",             ring: "focus-within:ring-teal-400"            },
  { name: "linkedinUrl",        label: "LinkedIn URL",         placeholder: "linkedin.com/in/you", icon: "person_search", iconBg: "bg-[#0A66C2]/20",           iconColor: "text-[#0A66C2]",            ring: "focus-within:ring-[#0A66C2]", optional: true },
  { name: "portfolioUrl",       label: "Portfolio / Website", placeholder: "https://yoursite.dev",icon: "language",      iconBg: "bg-purple-500/20",           iconColor: "text-purple-400",           ring: "focus-within:ring-purple-400", optional: true },
  { name: "kaggleUsername",     label: "Kaggle",              placeholder: "your_handle",         icon: "data_object",   iconBg: "bg-sky-500/20",              iconColor: "text-sky-400",              ring: "focus-within:ring-sky-400", optional: true },
  { name: "mediumUsername",     label: "Medium",              placeholder: "@username",            icon: "article",       iconBg: "bg-gray-500/20",             iconColor: "text-gray-400",             ring: "focus-within:ring-gray-400", optional: true },
  { name: "devtoUsername",      label: "Dev.to",              placeholder: "username",             icon: "edit_note",     iconBg: "bg-indigo-500/20",           iconColor: "text-indigo-400",           ring: "focus-within:ring-indigo-400", optional: true },
];

export function ConnectAccountsStep({ onNext }: { onNext: () => void }) {
  const { connect: connectGithub, isConnecting: isGithubConnecting, error: githubError } = useConnectGithub();
  const { connect: connectCP,     isConnecting: isCPConnecting,     error: cpError }     = useConnectCP();
  const { updateProfile } = useUpdateProfile();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      githubUsername: "", leetcodeUsername: "", codeforcesHandle: "", codechefUsername: "",
      gfgUsername: "", hackerrankUsername: "", linkedinUrl: "", portfolioUrl: "",
      kaggleUsername: "", mediumUsername: "", devtoUsername: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const jobs: Promise<unknown>[] = [];

    // Persist supplemental profile data
    const supplemental: Record<string, string> = {};
    if (values.linkedinUrl)    supplemental.linkedinUrl    = values.linkedinUrl;
    if (values.portfolioUrl)   supplemental.portfolioUrl   = values.portfolioUrl;
    if (values.kaggleUsername) supplemental.kaggleUsername = values.kaggleUsername;
    if (values.mediumUsername) supplemental.mediumUsername = values.mediumUsername;
    if (values.devtoUsername)  supplemental.devtoUsername  = values.devtoUsername;
    if (Object.keys(supplemental).length > 0) {
      jobs.push(
        updateProfile(supplemental as Parameters<typeof updateProfile>[0]).catch(() => {/* non-fatal */})
      );
    }

    // Connect coding platforms — fire all in parallel, failures are non-fatal
    if (values.githubUsername) {
      jobs.push(new Promise<void>(res => { try { connectGithub({ username: values.githubUsername! }); } catch { /**/ } res(); }));
    }
    const cpConnects: { platform: CPPlatform; handle: string }[] = [];
    if (values.leetcodeUsername)   cpConnects.push({ platform: "leetcode",   handle: values.leetcodeUsername });
    if (values.codeforcesHandle)   cpConnects.push({ platform: "codeforces", handle: values.codeforcesHandle });
    if (values.codechefUsername)   cpConnects.push({ platform: "codechef",   handle: values.codechefUsername });
    if (values.gfgUsername)        cpConnects.push({ platform: "gfg",        handle: values.gfgUsername });
    if (values.hackerrankUsername) cpConnects.push({ platform: "hackerrank", handle: values.hackerrankUsername });
    for (const cp of cpConnects) {
      jobs.push(new Promise<void>(res => { try { connectCP(cp); } catch { /**/ } res(); }));
    }

    await Promise.allSettled(jobs);
    onNext();
  };

  const isBusy = isSubmitting || isGithubConnecting || isCPConnecting;

  return (
    <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <h2 className="font-syne text-headline-lg-mobile md:text-headline-lg text-[var(--text-primary)] uppercase tracking-tight italic">
          Connect Your Ecosystem
        </h2>
        <p className="font-body-md text-body-md text-[var(--text-secondary)]">
          All fields are optional — connect what you have for a richer analysis.
        </p>
      </div>

      <ErrorBanner message={githubError ?? cpError} />

      <div className="grid grid-cols-1 gap-2.5">
        {FIELDS.map(({ name, label, placeholder, icon, iconBg, iconColor, ring, optional }) => (
          <div key={name}
            className={`flex items-center gap-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl px-4 py-3 focus-within:ring-2 ${ring} transition-all group`}>
            <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined text-base ${iconColor}`}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1">
                {label}
                {optional && <span className="normal-case font-normal opacity-40 ml-1">optional</span>}
              </p>
              <input
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-on-surface placeholder:text-[var(--text-muted)] text-sm font-medium outline-none"
                placeholder={placeholder}
                type="text"
                autoComplete="off"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-[10px] text-[#ff6b6b] mt-0.5">{errors[name]?.message}</p>
              )}
            </div>
            <span className="material-symbols-outlined text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors shrink-0 text-sm">
              check_circle
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onNext}
          className="px-5 py-2.5 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-all text-sm uppercase tracking-widest">
          Skip
        </button>
        <button type="submit" disabled={isBusy}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-syne font-extrabold text-on-primary primary-gradient hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic disabled:opacity-60">
          {isBusy
            ? <><InlineSpinner className="border-white/30 border-t-white" /><span>Connecting…</span></>
            : <><span>Next Step</span><span className="material-symbols-outlined">arrow_forward</span></>}
        </button>
      </div>
    </form>
  );
}
