import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { QueryBoundary } from '@/components/states/QueryBoundary';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { InlineSpinner } from '@/components/ui/FullScreenSpinner';
import { toast } from '@/components/ui/Toast';
import { useSettings, useSaveSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { userApi } from '@/api/userApi';

const sectionCls = "rounded-xl border border-[var(--border)] overflow-hidden";
const sectionHeaderCls = "px-5 py-4 border-b border-[var(--border)]";
const sectionBodyCls = "px-5 py-5";

export function SettingsPage() {
  const { data, isLoading, isError, refetch } = useSettings();
  const { saveSettings, isSaving, error: saveError } = useSaveSettings();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutConfirm(false);
    setIsLoggingOut(true);
    try { await logout(); navigate('/auth', { replace: true }); }
    catch { toast.error('Logout failed — please try again'); }
    finally { setIsLoggingOut(false); }
  };

  const handleDeleteAccount = async () => {
    setDeleteConfirm(false);
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await userApi.deleteAccount();
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      setDeleteError((err as Error).message ?? 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageShell title="Settings" subtitle="Manage your profile and account preferences">
      <div className="max-w-2xl space-y-5">
        <QueryBoundary isLoading={isLoading} isError={isError} data={data} onRetry={refetch}
          loadingHeightClassName="h-64" isEmpty={() => false}
          emptyProps={{ icon: 'settings', title: 'No settings', description: '' }}>
          {(settings) => (
            <SettingsForm settings={settings} isSaving={isSaving} saveError={saveError}
              onSave={async (patch) => { await saveSettings(patch); toast.success('Settings saved'); }} />
          )}
        </QueryBoundary>

        {/* Appearance */}
        <div className={sectionCls} style={{ background: 'var(--bg-card)' }}>
          <div className={sectionHeaderCls}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Choose how DestinAI looks on this device</p>
          </div>
          <div className={sectionBodyCls}>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-subtle px-4 py-3">
              <span className="material-symbols-outlined text-accent" aria-hidden="true">dark_mode</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">Theme</p>
                <p className="text-xs text-muted">Use the single theme button in the navigation to switch between light and dark mode.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className={sectionCls} style={{ background: 'var(--bg-card)' }}>
          <div className={sectionHeaderCls}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Account</h3>
          </div>
          <div className={sectionBodyCls}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Signed in as <span style={{ color: 'var(--accent)' }}>{user?.email}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Logging out clears your session data</p>
              </div>
              <button onClick={() => setLogoutConfirm(true)} disabled={isLoggingOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}>
                {isLoggingOut ? <InlineSpinner /> : <span className="material-symbols-outlined text-[16px]">logout</span>}
                {isLoggingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className={sectionCls} style={{ background: 'var(--bg-card)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className={sectionHeaderCls} style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--error)' }}>Danger Zone</h3>
          </div>
          <div className={sectionBodyCls}>
            <ErrorBanner message={deleteError} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Delete account</p>
                <p className="text-xs mt-0.5 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Permanently delete your account, all analyses, AI reports, and uploaded resumes. This cannot be undone.
                </p>
              </div>
              <button onClick={() => setDeleteConfirm(true)} disabled={isDeletingAccount}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 shrink-0"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--error)' }}>
                {isDeletingAccount ? <InlineSpinner /> : <span className="material-symbols-outlined text-[16px]">delete_forever</span>}
                {isDeletingAccount ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog open={logoutConfirm} title="Sign out of DestinAI?"
        description="You will be redirected to the login page. Your data will be saved and ready when you sign back in."
        confirmLabel="Sign Out" onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
      <ConfirmDialog open={deleteConfirm} title="Delete your account?"
        description="This permanently deletes your account, all analysis history, AI reports, and uploaded resumes. This cannot be undone."
        confirmLabel="Delete My Account" cancelLabel="Keep Account" danger
        onConfirm={handleDeleteAccount} onCancel={() => setDeleteConfirm(false)} />
    </PageShell>
  );
}

interface SettingsData {
  profile: { fullName: string; email: string; bio: string; avatarUrl?: string; memberSince: string };
  notifications: { weeklyDigest: boolean; scoreAlerts: boolean; productUpdates: boolean };
  theme: 'dark' | 'light';
}

function SettingsForm({ settings, isSaving, saveError, onSave }: {
  settings: SettingsData; isSaving: boolean; saveError: string | null;
  onSave: (patch: Partial<SettingsData>) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(settings.profile.fullName);
  const [bio, setBio] = useState(settings.profile.bio);
  const [notifications, setNotifications] = useState(settings.notifications);

  const inputStyle = { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' };
  const labelStyle = { color: 'var(--text-secondary)' };

  return (
    <div className="space-y-5">
      <ErrorBanner message={saveError} />

      {/* Profile */}
      <div className={sectionCls} style={{ background: 'var(--bg-card)' }}>
        <div className={sectionHeaderCls}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Profile</h3>
        </div>
        <div className={`${sectionBodyCls} space-y-4`}>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={labelStyle}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[var(--accent)] focus:shadow-[var(--ring-focus)]"
              style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={labelStyle}>Email</label>
            <input value={settings.profile.email} disabled
              className="w-full rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed opacity-50"
              style={inputStyle} />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Email cannot be changed here</p>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={labelStyle}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Tell us about yourself…"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all resize-none focus:border-[var(--accent)] focus:shadow-[var(--ring-focus)]"
              style={inputStyle} />
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Member since {new Date(settings.profile.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className={sectionCls} style={{ background: 'var(--bg-card)' }}>
        <div className={sectionHeaderCls}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
        </div>
        <div className={sectionBodyCls}>
          {([
            { key: 'weeklyDigest'   as const, label: 'Weekly Digest',   desc: 'A weekly summary of your career progress' },
            { key: 'scoreAlerts'    as const, label: 'Score Alerts',    desc: 'Notify when scores change significantly' },
            { key: 'productUpdates' as const, label: 'Product Updates', desc: 'News about new DestinAI features' },
          ]).map(({ key, label, desc }, i, arr) => (
            <div key={key} className={`flex items-center justify-between gap-4 py-3 ${i < arr.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
              <button onClick={() => setNotifications(p => ({ ...p, [key]: !p[key] }))}
                className="relative w-10 h-6 rounded-full transition-all shrink-0 outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                style={{ background: notifications[key] ? 'var(--accent)' : 'var(--bg-overlay)' }}
                role="switch" aria-checked={notifications[key]}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications[key] ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => onSave({ profile: { ...settings.profile, fullName, bio }, notifications })}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {isSaving ? <InlineSpinner className="border-white/30 border-t-white" /> : <span className="material-symbols-outlined text-[16px]">save</span>}
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
