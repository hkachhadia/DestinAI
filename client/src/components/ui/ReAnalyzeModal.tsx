import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useResumeUpload } from '@/hooks/useResumeUpload';
import { validateResumeFile } from '@/utils/validators';
import { TARGET_ROLES } from '@/utils/constants';
import { InlineSpinner } from './FullScreenSpinner';
import { ErrorBanner } from './ErrorBanner';
import { toast } from './Toast';
import type { TriggerAnalysisPayload } from '@/api/analysisApi';

interface ReAnalyzeModalProps {
  open: boolean;
  onClose: () => void;
  onAnalysisStarted: (payload: TriggerAnalysisPayload) => void;
  isAnalyzing: boolean;
}

interface PlatformField {
  key: keyof TriggerAnalysisPayload;
  label: string;
  placeholder: string;
  icon: string;
  iconColor: string;
}

const PLATFORM_FIELDS: PlatformField[] = [
  { key: 'githubUsername',     label: 'GitHub',       placeholder: 'your-username',   icon: 'code',          iconColor: 'text-[var(--accent)]'               },
  { key: 'leetcodeUsername',   label: 'LeetCode',     placeholder: 'your_handle',     icon: 'terminal',      iconColor: 'text-[var(--purple)]' },
  { key: 'codeforcesHandle',   label: 'Codeforces',   placeholder: 'your_handle',     icon: 'military_tech', iconColor: 'text-[var(--accent)]'       },
  { key: 'codechefUsername',   label: 'CodeChef',     placeholder: 'your_handle',     icon: 'restaurant',    iconColor: 'text-orange-400'          },
  { key: 'gfgUsername',        label: 'GFG',          placeholder: 'your_handle',     icon: 'school',        iconColor: 'text-green-400'           },
  { key: 'hackerrankUsername', label: 'HackerRank',   placeholder: 'your_handle',     icon: 'star',          iconColor: 'text-teal-400'            },
];

const SUPPLEMENTAL_FIELDS: PlatformField[] = [
  { key: 'linkedinUrl',    label: 'LinkedIn URL',  placeholder: 'linkedin.com/in/you',  icon: 'person_search', iconColor: 'text-[#0A66C2]'  },
  { key: 'portfolioUrl',  label: 'Portfolio URL',  placeholder: 'https://yoursite.dev', icon: 'language',      iconColor: 'text-purple-400' },
  { key: 'kaggleUsername',label: 'Kaggle',         placeholder: 'your_handle',          icon: 'data_object',   iconColor: 'text-sky-400'    },
  { key: 'mediumUsername',label: 'Medium',         placeholder: '@username',            icon: 'article',       iconColor: 'text-gray-400'   },
  { key: 'devtoUsername', label: 'Dev.to',         placeholder: 'username',             icon: 'edit_note',     iconColor: 'text-indigo-400' },
];

