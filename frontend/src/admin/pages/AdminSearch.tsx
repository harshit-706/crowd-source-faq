import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import adminApi from '../utils/adminApi';
import SearchBarChart from '../components/charts/SearchBarChart';
import { ChartSkeleton } from '../components/common/SkeletonLoader';

interface SearchTermData {
  term: string;
  count: number;
}

interface RecentActivityData {
  _id?: string;
  count: number;
  noResults?: number;
}

interface SearchInsightsData {
  totalSearches?: number;
  failedSearches?: number;
  failRate?: string;
  topQueries?: SearchTermData[];
  recentActivity?: RecentActivityData[];
}

interface HeatTileProps {
  term: string;
  count: number;
  max: number;
}

function HeatTile({ term, count, max }: HeatTileProps) {
  const intensity = max > 0 ? count / max : 0;
  const bg = `rgba(139,92,246,${0.08 + intensity * 0.35})`;
  const border = `rgba(139,92,246,${0.1 + intensity * 0.4})`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04 }}
      className="rounded-xl border px-3 py-2.5 cursor-default transition-all"
      style={{ background: bg, borderColor: border }}
    >
      <p className="text-xs font-medium text-white/70 truncate mb-1">{term}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${intensity * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }}
          />
        </div>
        <span className="text-[10px] text-violet-400 font-medium tabular-nums shrink-0">{count}</span>
      </div>
    </motion.div>
  );
}

export default function AdminSearch() {
  const [data, setData] = useState<SearchInsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/admin/search-insights')
      .then((r) => setData(r.data))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load search insights';
        console.error(msg, err);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxCount = data?.topQueries?.[0]?.count || 1;
  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-lg font-bold text-white/90">Search Insights</h2>
        <p className="text-xs text-white/30 mt-0.5">What users are looking for on your platform</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 h-20 animate-pulse" style={cardStyle} />
          ))
        ) : (
          <>
            <div className="rounded-xl border p-4" style={cardStyle}>
              <p className="text-2xl font-bold text-white tabular-nums">
                {data?.totalSearches?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-white/40 mt-1">Total Searches</p>
            </div>
            <div className="rounded-xl border p-4" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.12)' }}>
              <p className="text-2xl font-bold text-white tabular-nums">{data?.failedSearches || 0}</p>
              <p className="text-xs text-white/40 mt-1">Failed Searches</p>
              <p className="text-[10px] text-red-400 mt-0.5">{data?.failRate}% failure rate</p>
            </div>
            <div className="rounded-xl border p-4" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.12)' }}>
              <p className="text-2xl font-bold text-white tabular-nums">
                {Math.max(0, (data?.totalSearches || 0) - (data?.failedSearches || 0)).toLocaleString()}
              </p>
              <p className="text-xs text-white/40 mt-1">Successful Searches</p>
            </div>
            <div className="rounded-xl border p-4" style={cardStyle}>
              <p className="text-2xl font-bold text-white tabular-nums">{data?.topQueries?.length || 0}</p>
              <p className="text-xs text-white/40 mt-1">Unique Terms</p>
            </div>
          </>
        )}
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border p-5" style={cardStyle}>
        <p className="text-sm font-semibold text-white/80 mb-0.5">Search Volume by Keyword</p>
        <p className="text-xs text-white/30 mb-4">Top 8 most searched terms</p>
        {loading ? (
          <ChartSkeleton height={200} />
        ) : (
          <SearchBarChart data={data?.topQueries || []} />
        )}
      </div>

      {/* Heatmap grid */}
      <div>
        <p className="text-sm font-semibold text-white/70 mb-3">Search Keyword Heatmap</p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl h-14 animate-pulse"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {data?.topQueries?.slice(0, 16).map((q, i) => (
              <HeatTile key={i} term={q.term} count={q.count} max={maxCount} />
            ))}
          </div>
        )}
      </div>

      {/* Recent search activity */}
      {!loading && data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-sm font-semibold text-white/80 mb-4">Daily Search Activity (Last 7 Days)</p>
          <div className="space-y-2">
            {data.recentActivity.map((d, i) => {
              const maxSearches = Math.max(...data.recentActivity!.map((x) => x.count), 1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-20 shrink-0">{d._id?.slice(5)}</span>
                  <div
                    className="flex-1 h-5 rounded-md overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxSearches) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="h-full rounded-md"
                      style={{ background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }}
                    />
                  </div>
                  <span className="text-xs text-white/50 tabular-nums w-12 text-right">{d.count}</span>
                  {d.noResults && d.noResults > 0 && (
                    <span className="text-[10px] text-red-400 tabular-nums w-16">{d.noResults} failed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
