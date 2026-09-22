import { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { targetRoleSchema, type TargetRoleValues } from '@/utils/validators';
import { TARGET_ROLES } from '@/utils/constants';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { InlineSpinner } from '@/components/ui/FullScreenSpinner';

interface TargetRoleStepProps {
  onFinish: (targetRole: string) => Promise<void>;
  isAnalyzing?: boolean;
}

export function TargetRoleStep({ onFinish, isAnalyzing = false }: TargetRoleStepProps) {
  const { updateProfile, isSaving, error } = useUpdateProfile();
  const [companyInput, setCompanyInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  /** BUG FIX: Target Role clear/reset issue.
   *
   * Root cause: `value={search || targetRole}` used a falsy-OR fallback so
   * clearing the search field (search='') made React immediately display the
   * hidden form value (targetRole), making it look like it "reset" to the
   * default. The user saw "Software Engineer" re-appear.
   *
   * Fix: use a dedicated `inputValue` string that tracks EXACTLY what the
   * user has typed/selected. `targetRole` (the form value) is only updated
   * when the user *explicitly* picks a role from the dropdown. If the user
   * clears `inputValue`, the field stays empty and we don't touch the form
   * value — the form just won't have a role selected.
   */
  const [inputValue, setInputValue] = useState('');  // what's displayed in the text box
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TargetRoleValues>({
    resolver: zodResolver(targetRoleSchema),
    defaultValues: { targetRole: '', targetCompanies: [] },
  });

  const targetRole = watch('targetRole');
  const companies  = watch('targetCompanies');

  const filteredRoles = useMemo(
    () => inputValue.length > 0
      ? TARGET_ROLES.filter(r => r.toLowerCase().includes(inputValue.toLowerCase()))
      : TARGET_ROLES,
    [inputValue]
  );

  /** User picks a role from the dropdown */
  const selectRole = (role: string) => {
    setValue('targetRole', role, { shouldValidate: true });
    setInputValue(role);   // show the chosen role in the text box
    setShowDropdown(false);
  };

  /** User types in the text box */
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setShowDropdown(true);

    // If the user completely clears the input, clear the form value too
    // so validation correctly fails (required field).
    if (val === '') {
      setValue('targetRole', '', { shouldValidate: false });
    }
    // Do NOT automatically set targetRole from partial typing — only
    // explicit selection from the dropdown sets the real form value.
  };

  const addCompany = () => {
    const trimmed = companyInput.trim();
    if (trimmed && !companies.includes(trimmed)) {
      setValue('targetCompanies', [...companies, trimmed]);
    }
    setCompanyInput('');
  };

  const removeCompany = (name: string) =>
    setValue('targetCompanies', companies.filter(c => c !== name));

  const onSubmit = async (values: TargetRoleValues) => {
    setLocalError(null);
    try {
      await updateProfile({ targetRole: values.targetRole, targetCompanies: values.targetCompanies });
      await onFinish(values.targetRole);
    } catch (err) {
      setLocalError((err as Error).message ?? 'Something went wrong. Please try again.');
    }
  };

  const busy = isSaving || isAnalyzing;

  const inputCls = "w-full border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
  const inputStyle = {
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Define Your Goal</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Choose your target role — we'll run your first AI career analysis immediately.
        </p>
      </div>

      <ErrorBanner message={localError ?? error} />

      {/* ── Searchable Role Picker ── */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Target Role <span className="text-[var(--text-muted)] normal-case lowercase font-normal">({TARGET_ROLES.length}+ roles)</span>
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] pointer-events-none"
            style={{ color: 'var(--text-muted)', fontVariationSettings: "'wght' 350,'opsz' 20" }}>search</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInput}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="Search or type a role…"
            className={inputCls}
            style={inputStyle}
            autoComplete="off"
          />
          {/* Clear button — only when field has content */}
          {inputValue && (
            <button type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all hover:bg-[var(--bg-overlay)]"
              style={{ color: 'var(--text-muted)' }}
              onMouseDown={e => { e.preventDefault(); setInputValue(''); setValue('targetRole', ''); setShowDropdown(false); }}>
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
          <input type="hidden" {...register('targetRole')} />
        </div>

        {/* Dropdown list */}
        {showDropdown && filteredRoles.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl shadow-lg max-h-52 overflow-y-auto custom-scrollbar"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-dropdown)' }}>
            {filteredRoles.map(role => (
              <button type="button" key={role}
                onMouseDown={() => selectRole(role)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--bg-subtle)] flex items-center justify-between"
                style={{ color: targetRole === role ? 'var(--accent)' : 'var(--text-primary)' }}>
                <span>{role}</span>
                {targetRole === role && (
                  <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1,'opsz' 20" }}>check</span>
                )}
              </button>
            ))}
          </div>
        )}

        {filteredRoles.length === 0 && showDropdown && inputValue && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            No matching roles. You can type a custom role and select it.
          </div>
        )}

        {errors.targetRole && <p className="text-xs" style={{ color: 'var(--error)' }}>{errors.targetRole.message}</p>}
      </div>

      {/* Selected role confirmation */}
      {targetRole && (
        <div className="px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--border)' }}>
          <span className="material-symbols-outlined text-[18px]"
            style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1,'opsz' 20" }}>verified</span>
          <p className="text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Selected: </span>
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{targetRole}</span>
          </p>
        </div>
      )}

      {/* Target companies */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Target Companies <span style={{ color: 'var(--text-muted)' }} className="normal-case lowercase font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2 items-center min-h-[36px]">
          {companies.map(name => (
            <span key={name} className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
              {name}
              <button type="button" onClick={() => removeCompany(name)}
                className="hover:opacity-70 transition-opacity">
                <span className="material-symbols-outlined text-[13px]">close</span>
              </button>
            </span>
          ))}
          <input
            value={companyInput}
            onChange={e => setCompanyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompany(); } }}
            placeholder="Add company + Enter"
            className="px-3 py-1 rounded-lg text-xs outline-none"
            style={{ background: 'transparent', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)' }}
          />
        </div>
      </div>

      {/* Info note */}
      <div className="px-4 py-3.5 rounded-xl flex items-start gap-3"
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5"
          style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1,'opsz' 20" }}>info</span>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Clicking <strong style={{ color: 'var(--text-primary)' }}>Run Analysis</strong> will immediately start your first AI career analysis. This takes about 30 seconds.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={busy}
          className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {busy
            ? <><InlineSpinner className="border-white/30 border-t-white" /><span>{isAnalyzing ? 'Running Analysis…' : 'Saving…'}</span></>
            : <><span className="material-symbols-outlined text-[17px]">rocket_launch</span><span>Run Analysis</span></>}
        </button>
      </div>
    </form>
  );
}
