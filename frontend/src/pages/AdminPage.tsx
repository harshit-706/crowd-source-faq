import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import WordCloud from '../components/ui/WordCloud';

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
}

interface Post {
  _id: string;
  title: string;
  body: string;
  author?: { name: string };
  status: string;
  upvotes: unknown[];
  comments: unknown[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AnalyticsData {
  totalSearches?: number;
  popularQueries?: Array<{ query: string; count: number }>;
  failedQueries?: Array<{ query: string; count: number }>;
}

interface FAQForm {
  question: string;
  answer: string;
  category: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // FAQ State
  const [groupedFAQs, setGroupedFAQs] = useState<Record<string, unknown[]>>({});
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState<FAQForm>({ question: '', answer: '', category: '' });
  const [faqFormLoading, setFaqFormLoading] = useState(false);
  const [faqError, setFaqError] = useState('');

  // Community State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingPost, setResolvingPost] = useState<Post | null>(null);
  const [resolveAnswer, setResolveAnswer] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  // Users State (Admin Only)
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Dialog Refs
  const faqDialogRef = useRef<HTMLDialogElement>(null);
  const resolveDialogRef = useRef<HTMLDialogElement>(null);

  const isAdmin = user?.role === 'admin';

  // --- Fetchers ---
  const fetchAnalytics = () => {
    setAnalyticsLoading(true);
    api.get('/analytics')
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setAnalyticsLoading(false));
  };

  const fetchFAQs = () => {
    setFaqsLoading(true);
    api.get('/faq')
      .then((res) => setGroupedFAQs(res.data.grouped || {}))
      .catch((err) => console.error(err))
      .finally(() => setFaqsLoading(false));
  };

  const fetchPosts = () => {
    setPostsLoading(true);
    api.get('/community')
      .then((res) => setPosts(res.data.posts || []))
      .catch((err) => console.error(err))
      .finally(() => setPostsLoading(false));
  };

  const fetchUsers = () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    setUsersError('');
    api.get('/auth/users')
      .then((res) => setUsers(res.data.users || []))
      .catch(() => setUsersError('Failed to load users.'))
      .finally(() => setUsersLoading(false));
  };

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
    if (activeTab === 'faqs') fetchFAQs();
    if (activeTab === 'community') fetchPosts();
    if (activeTab === 'users' && isAdmin) fetchUsers();
  }, [activeTab]);

  // --- Dialog Handle ---
  useEffect(() => {
    if (showFAQModal && faqDialogRef.current) {
      faqDialogRef.current.showModal();
    } else if (!showFAQModal && faqDialogRef.current) {
      faqDialogRef.current.close();
    }
  }, [showFAQModal]);

  useEffect(() => {
    if (showResolveModal && resolveDialogRef.current) {
      resolveDialogRef.current.showModal();
    } else if (!showResolveModal && resolveDialogRef.current) {
      resolveDialogRef.current.close();
    }
  }, [showResolveModal]);

  // --- FAQ Actions ---
  const handleOpenCreateFAQ = (prefilledQuestion = '') => {
    setEditingFAQ(null);
    setFaqForm({ question: prefilledQuestion, answer: '', category: '' });
    setFaqError('');
    setShowFAQModal(true);
  };

  const handleOpenEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category });
    setFaqError('');
    setShowFAQModal(true);
  };

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim() || !faqForm.category.trim()) {
      setFaqError('All fields are required.');
      return;
    }
    setFaqFormLoading(true);
    setFaqError('');
    try {
      if (editingFAQ) {
        await api.put(`/faq/${editingFAQ._id}`, faqForm);
      } else {
        await api.post('/faq', faqForm);
      }
      setShowFAQModal(false);
      fetchFAQs();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFaqError(error.response?.data?.message || 'Failed to save FAQ.');
    } finally {
      setFaqFormLoading(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await api.delete(`/faq/${id}`);
      fetchFAQs();
    } catch (err) {
      alert('Failed to delete FAQ.');
    }
  };

  // --- Community Actions ---
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/community/${id}`);
      fetchPosts();
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  const handleOpenResolve = (post: Post) => {
    setResolvingPost(post);
    setResolveAnswer('');
    setShowResolveModal(true);
  };

  const handleResolvePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveAnswer.trim()) return;
    setResolveLoading(true);
    try {
      await api.patch(`/community/${resolvingPost?._id}/resolve`, { answer: resolveAnswer });
      setShowResolveModal(false);
      fetchPosts();
    } catch (err) {
      alert('Failed to resolve post.');
    } finally {
      setResolveLoading(false);
    }
  };

  // --- User Management Actions (Admin Only) ---
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update user role.');
    }
  };

  // Flatten FAQs for list viewing
  const flatFAQs: FAQ[] = [];
  Object.keys(groupedFAQs).forEach((cat) => {
    (groupedFAQs[cat] as FAQ[]).forEach((faq) => {
      flatFAQs.push({ ...faq, category: cat });
    });
  });

  return (
    <div className="min-h-screen bg-bg relative">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-12 relative z-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif text-ink tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-ink-soft mt-1">Manage users, FAQs, community discussions, and system analytics</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 border-b border-border mb-8 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap
              ${activeTab === 'analytics' ? 'border-accent text-accent font-semibold' : 'border-transparent text-ink-soft hover:text-ink hover:border-border'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap
              ${activeTab === 'faqs' ? 'border-accent text-accent font-semibold' : 'border-transparent text-ink-soft hover:text-ink hover:border-border'}`}
          >
            FAQ Management
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap
              ${activeTab === 'community' ? 'border-accent text-accent font-semibold' : 'border-transparent text-ink-soft hover:text-ink hover:border-border'}`}
          >
            Community Moderation
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap
                ${activeTab === 'users' ? 'border-accent text-accent font-semibold' : 'border-transparent text-ink-soft hover:text-ink hover:border-border'}`}
            >
              User Management
            </button>
          )}
        </div>

        {/* --- Tab Content: Analytics --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* Stats Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-subtle">
                    <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Total Searches</h3>
                    <p className="text-3xl font-serif text-ink mt-2">{analytics?.totalSearches ?? 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Popular Queries — Word Cloud */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle">
                    <h3 className="text-sm font-serif text-ink mb-4">Popular Queries — Word Cloud</h3>
                    {analytics?.popularQueries?.length === 0 ? (
                      <p className="text-sm text-ink-soft">No search data yet.</p>
                    ) : (
                      <WordCloud
                        words={(analytics?.popularQueries || []).map(q => ({ query: q.query, count: q.count }))}
                        onWordClick={(query) => {
                          // Could navigate to search or highlight
                          console.log('Word clicked:', query);
                        }}
                      />
                    )}
                  </div>

                  {/* Failed Queries */}
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-subtle">
                    <h3 className="text-sm font-serif text-ink mb-4">Failed Queries (0 Results)</h3>
                    {analytics?.failedQueries?.length === 0 ? (
                      <p className="text-sm text-ink-soft">No failed searches recorded.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics?.failedQueries?.map((q, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 gap-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink truncate">"{q.query}"</p>
                              <p className="text-xs text-ink-faint mt-0.5">{q.count} occurrences</p>
                            </div>
                            <button
                              onClick={() => { handleOpenCreateFAQ(q.query); setActiveTab('faqs'); }}
                              className="px-3 py-1.5 text-xs bg-accent-light text-accent rounded-xl hover:bg-accent hover:text-white transition-colors cursor-pointer"
                            >
                              Add to FAQ
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- Tab Content: FAQs --- */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif text-ink">Registered FAQs</h2>
              <button
                onClick={() => handleOpenCreateFAQ()}
                className="px-4 py-2 text-xs font-semibold text-white bg-accent rounded-xl hover:bg-accent-dark transition-colors cursor-pointer"
              >
                Add New FAQ
              </button>
            </div>

            {faqsLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : flatFAQs.length === 0 ? (
              <p className="text-center text-sm text-ink-soft py-16">No FAQs configured yet.</p>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Category</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider w-1/3">Question</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider w-1/3">Answer</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flatFAQs.map((faq) => (
                        <tr key={faq._id} className="border-b border-border/50 hover:bg-bg/40 last:border-0">
                          <td className="p-4">
                            <Badge variant="accent">{faq.category}</Badge>
                          </td>
                          <td className="p-4 text-sm font-medium text-ink leading-snug">{faq.question}</td>
                          <td className="p-4 text-xs text-ink-soft line-clamp-2 leading-relaxed mt-3">{faq.answer}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleOpenEditFAQ(faq)}
                                className="px-2.5 py-1.5 text-xs border border-border text-ink-soft hover:bg-bg hover:text-ink rounded-lg transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFAQ(faq._id)}
                                className="px-2.5 py-1.5 text-xs bg-danger-light text-danger hover:bg-danger hover:text-white rounded-lg transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tab Content: Community Board --- */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <h2 className="text-lg font-serif text-ink">Community Discussions</h2>

            {postsLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : posts.length === 0 ? (
              <p className="text-center text-sm text-ink-soft py-16">No discussions submitted yet.</p>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider w-1/4">Title</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Author</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Stats</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => {
                        const isResolved = post.status === 'answered';
                        return (
                          <tr key={post._id} className="border-b border-border/50 hover:bg-bg/40 last:border-0">
                            <td className="p-4">
                              <Badge variant={isResolved ? 'success' : 'warning'}>
                                {isResolved ? 'Resolved' : 'Open'}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm font-medium text-ink leading-snug">{post.title}</td>
                            <td className="p-4 text-xs text-ink-soft">{post.author?.name || 'Student'}</td>
                            <td className="p-4 text-xs text-ink-faint space-y-0.5">
                              <div>{post.upvotes?.length ?? 0} upvotes</div>
                              <div>{post.comments?.length ?? 0} comments</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {!isResolved && (
                                  <button
                                    onClick={() => handleOpenResolve(post)}
                                    className="px-2.5 py-1.5 text-xs bg-success-light text-success hover:bg-success hover:text-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    Resolve
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="px-2.5 py-1.5 text-xs bg-danger-light text-danger hover:bg-danger hover:text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Tab Content: Users --- */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            <h2 className="text-lg font-serif text-ink">User Account Directory</h2>

            {usersLoading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : usersError ? (
              <div className="p-4 bg-danger-light border border-danger/15 rounded-2xl text-sm text-danger">{usersError}</div>
            ) : users.length === 0 ? (
              <p className="text-center text-sm text-ink-soft py-16">No registered users found.</p>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-subtle">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-bg border-b border-border">
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Name</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Email</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider">Role</th>
                        <th className="p-4 text-xs font-semibold text-ink-soft uppercase tracking-wider text-right">Access Role Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="border-b border-border/50 hover:bg-bg/40 last:border-0">
                          <td className="p-4 text-sm font-medium text-ink">{u.name}</td>
                          <td className="p-4 text-xs text-ink-soft">{u.email}</td>
                          <td className="p-4">
                            <Badge variant={u.role === 'admin' ? 'success' : u.role === 'moderator' ? 'accent' : 'warning'}>
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                              disabled={u._id === user?.id || u._id === user?._id}
                              className="px-2.5 py-1.5 text-xs border border-border bg-white rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
      <Footer />

      {/* --- FAQ Creation & Edit Modal Dialog --- */}
      <dialog
        ref={faqDialogRef}
        closedby="any"
        className="m-auto w-full max-w-lg rounded-2xl border border-black/8 shadow-2xl bg-white p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-ink">{editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}</h2>
              <p className="text-xs text-ink-soft mt-0.5">Define category, question, and verified solution details</p>
            </div>
            <button
              onClick={() => setShowFAQModal(false)}
              className="w-8 h-8 rounded-full bg-mist flex items-center justify-center text-ink-soft hover:text-ink hover:bg-black/8 transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSaveFAQ} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Category *</label>
              <input
                type="text"
                value={faqForm.category}
                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                placeholder="E.g. NOC (No Objection Certificate)"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Question *</label>
              <input
                type="text"
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="E.g. What dates do I put on the NOC?"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Answer *</label>
              <textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                rows={5}
                placeholder="Write the official verified answer detail..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-200 resize-none"
              />
            </div>

            {faqError && (
              <p className="text-xs text-danger bg-danger-light border border-danger/15 rounded-lg px-3 py-2">{faqError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={faqFormLoading || !faqForm.question.trim() || !faqForm.answer.trim() || !faqForm.category.trim()}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {faqFormLoading ? 'Saving...' : 'Save FAQ'}
              </button>
              <button
                type="button"
                onClick={() => setShowFAQModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-ink-soft text-sm font-medium hover:bg-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* --- Resolve Question Modal Dialog --- */}
      <dialog
        ref={resolveDialogRef}
        closedby="any"
        className="m-auto w-full max-w-lg rounded-2xl border border-black/8 shadow-2xl bg-white p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Resolve Community Query</h2>
              <p className="text-xs text-ink-soft mt-0.5">Submit an official solution to close this discussion thread</p>
            </div>
            <button
              onClick={() => setShowResolveModal(false)}
              className="w-8 h-8 rounded-full bg-mist flex items-center justify-center text-ink-soft hover:text-ink hover:bg-black/8 transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="mb-4 bg-bg rounded-xl p-3.5 border border-border">
            <h4 className="text-xs font-semibold text-ink-soft">Discussion Title:</h4>
            <p className="text-sm font-medium text-ink mt-1">{resolvingPost?.title}</p>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">{resolvingPost?.body}</p>
          </div>

          <form onSubmit={handleResolvePost} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-soft mb-1.5">Official Answer *</label>
              <textarea
                value={resolveAnswer}
                onChange={(e) => setResolveAnswer(e.target.value)}
                rows={5}
                placeholder="Provide a clear, helpful resolution..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent transition-all duration-200 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={resolveLoading || !resolveAnswer.trim()}
                className="flex-1 py-2.5 rounded-xl bg-success text-white text-sm font-medium hover:bg-success-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {resolveLoading ? 'Submitting...' : 'Resolve Query'}
              </button>
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-ink-soft text-sm font-medium hover:bg-bg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>

    </div>
  );
}