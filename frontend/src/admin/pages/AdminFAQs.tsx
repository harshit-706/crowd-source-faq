import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminApi from '../utils/adminApi';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { TableSkeleton } from '../components/common/SkeletonLoader';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
  views: number;
  helpfulVotes: number;
  createdAt: string;
}

interface NewFaqForm {
  question: string;
  answer: string;
  category: string;
  status: 'approved' | 'pending' | 'rejected';
}

interface Toast {
  msg: string;
  type: 'success' | 'warn' | 'error';
}

interface FAQApiResponse {
  faqs: FAQ[];
  total: number;
  pages: number;
  categories?: string[];
}

const INPUT = "w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/20 outline-none transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as const;
const focusStyle = { borderColor: 'rgba(139,92,246,0.5)' } as const;

export default function AdminFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const debouncedSearch = useDebounce(search, 350);

  const [editModal, setEditModal] = useState(false);
  const [editFaq, setEditFaq] = useState<FAQ | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [newFaq, setNewFaq] = useState<NewFaqForm>({ question: '', answer: '', category: '', status: 'approved' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (msg: string, type: Toast['type'] = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFaqs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '10', sort });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);

    adminApi.get<FAQApiResponse>(`/admin/faqs?${params}`)
      .then(r => {
        setFaqs(r.data.faqs);
        setTotal(r.data.total);
        setPages(r.data.pages);
        setCategories(r.data.categories || []);
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load FAQs';
        console.error(msg, err);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, statusFilter, categoryFilter, sort]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, categoryFilter]);

  const handleApprove = async (id: string) => {
    await adminApi.post('/admin/faq/approve', { id });
    showToast('FAQ approved');
    fetchFaqs();
  };

  const handleReject = async (id: string) => {
    await adminApi.post('/admin/faq/reject', { id });
    showToast('FAQ rejected', 'warn');
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await adminApi.delete(`/admin/faq/${id}`);
    showToast('FAQ deleted', 'error');
    fetchFaqs();
  };

  const handleEdit = async () => {
    if (!editFaq) return;
    setSaving(true);
    try {
      await adminApi.put(`/admin/faq/${editFaq._id}`, {
        question: editFaq.question,
        answer: editFaq.answer,
        category: editFaq.category,
        status: editFaq.status,
      });
      showToast('FAQ updated');
      setEditModal(false);
      fetchFaqs();
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await adminApi.post('/admin/faq', newFaq);
      showToast('FAQ created');
      setAddModal(false);
      setNewFaq({ question: '', answer: '', category: '', status: 'approved' });
      fetchFaqs();
    } catch { showToast('Create failed', 'error'); }
    finally { setSaving(false); }
  };

  const cardStyle = { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' } as const;
  const rowStyle = { borderColor: 'rgba(255,255,255,0.04)' } as const;

  return (
    <div className="space-y-5 pb-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium border"
            style={{
              background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : toast.type === 'warn' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
              borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : toast.type === 'warn' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
              color: toast.type === 'error' ? '#f87171' : toast.type === 'warn' ? '#fbbf24' : '#34d399',
            }}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white/90">FAQ Management</h2>
          <p className="text-xs text-white/30 mt-0.5">{total} total FAQs</p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 16px rgba(139,92,246,0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" placeholder="Search FAQs…" value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${INPUT} pl-8`} style={inputStyle}
            onFocus={e => Object.assign(e.target.style, focusStyle)}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className={INPUT} style={{ ...inputStyle, maxWidth: 140 }}>
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className={INPUT} style={{ ...inputStyle, maxWidth: 160 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className={INPUT} style={{ ...inputStyle, maxWidth: 160 }}>
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="-views">Most viewed</option>
          <option value="-helpfulVotes">Most helpful</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={cardStyle}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_130px_90px_64px_64px_110px_100px] gap-2 px-4 py-3 border-b text-[11px] font-semibold text-white/25 uppercase tracking-wider"
          style={rowStyle}>
          <span>Question</span>
          <span>Category</span>
          <span>Status</span>
          <span className="text-right">Views</span>
          <span className="text-right">Votes</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="p-4"><TableSkeleton rows={8} /></div>
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(139,92,246,0.1)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.7)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-sm text-white/40 font-medium">No FAQs found</p>
            <p className="text-xs text-white/20 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div>
            {faqs.map((faq, i) => (
              <motion.div
                key={faq._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[1fr_130px_90px_64px_64px_110px_100px] gap-2 px-4 py-3 border-b items-center hover:bg-white/[0.02] transition-colors"
                style={rowStyle}
              >
                <p className="text-xs text-white/70 truncate pr-2" title={faq.question}>{faq.question}</p>
                <p className="text-xs text-white/40 truncate">{faq.category}</p>
                <div><Badge status={faq.status} /></div>
                <p className="text-xs text-white/40 text-right tabular-nums">{faq.views ?? 0}</p>
                <p className="text-xs text-white/40 text-right tabular-nums">{faq.helpfulVotes ?? 0}</p>
                <p className="text-[10px] text-white/30">{new Date(faq.createdAt).toLocaleDateString('en-IN')}</p>
                <div className="flex items-center justify-end gap-1">
                  {faq.status !== 'approved' && (
                    <button onClick={() => handleApprove(faq._id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Approve">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  )}
                  {faq.status !== 'rejected' && (
                    <button onClick={() => handleReject(faq._id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-amber-400 hover:bg-amber-500/10 transition-colors" title="Reject">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                  <button onClick={() => { setEditFaq({ ...faq }); setEditModal(true); }}
                    className="w-6 h-6 flex items-center justify-center rounded text-violet-400 hover:bg-violet-500/10 transition-colors" title="Edit">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(faq._id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-white/30" style={rowStyle}>
            <span>Page {page} of {pages} · {total} results</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors">← Prev</button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2 + i, pages - 4 + i));
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs transition-colors ${p === page ? 'text-violet-300 bg-violet-500/15' : 'hover:bg-white/[0.05]'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="px-3 py-1.5 rounded-lg hover:bg-white/[0.05] disabled:opacity-30 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit FAQ">
        {editFaq && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Question</label>
              <input value={editFaq.question} onChange={e => setEditFaq(f => f ? ({ ...f, question: e.target.value }) : null)}
                className={INPUT} style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Answer</label>
              <textarea rows={5} value={editFaq.answer} onChange={e => setEditFaq(f => f ? ({ ...f, answer: e.target.value }) : null)}
                className={`${INPUT} resize-none`} style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
                <input value={editFaq.category} onChange={e => setEditFaq(f => f ? ({ ...f, category: e.target.value }) : null)}
                  className={INPUT} style={inputStyle}
                  onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Status</label>
                <select value={editFaq.status} onChange={e => setEditFaq(f => f ? ({ ...f, status: e.target.value as FAQ['status'] }) : null)}
                  className={INPUT} style={inputStyle}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditModal(false)} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:bg-white/[0.04] transition-colors">Cancel</button>
              <button onClick={handleEdit} disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add New FAQ">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Question</label>
            <input value={newFaq.question} onChange={e => setNewFaq(f => ({ ...f, question: e.target.value }))}
              placeholder="Enter the question…"
              className={INPUT} style={inputStyle}
              onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Answer</label>
            <textarea rows={4} value={newFaq.answer} onChange={e => setNewFaq(f => ({ ...f, answer: e.target.value }))}
              placeholder="Enter the answer…"
              className={`${INPUT} resize-none`} style={inputStyle}
              onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
              <input value={newFaq.category} onChange={e => setNewFaq(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Technical"
                className={INPUT} style={inputStyle}
                onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Status</label>
              <select value={newFaq.status} onChange={e => setNewFaq(f => ({ ...f, status: e.target.value as NewFaqForm['status'] }))}
                className={INPUT} style={inputStyle}>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="px-4 py-2 rounded-lg text-sm text-white/40 hover:bg-white/[0.04] transition-colors">Cancel</button>
            <button onClick={handleAdd} disabled={saving || !newFaq.question || !newFaq.answer || !newFaq.category}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
              {saving ? 'Creating…' : 'Create FAQ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}