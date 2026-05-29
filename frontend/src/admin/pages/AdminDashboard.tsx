import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AxiosResponse } from 'axios';
import adminApi from '../utils/adminApi';
import StatsCard from '../components/cards/StatsCard';
import FAQGrowthChart from '../components/charts/FAQGrowthChart';
import UserActivityChart from '../components/charts/UserActivityChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import SearchBarChart from '../components/charts/SearchBarChart';
import ResolutionChart from '../components/charts/ResolutionChart';
import { StatsCardSkeleton, ChartSkeleton } from '../components/common/SkeletonLoader';

// ─── Data Shapes ────────────────────────────────────────────────────────────────

interface StatsData {
  totalFaqs: number;
  pendingFaqs: number;
  approvedFaqs: number;
  totalUsers: number;
  searchesToday: number;
  topCategory: string;
  unanswered: number;
  rejectedFaqs: number;
  totalSearches: number;
  newUsersThisWeek: number;
  trends?: { faqs?: number };
}

interface FAQGrowthData {
  date?: string;
  count?: number;
}

interface UserActivityData {
  date?: string;
  searches?: number;
  users?: number;
}

interface TopCategoriesResponse {
  name: string;
  count: number;
}

interface SearchInsightsResponse {
  topQueries: SearchTermData[];
}

interface SearchTermData {
  term?: string;
  count?: number;
}

// ─── Icon Helpers ───────────────────────────────────────────────────────────────

type IconComponent = (props: { size: number }) => React.JSX.Element;

const I = (d: string): IconComponent => () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const Icons: Record<string, IconComponent> = {
  doc:    I("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8"),
  clock:  I("M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2"),
  check:  I("M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3"),
  users:  I("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75"),
  search: I("M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z"),
  star:   I("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"),
  alert:  I("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01"),
  flash:  I("M13 2L3 14h9l-1 8 10-12h-9l1-8z"),
};

// ─── ChartCard ─────────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}

function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
    >
      <div className="mb-4">
        <p className="text-sm font-semibold text-white/80">{title}</p>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [growth, setGrowth] = useState<FAQGrowthData[]>([]);
  const [categories, setCategories] = useState<TopCategoriesResponse[]>([]);
  const [searchData, setSearchData] = useState<SearchTermData[]>([]);
  const [activityData, setActivityData] = useState<UserActivityData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);

  useEffect(() => {
    adminApi.get<StatsData>('/admin/stats')
      .then((res: AxiosResponse<StatsData>) => setStats(res.data))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load stats';
        console.error(msg, err);
      })
      .finally(() => setLoadingStats(false));

    Promise.all([
      adminApi.get<FAQGrowthData[]>('/admin/faq-growth?days=21'),
      adminApi.get<TopCategoriesResponse[]>('/admin/top-categories'),
      adminApi.get<SearchInsightsResponse>('/admin/search-insights'),
      adminApi.get<UserActivityData[]>('/admin/user-activity-chart?days=14'),
    ]).then(([g, c, s, a]) => {
      setGrowth(g.data);
      setCategories(c.data);
      setSearchData(s.data.topQueries ?? []);
      setActivityData(a.data);
    }).catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load stats';
        console.error(msg, err);
      }).finally(() => setLoadingCharts(false));
  }, []);

  const cardDefs = stats ? [
    { label: 'Total FAQs',     value: stats.totalFaqs,           icon: Icons.doc,    theme: 'purple' as const, trend: stats.trends?.faqs, trendLabel: 'vs last week' },
    { label: 'Pending Review', value: stats.pendingFaqs,           icon: Icons.clock,  theme: 'amber' as const,                      trendLabel: 'awaiting approval' },
    { label: 'Approved FAQs',  value: stats.approvedFaqs,          icon: Icons.check,  theme: 'green' as const,                      trendLabel: 'live on platform' },
    { label: 'Total Users',    value: stats.totalUsers,            icon: Icons.users,  theme: 'blue' as const,  trend: stats.newUsersThisWeek, trendLabel: `+${stats.newUsersThisWeek ?? 0} this week` },
    { label: 'Searches Today', value: stats.searchesToday,        icon: Icons.search, theme: 'cyan' as const,                      trendLabel: `${stats.totalSearches} total` },
    { label: 'Top Category',   value: stats.topCategory,         icon: Icons.star,   theme: 'purple' as const, isText: true,      trendLabel: 'most FAQ entries' },
    { label: 'Unanswered',    value: stats.unanswered,             icon: Icons.alert,  theme: 'red' as const,                        trendLabel: 'need attention' },
    { label: 'Rejected FAQs', value: stats.rejectedFaqs,           icon: Icons.flash,  theme: 'red' as const,                        trendLabel: 'removed from platform' },
  ] : [];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white/90">Overview</h2>
        <p className="text-xs text-white/30 mt-0.5">Real-time snapshot of your FAQ platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {loadingStats
          ? Array.from({ length: 8 }).map((_, i) => <StatsCardSkeleton key={i} />)
          : cardDefs.map((c, i) => (
              <StatsCard key={c.label} {...c} delay={i * 0.05} />
            ))
        }
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="FAQ Growth" subtitle="FAQs added over the last 21 days">
            {loadingCharts ? <ChartSkeleton height={200} /> : <FAQGrowthChart data={growth} />}
          </ChartCard>
        </div>
        <ChartCard title="Resolution Rate" subtitle="Approved vs pending vs rejected">
          {loadingCharts
            ? <ChartSkeleton height={200} />
            : <ResolutionChart approved={stats?.approvedFaqs} pending={stats?.pendingFaqs} rejected={stats?.rejectedFaqs} />
          }
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Search & User Activity" subtitle="Searches and active users over 14 days">
            {loadingCharts ? <ChartSkeleton height={200} /> : <UserActivityChart data={activityData} />}
          </ChartCard>
        </div>
        <ChartCard title="Top Categories" subtitle="FAQ distribution by category">
          {loadingCharts ? <ChartSkeleton height={200} /> : <CategoryPieChart data={categories} />}
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <ChartCard title="Search Keywords" subtitle="Most searched terms by users">
        {loadingCharts ? <ChartSkeleton height={200} /> : <SearchBarChart data={searchData} />}
      </ChartCard>
    </div>
  );
}