export function ReAnalyzeModal({ open, onClose, onAnalysisStarted, isAnalyzing }: ReAnalyzeModalProps) {
  const { user } = useAuth();
  const { upload, isUploading, uploadError, isParsed } = useResumeUpload();
  const [targetRole, setTargetRole]   = useState(user?.targetRole ?? '');
  const [roleSearch, setRoleSearch]   = useState('');
  const [showRoles, setShowRoles]     = useState(false);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [showSupplemental, setShowSupplemental] = useState(false);
  const [handles, setHandles] = useState<Record<string, string>>({});

  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTargetRole(user?.targetRole ?? '');
      setFileName(null);
      setHandles({});
      setRoleSearch('');
    }
  }, [open, user?.targetRole]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  const filteredRoles = roleSearch
    ? TARGET_ROLES.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()))
    : TARGET_ROLES;

  const handleFileChange = (file: File | null) => {
    const err = validateResumeFile(file);
    if (err) { toast.error(err); return; }
    setFileName(file!.name);
    upload(file!);
  };

  const handleRun = () => {
    // Build payload — only include non-empty handles
    const payload: TriggerAnalysisPayload = { targetRole };
    for (const field of [...PLATFORM_FIELDS, ...SUPPLEMENTAL_FIELDS]) {
      const val = handles[field.key]?.trim();
      if (val) (payload as Record<string, string>)[field.key as string] = val;
    }
    onAnalysisStarted(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl  rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="font-syne text-xl md:text-2xl font-bold uppercase tracking-tight">Re-Analyze Profile</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Update any fields to fetch the freshest data for your new scan.</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-on-surface transition-colors p-1 shrink-0">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-5">
          {/* Target Role — searchable */}
          <div className="space-y-2" ref={roleRef}>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Target Role</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">search</span>
              <input
                type="text"
                value={showRoles ? roleSearch : targetRole}
                onFocus={() => { setShowRoles(true); setRoleSearch(''); }}
                onBlur={() => setTimeout(() => setShowRoles(false), 150)}
                onChange={e => { setRoleSearch(e.target.value); if (!e.target.value) setTargetRole(''); }}
                placeholder="Search roles…"
                className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-on-surface focus:outline-none focus:border-[var(--accent)] transition-all"
              />
            </div>
            {showRoles && (
              <div className="absolute z-50 w-[calc(100%-3rem)] max-h-52 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl custom-scrollbar">
                {filteredRoles.map(role => (
                  <button key={role} type="button" onMouseDown={() => { setTargetRole(role); setShowRoles(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--bg-subtle)] flex items-center justify-between" style={{ color: targetRole === role ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {role}
                    {targetRole === role && <span className="material-symbols-outlined text-[15px]" style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1,'opsz' 20" }}>check</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              Resume <span className="opacity-50">(optional — replaces current)</span>
            </label>
            <label className={`flex items-center gap-3 p-3.5 rounded-xl border border-dashed cursor-pointer transition-all ${isParsed ? 'border-[var(--accent)]/60 bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
              <span className={`material-symbols-outlined ${isParsed ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                {isParsed ? 'task_alt' : 'cloud_upload'}
              </span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {isUploading ? 'Uploading…' : isParsed ? `✓ ${fileName}` : fileName ?? 'Upload PDF or DOCX (max 5 MB)'}
              </span>
              <input type="file" accept=".pdf,.docx" className="sr-only"
                onChange={e => handleFileChange(e.target.files?.[0] ?? null)} />
            </label>
            {uploadError && <ErrorBanner message={uploadError} />}
          </div>

          {/* Platform handles — grid */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 block">
              Coding Platforms <span className="opacity-50 normal-case font-normal">(leave blank to keep current)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLATFORM_FIELDS.map(({ key, label, placeholder, icon, iconColor }) => (
                <div key={key} className="flex items-center gap-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-[var(--accent)]/60 transition-all">
                  <span className={`material-symbols-outlined text-base shrink-0 ${iconColor}`}>{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{label}</p>
                    <input
                      type="text"
                      value={handles[key] ?? ''}
                      onChange={e => setHandles(h => ({ ...h, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-transparent border-none p-0 text-sm text-on-surface placeholder:text-[var(--text-muted)] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supplemental fields — collapsible */}
          <div>
            <button type="button" onClick={() => setShowSupplemental(s => !s)}
              className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-sm">{showSupplemental ? 'expand_less' : 'expand_more'}</span>
              LinkedIn, Portfolio &amp; More
              <span className="opacity-40 normal-case font-normal ml-1">optional</span>
            </button>
            {showSupplemental && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {SUPPLEMENTAL_FIELDS.map(({ key, label, placeholder, icon, iconColor }) => (
                  <div key={key} className="flex items-center gap-3 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-[var(--accent)]/60 transition-all">
                    <span className={`material-symbols-outlined text-base shrink-0 ${iconColor}`}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{label}</p>
                      <input
                        type="text"
                        value={handles[key] ?? ''}
                        onChange={e => setHandles(h => ({ ...h, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none p-0 text-sm text-on-surface placeholder:text-[var(--text-muted)] outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="p-3.5 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/15 flex items-start gap-3">
            <span className="material-symbols-outlined text-[var(--accent)] text-sm shrink-0 mt-0.5">info</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              New platform handles will be connected and synced before scoring.
              Blank fields keep your existing connected profiles. Every analysis is saved separately — your history is never overwritten.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[var(--border)]">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-all text-sm">
            Cancel
          </button>
          <button onClick={handleRun} disabled={isUploading || isAnalyzing}
            className="flex items-center gap-2 px-7 py-3 primary-gradient text-on-primary font-extrabold rounded-xl active:scale-95 transition-all disabled:opacity-50 text-sm">
            {isAnalyzing
              ? <><InlineSpinner className="border-white/30 border-t-white" /><span>Analyzing…</span></>
              : <><span className="material-symbols-outlined text-sm">rocket_launch</span><span>Run New Analysis</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}
