import React, { useEffect, useState } from 'react';
import adminApi from '../utils/adminApi';
import FAQGrowthChart from '../components/charts/FAQGrowthChart';
import UserActivityChart from '../components/charts/UserActivityChart';
import { AdminCard, AdminSectionLabel, AdminStatCard } from '../components/ui';

interface StatsData {
  totalFaqs: number;
  pendingFaqs: number;
  approvedFaqs: number;
  rejectedFaqs: number;
  totalUsers: number;
  searchesToday: number;
  totalSearches: number;
  unanswered: number;
  topCategory: string;
  newUsersThisWeek: number;
  trends?: { faqs: number };
}

interface FAQGrowthData { date?: string; count?: number; }
interface UserActivityData { date?: string; searches?: number; users?: number; }
interface SearchInsights { failedSearches?: number; failRate?: string; topQueries?: { term?: string; count?: number }[]; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [growth, setGrowth] = useState<FAQGrowthData[]>([]);
  const [activity, setActivity] = useState<UserActivityData[]>([]);
  const [searchInsights, setSearchInsights] = useState<SearchInsights | null>(null);
  const [communityTotal, setCommunityTotal] = useState(0);
  const [communityUnanswered, setCommunityUnanswered] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.get<StatsData>('/admin/stats'),
      adminApi.get<FAQGrowthData[]>('/admin/faq-growth?days=14'),
      adminApi.get<UserActivityData[]>('/admin/user-activity-chart?days=14'),
      adminApi.get<SearchInsights>('/admin/search-insights'),
      adminApi.get<{ total: number }>('/admin/community/posts?limit=1&page=1'),
      adminApi.get<{ total: number }>('/admin/community/posts?status=unanswered&limit=1&page=1'),
    ]).then(([s, g, a, si, ct, cu]) => {
      setStats(s.data);
      setGrowth(g.data);
      setActivity(a.data);
      setSearchInsights(si.data);
      setCommunityTotal(ct.data.total);
      setCommunityUnanswered(cu.data.total);
    }).finally(() => setLoading(false));
  }, []);

  const skeletonCount = () => Array.from({ length: 4 });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* FAQ stats */}
      <div>
        <AdminSectionLabel label="FAQs" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? skeletonCount().map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse"><div className="h-7 bg-mist rounded w-16 mb-2" /><div className="h-3 bg-mist rounded w-24" /></div>) : stats ? (
            <>
              <AdminStatCard label="Total" value={stats.totalFaqs} trend={stats.trends?.faqs} sub="this week" />
              <AdminStatCard label="Pending" value={stats.pendingFaqs} sub="awaiting review" alert={stats.pendingFaqs > 0} />
              <AdminStatCard label="Approved" value={stats.approvedFaqs} sub="live" />
              <AdminStatCard label="Rejected" value={stats.rejectedFaqs} sub="removed" />
            </>
          ) : null}
        </div>
      </div>

      {/* Users + Searches */}
      <div>
        <AdminSectionLabel label="Users &amp; Search" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? skeletonCount().map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse"><div className="h-7 bg-mist rounded w-16 mb-2" /><div className="h-3 bg-mist rounded w-24" /></div>) : stats ? (
            <>
              <AdminStatCard label="Users" value={stats.totalUsers} sub={`+${stats.newUsersThisWeek ?? 0} this week`} />
              <AdminStatCard label="Searches Today" value={stats.searchesToday} sub="queries" />
              <AdminStatCard label="Total Searches" value={stats.totalSearches} sub="all time" />
              <AdminStatCard
                label="Failed Searches"
                value={searchInsights?.failedSearches ?? 0}
                sub={`${searchInsights?.failRate ?? '0%'} fail rate`}
                alert={(searchInsights?.failedSearches ?? 0) > 0}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Community */}
      <div>
        <AdminSectionLabel label="Community" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? skeletonCount().slice(0, 2).map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse"><div className="h-7 bg-mist rounded w-16 mb-2" /><div className="h-3 bg-mist rounded w-24" /></div>) : (
            <>
              <AdminStatCard label="Posts" value={communityTotal} sub="total posts" />
              <AdminStatCard label="Unanswered" value={communityUnanswered} sub="need response" alert={communityUnanswered > 0} />
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard title="FAQ Growth" subtitle="Last 14 days">
          {loading ? <div className="h-40 bg-mist rounded-lg animate-pulse" /> : <FAQGrowthChart data={growth} />}
        </AdminCard>
        <AdminCard title="User Activity" subtitle="Last 14 days">
          {loading ? <div className="h-40 bg-mist rounded-lg animate-pulse" /> : <UserActivityChart data={activity} />}
        </AdminCard>
      </div>

      {/* Top search terms */}
      {!loading && searchInsights?.topQueries && searchInsights.topQueries.length > 0 && (
        <AdminCard title="Top Search Terms">
          <div className="divide-y divide-border/50">
            {searchInsights.topQueries.slice(0, 8).map((q, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-ink-faint w-4 text-right">{i + 1}</span>
                  <span className="text-sm text-ink">{q.term}</span>
                </div>
                <span className="text-xs text-ink-soft tabular-nums">{q.count?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Platform info */}
      {!loading && stats && (
        <AdminCard title="Platform">
          <div className="divide-y divide-border/50">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink-soft">Top Category</span>
              <span className="text-sm font-medium text-ink">{stats.topCategory}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink-soft">Resolution Rate</span>
              <span className="text-sm font-medium text-ink">
                {stats.totalFaqs > 0 ? Math.round((stats.approvedFaqs / stats.totalFaqs) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-ink-soft">FAQ Trend</span>
              <span className={`text-sm font-medium ${(stats.trends?.faqs ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                {(stats.trends?.faqs ?? 0) >= 0 ? '+' : ''}{stats.trends?.faqs ?? 0}% vs last week
              </span>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}