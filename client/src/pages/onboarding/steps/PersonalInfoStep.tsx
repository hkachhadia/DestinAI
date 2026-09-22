import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { personalInfoSchema, type PersonalInfoValues } from "@/utils/validators";
import { EXPERIENCE_LEVELS } from "@/utils/constants";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InlineSpinner } from "@/components/ui/FullScreenSpinner";

// Markup copied verbatim from profile_setup_wizard/code.html #step-1.
export function PersonalInfoStep({ onNext }: { onNext: () => void }) {
  const { user } = useAuth();
  const { updateProfile, isSaving, error } = useUpdateProfile();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      college: user?.college ?? "",
      location: user?.location ?? "",
      experienceLevel: user?.experienceLevel ?? "0-1",
    },
  });
  const experienceLevel = watch("experienceLevel");

  const onSubmit = async (values: import('@/utils/validators').PersonalInfoValues) => {
    await updateProfile({
      name: values.fullName,
      college: values.college,
      location: values.location,
      experienceLevel: values.experienceLevel,
    });
    onNext();
  };

  return (
    <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <h2 className="font-syne text-headline-lg-mobile md:text-headline-lg text-[var(--text-primary)] uppercase tracking-tight italic">
          Tell us about yourself
        </h2>
        <p className="font-body-md text-body-md text-[var(--text-secondary)]">
          We'll use this to tailor your career intelligence reports.
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-syne text-label-sm text-[var(--accent)] uppercase tracking-wider">
            Full Name
          </label>
          <input
            className="bg-[var(--bg-subtle)] border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all placeholder:opacity-30"
            placeholder="Alex Rivera"
            type="text"
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-xs text-[#ff6b6b]">{errors.fullName.message}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-syne text-label-sm text-[var(--accent)] uppercase tracking-wider">
            Current College/Uni
          </label>
          <input
            className="bg-[var(--bg-subtle)] border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all placeholder:opacity-30"
            placeholder="Stanford University"
            type="text"
            {...register("college")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-syne text-label-sm text-[var(--accent)] uppercase tracking-wider">
          Current Location
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent)]">
            location_on
          </span>
          <input
            className="w-full bg-[var(--bg-subtle)] border border-outline-variant rounded-xl pl-12 pr-4 py-3 text-on-surface focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all placeholder:opacity-30"
            placeholder="San Francisco, CA"
            type="text"
            {...register("location")}
          />
        </div>
        {errors.location && <p className="text-xs text-[#ff6b6b]">{errors.location.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-syne text-label-sm text-[var(--accent)] uppercase tracking-wider">
          Years of Experience
        </label>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setValue("experienceLevel", level.value, { shouldValidate: true })}
              className={
                experienceLevel === level.value
                  ? "flex-shrink-0 px-6 py-2 rounded-full bg-[var(--accent)] text-on-primary transition-all font-bold uppercase text-xs tracking-widest shadow-lg"
                  : "flex-shrink-0 px-6 py-2 rounded-full border border-outline-variant hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[var(--text-secondary)] font-bold uppercase text-xs tracking-widest"
              }
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="self-end flex items-center gap-2 px-8 py-4 rounded-2xl font-syne font-extrabold text-on-primary primary-gradient glow-effect hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic disabled:opacity-60"
      >
        {isSaving ? <InlineSpinner /> : <span>Next Step</span>}
        {!isSaving && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>
    </form>
  );
}
