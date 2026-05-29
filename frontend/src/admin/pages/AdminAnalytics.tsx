import React, { useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import adminApi from '../utils/adminApi';
import FAQGrowthChart from '../components/charts/FAQGrowthChart';
import UserActivityChart from '../components/charts/UserActivityChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import SearchBarChart from '../components/charts/SearchBarChart';
import ResolutionChart from '../components/charts/ResolutionChart';
import { ChartSkeleton, StatsCardSkeleton } from '../components/common/SkeletonLoader';

// ── Data shapes ──────────────────────────────────────────────────────────────

interface SearchTermData {
  term?: string;
  count?: number;
}

interface SearchInsights {
  topQueries?: SearchTermData[];
  failedSearches?: number;
  failRate?: string;
}

interface StatsResponse {
  totalFaqs: number;
  trends?: { faqs: number };
  totalSearches?: number;
  approvedFaqs: number;
  pendingFaqs: number;
  rejectedFaqs: number;
  totalUsers: number;
  newUsersThisWeek?: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MetricTileProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function MetricTile({ label, value, sub, color = '#8b5cf6' }: MetricTileProps) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-2xl font-bold text-white tabular-nums mb-1">{value}</p>
      <p className="text-xs font-medium text-white/50">{label}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border p-5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-sm font-semibold text-white/80 mb-0.5">{title}</p>
      {subtitle && <p className="text-xs text-white/30 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [growth, setGrowth] = useState<{ date?: string; count?: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [searchInsights, setSearchInsights] = useState<SearchInsights | null>(null);
  const [activityData, setActivityData] = useState<{ date?: string; searches?: number; users?: number }[]>([]);
  const [range, setRange] = useState<string>('30');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.get<StatsResponse>('/admin/stats'),
      adminApi.get<{ date?: string; count?: number }[]>(`/admin/faq-growth?days=${range}`),
      adminApi.get<{ name: string; count: number }[]>('/admin/top-categories'),
      adminApi.get<SearchInsights>('/admin/search-insights'),
      adminApi.get<{ date?: string; searches?: number; users?: number }[]>(`/admin/user-activity-chart?days=${Math.min(parseInt(range), 30)}`),
    ]).then(([s, g, c, si, a]: [AxiosResponse<StatsResponse>, AxiosResponse<{ date?: string; count?: number }[]>, AxiosResponse<{ name: string; count: number }[]>, AxiosResponse<SearchInsights>, AxiosResponse<{ date?: string; searches?: number; users?: number }[]>]) => {
      setStats(s.data);
      setGrowth(g.data);
      setCategories(c.data);
      setSearchInsights(si.data);
      setActivityData(a.data);
    }).catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load analytics';
        console.error(msg, err);
      }).finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white/90">Analytics</h2>
          <p className="text-xs text-white/30 mt-0.5">Deep-dive into your platform performance</p>
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['7', '14', '30', '90'] as const).map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${range === d ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
              style={range === d ? { background: 'rgba(139,92,246,0.3)' } : {}}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading || !stats ? Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />) : (
          <>
            <MetricTile label="Total FAQs" value={stats.totalFaqs.toLocaleString()} sub={`+${stats.trends?.faqs || 0}% vs prev period`} />
            <MetricTile label="Total Searches" value={stats.totalSearches?.toLocaleString() ?? '—'} sub="All-time search volume" color="#22d3ee" />
            <MetricTile label="Resolution Rate"
              value={`${Math.round((stats.approvedFaqs / (stats.totalFaqs || 1)) * 100)}%`}
              sub="Approved / Total" color="#10b981" />
            <MetricTile label="Users" value={stats.totalUsers.toLocaleString()} sub={`+${stats.newUsersThisWeek || 0} this week`} color="#3b82f6" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="FAQ Growth" subtitle={`FAQs added over the last ${range} days`}>
          {loading ? <ChartSkeleton height={210} /> : <FAQGrowthChart data={growth} />}
        </ChartCard>
        <ChartCard title="User & Search Activity" subtitle={`Daily activity over the last ${Math.min(parseInt(range), 30)} days`}>
          {loading ? <ChartSkeleton height={210} /> : <UserActivityChart data={activityData} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="FAQ Resolution" subtitle="Approved vs pending vs rejected">
          {loading || !stats
            ? <ChartSkeleton height={210} />
            : <ResolutionChart approved={stats.approvedFaqs} pending={stats.pendingFaqs} rejected={stats.rejectedFaqs} />}
        </ChartCard>
        <ChartCard title="Top Categories" subtitle="FAQ distribution by category">
          {loading ? <ChartSkeleton height={210} /> : <CategoryPieChart data={categories} />}
        </ChartCard>
        <ChartCard title="Search Keywords" subtitle="Top searched terms">
          {loading ? <ChartSkeleton height={210} /> : <SearchBarChart data={searchInsights?.topQueries || []} />}
        </ChartCard>
      </div>

      {/* Failed searches */}
      {searchInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border p-5" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.12)' }}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Failed Searches</p>
            <p className="text-3xl font-bold text-white">{searchInsights.failedSearches}</p>
            <p className="text-xs text-red-400 mt-1">{searchInsights.failRate}% failure rate</p>
            <p className="text-xs text-white/25 mt-2">Searches that returned no results</p>
          </div>
          <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Top Search Terms</p>
            <div className="grid grid-cols-2 gap-2">
              {searchInsights.topQueries?.slice(0, 8).map((q, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-xs text-white/60 truncate mr-2">{q.term}</span>
                  <span className="text-xs font-medium text-violet-400 shrink-0">{q.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}