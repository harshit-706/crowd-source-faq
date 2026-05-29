import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminApi from '../utils/adminApi';
import Badge from '../components/common/Badge';

type UserRole = 'admin' | 'moderator' | 'user' | 'ai_moderator';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UsersApiResponse {
  users: AdminUser[];
  total: number;
  pages: number;
}

const ALL_ROLES: UserRole[] = ['admin', 'moderator', 'user', 'ai_moderator'];

const roleColors: Record<UserRole, string> = {
  admin: 'admin',
  moderator: 'moderator',
  user: 'user',
  ai_moderator: 'cyan',
};

// ─── Role Edit Modal ───────────────────────────────────────

interface RoleModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (updated: AdminUser) => void;
}

function RoleModal({ user, onClose, onUpdated }: RoleModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (role === user.role) { onClose(); return; }
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.patch<{ user: AdminUser }>(`/auth/users/${user._id}/role`, { role });
      onUpdated({ ...user, role: res.data.user.role });
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update role';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: '#0f0f14', borderColor: 'rgba(255,255,255,0.1)' }}>
        <h3 className="text-base font-semibold text-white/90 mb-1">Change Role</h3>
        <p className="text-xs text-white/30 mb-5">Update role for <span className="text-white/60">{user.name}</span></p>

        <div className="space-y-2 mb-5">
          {ALL_ROLES.map(r => (
            <label key={r} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border transition-all ${role === r ? 'border-violet-500/60 bg-violet-500/10' : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <input type="radio" name="role" value={r} checked={role === r}
                onChange={() => setRole(r)}
                className="accent-violet-500" />
              <span className="text-sm text-white/80 capitalize">{r.replace('_', ' ')}</span>
              {r === 'admin' && <span className="ml-auto text-[10px] text-violet-400/70">full access</span>}
              {r === 'moderator' && <span className="ml-auto text-[10px] text-cyan-400/70">moderate</span>}
              {r === 'user' && <span className="ml-auto text-[10px] text-white/30">read + post</span>}
              {r === 'ai_moderator' && <span className="ml-auto text-[10px] text-emerald-400/70">AI-assisted</span>}
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.05] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading || role === user.role}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────

interface DeleteModalProps {
  user: AdminUser;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function DeleteModal({ user, onClose, onDeleted }: DeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await adminApi.delete(`/auth/users/${user._id}`);
      onDeleted(user._id);
      onClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete user';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ background: '#0f0f14', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </div>
        <h3 className="text-base font-semibold text-white/90 mb-1">Delete User</h3>
        <p className="text-xs text-white/40 mb-5">
          Are you sure you want to delete <span className="text-white/60">{user.name}</span>? This action cannot be undone.
        </p>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:bg-white/[0.05] transition-colors">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition-colors">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN');
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const dSearch = useDebounce(search, 350);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: '15' });
    if (dSearch) params.set('search', dSearch);
    adminApi.get(`/admin/users?${params}`)
      .then(r => {
        const data = r.data as UsersApiResponse;
        setUsers(data.users);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load users';
        console.error(msg);
      })
      .finally(() => setLoading(false));
  }, [page, dSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [dSearch]);

  const handleRoleUpdated = (updated: AdminUser) => {
    setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
  };

  const handleDeleted = (id: string) => {
    setUsers(prev => prev.filter(u => u._id !== id));
    setTotal(prev => prev - 1);
  };

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' };
  const rowStyle: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.04)' };

  const stats = [
    { label: 'Total Users', value: total, color: '#8b5cf6' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#a78bfa' },
    { label: 'Moderators', value: users.filter(u => u.role === 'moderator').length, color: '#22d3ee' },
    { label: 'Regular Users', value: users.filter(u => u.role === 'user').length, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white/90">User Activity</h2>
          <p className="text-xs text-white/30 mt-0.5">{total} registered users</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={cardStyle}>
            <p className="text-2xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text" placeholder="Search users…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>

      {/* Users table */}
      <div className="rounded-xl border overflow-hidden" style={cardStyle}>
        <div className="grid grid-cols-[2fr_2fr_100px_110px_80px_60px] gap-3 px-5 py-3 border-b text-[11px] font-semibold text-white/25 uppercase tracking-wider" style={rowStyle}>
          <span>Name</span><span>Email</span><span>Role</span><span>Joined</span><span>Actions</span><span></span>
        </div>

        {loading ? (
          <div className="py-6 space-y-2 px-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-white/[0.04]" />
                <div className="flex-1 h-4 rounded bg-white/[0.04]" />
                <div className="w-24 h-5 rounded bg-white/[0.04]" />
                <div className="w-16 h-4 rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-white/30">No users found</p>
          </div>
        ) : (
          users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[2fr_2fr_100px_110px_80px_60px] gap-3 px-5 py-3.5 border-b items-center hover:bg-white/[0.02] transition-colors"
              style={rowStyle}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-white/70 truncate font-medium">{u.name}</span>
              </div>
              <span className="text-xs text-white/40 truncate">{u.email}</span>
              <div><Badge status={(roleColors[u.role] || 'default') as 'admin' | 'moderator' | 'user' | 'default'} label={u.role} /></div>
              <span className="text-xs text-white/30">{new Date(u.createdAt).toLocaleDateString('en-IN')}</span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditUser(u)}
                  title="Change role"
                  className="px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 border border-white/8 hover:border-violet-500/40 hover:text-violet-300 transition-colors">
                  Edit
                </button>
                <button
                  onClick={() => setDeleteUser(u)}
                  title="Delete user"
                  className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
              <span className="text-xs text-white/25">{timeAgo(u.updatedAt)}</span>
            </motion.div>
          ))
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t text-xs text-white/30" style={rowStyle}>
            <span>Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors">← Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editUser && (
          <RoleModal
            user={editUser}
            onClose={() => setEditUser(null)}
            onUpdated={handleRoleUpdated}
          />
        )}
        {deleteUser && (
          <DeleteModal
            user={deleteUser}
            onClose={() => setDeleteUser(null)}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}