import React, { useState, FormEvent, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../hooks/useAdminAuth';
import adminApi from '../utils/adminApi';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-sm font-semibold text-white/80">{title}</p>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const INPUT = "w-full px-3 py-2.5 rounded-lg text-sm text-white/80 placeholder-white/20 outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' };

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  desc?: string;
}

function Toggle({ checked, onChange, label, desc }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm text-white/70">{label}</p>
        {desc && <p className="text-xs text-white/30 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
        style={{ background: checked ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.1)' }}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

interface ProfileState {
  name: string;
  email: string;
}

interface PasswordsState {
  current: string;
  next: string;
  confirm: string;
}

interface NotifsState {
  newFaq: boolean;
  pendingApproval: boolean;
  newUser: boolean;
  systemAlerts: boolean;
  weeklyReport: boolean;
}

interface ToastState {
  msg: string;
  type: 'success' | 'error';
}

export default function AdminSettings() {
  const { user } = useAdminAuth();
  const [profile, setProfile] = useState<ProfileState>({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState<PasswordsState>({ current: '', next: '', confirm: '' });
  const [notifs, setNotifs] = useState<NotifsState>({
    newFaq: true, pendingApproval: true, newUser: false, systemAlerts: true, weeklyReport: false,
  });
  const [notifsLoaded, setNotifsLoaded] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await adminApi.patch('/auth/profile', { name: profile.name, email: profile.email });
      showToast(res.data.message || 'Profile updated successfully');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update profile';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (passwords.next.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.put('/auth/password', { currentPassword: passwords.current, newPassword: passwords.next });
      showToast('Password changed successfully');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to change password';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>, field: keyof ProfileState) => {
    setProfile(p => ({ ...p, [field]: e.target.value }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>, field: keyof PasswordsState) => {
    setPasswords(p => ({ ...p, [field]: e.target.value }));
  };

  // Load notification preferences on mount
  useEffect(() => {
    adminApi.get<NotifsState>('/notifications/settings')
      .then(res => {
        setNotifs(res.data);
        setNotifsLoaded(true);
      })
      .catch(() => setNotifsLoaded(true)); // fall back to defaults
  }, []);

  const saveNotif = async (key: keyof NotifsState, value: boolean) => {
    setNotifs(n => ({ ...n, [key]: value }));
    try {
      await adminApi.patch('/notifications/settings', { [key]: value });
    } catch {
      // revert on failure
      setNotifs(n => ({ ...n, [key]: !value }));
      showToast('Failed to save preference', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-8 max-w-2xl">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium border"
          style={{
            background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
            color: toast.type === 'error' ? '#f87171' : '#34d399',
          }}
        >{toast.msg}</motion.div>
      )}

      <div>
        <h2 className="text-lg font-bold text-white/90">Settings</h2>
        <p className="text-xs text-white/30 mt-0.5">Manage your admin profile and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Admin Profile" subtitle="Update your name and email address">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 0 20px rgba(139,92,246,0.35)' }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{user?.name}</p>
            <p className="text-xs text-white/30">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md border capitalize"
              style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>
              {user?.role}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/30 mb-1.5">Display Name</label>
            <input value={profile.name} onChange={e => handleProfileChange(e, 'name')}
              className={INPUT} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>
          <div>
            <label className="block text-xs text-white/30 mb-1.5">Email Address</label>
            <input value={profile.email} onChange={e => handleProfileChange(e, 'email')}
              type="email" className={INPUT} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </Section>

      {/* Password */}
      <Section title="Change Password" subtitle="Update your admin account password">
        <form onSubmit={changePassword} className="space-y-3">
          {[
            { label: 'Current Password', key: 'current' as const },
            { label: 'New Password', key: 'next' as const },
            { label: 'Confirm New Password', key: 'confirm' as const },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-white/30 mb-1.5">{f.label}</label>
              <input type="password" value={passwords[f.key]}
                onChange={e => handlePasswordChange(e, f.key)}
                placeholder="••••••••"
                className={INPUT} style={inputStyle}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
          ))}
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            Change Password
          </button>
        </form>
      </Section>

      {/* Notifications */}
      <Section title="Notification Preferences" subtitle="Choose what you want to be notified about">
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <Toggle checked={notifs.newFaq} onChange={v => saveNotif('newFaq', v)}
            label="New FAQ submissions" desc="Alert when a new FAQ is submitted for review" />
          <Toggle checked={notifs.pendingApproval} onChange={v => saveNotif('pendingApproval', v)}
            label="Pending approvals reminder" desc="Daily digest of pending FAQs" />
          <Toggle checked={notifs.newUser} onChange={v => saveNotif('newUser', v)}
            label="New user registrations" desc="Alert when a new user registers" />
          <Toggle checked={notifs.systemAlerts} onChange={v => saveNotif('systemAlerts', v)}
            label="System alerts" desc="Important platform notifications" />
          <Toggle checked={notifs.weeklyReport} onChange={v => saveNotif('weeklyReport', v)}
            label="Weekly analytics report" desc="Summary email every Monday" />
        </div>
      </Section>

      {/* Security */}
      <Section title="Security" subtitle="Manage your session and access controls">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <p className="text-sm text-white/70">Current session</p>
              <p className="text-xs text-white/30 mt-0.5">Logged in as {user?.email}</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div>
              <p className="text-sm text-white/70">Token expiry</p>
              <p className="text-xs text-white/30 mt-0.5">JWT expires in 7 days</p>
            </div>
            <span className="text-xs text-amber-400">7d</span>
          </div>
          <div className="text-xs text-white/20 px-1">
            Tokens are stored securely in localStorage. For enhanced security, use HTTPS in production.
          </div>
        </div>
      </Section>
    </div>
  );
}
