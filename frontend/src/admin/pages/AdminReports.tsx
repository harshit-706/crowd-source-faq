import React, { useState } from 'react';
import { motion } from 'framer-motion';
import adminApi from '../utils/adminApi';

interface StatusBreakdown {
  _id: string;
  count: number;
}

interface CategoryBreakdown {
  _id: string;
  count: number;
}

interface ReportSummary {
  totalFaqs: number;
  totalSearches: number;
  statusBreakdown?: StatusBreakdown[];
  categoryBreakdown?: CategoryBreakdown[];
}

interface Report {
  faqs: Record<string, unknown>[];
  searchLogs: Record<string, unknown>[];
  summary: ReportSummary;
}

interface ReportFormat {
  label: string;
  action: () => void;
}

interface ReportCard {
  title: string;
  desc: string;
  formats: ReportFormat[];
  icon: string;
  color: string;
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data?.length) return;
  const keys = Object.keys(data[0]).filter(k => k !== 'embedding' && k !== '__v');
  const csv = [keys.join(','), ...data.map(row =>
    keys.map(k => {
      const v = row[k];
      const s = v == null ? '' : String(v).replace(/\n/g, ' ');
      return s.includes(',') ? `"${s}"` : s;
    }).join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function AdminReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [fetched, setFetched] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const r = await adminApi.get<Report>(`/admin/reports?${params}`);
      setReport(r.data);
      setSummary(r.data.summary);
      setFetched(true);
    } catch {
      // error ignored
    } finally { setLoading(false); }
  };

  const cardStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' };
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.75)', fontSize: '13px',
    colorScheme: 'dark',
  };

  const reportCards: ReportCard[] = [
    {
      title: 'FAQ Export',
      desc: 'Download all FAQs with questions, answers, categories and metadata.',
      formats: [
        { label: 'CSV', action: () => report && downloadCSV(report.faqs, `faqs-${Date.now()}.csv`) },
        { label: 'JSON', action: () => report && downloadJSON(report.faqs, `faqs-${Date.now()}.json`) },
      ],
      icon: '📄',
      color: '#8b5cf6',
    },
    {
      title: 'Search Logs',
      desc: 'Export all user search queries with result counts and timestamps.',
      formats: [
        { label: 'CSV', action: () => report && downloadCSV(report.searchLogs, `search-logs-${Date.now()}.csv`) },
        { label: 'JSON', action: () => report && downloadJSON(report.searchLogs, `search-logs-${Date.now()}.json`) },
      ],
      icon: '🔍',
      color: '#22d3ee',
    },
    {
      title: 'Full Report',
      desc: 'Complete analytics export including FAQs, search logs, and summary stats.',
      formats: [
        { label: 'JSON', action: () => report && downloadJSON(report, `full-report-${Date.now()}.json`) },
      ],
      icon: '📊',
      color: '#10b981',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-lg font-bold text-white/90">Reports</h2>
        <p className="text-xs text-white/30 mt-0.5">Export data and generate analytics reports</p>
      </div>

      {/* Date range */}
      <div className="rounded-xl border p-5" style={cardStyle}>
        <p className="text-sm font-semibold text-white/70 mb-4">Date Range Filter</p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-white/30 mb-1.5">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs text-white/30 mb-1.5">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle} />
          </div>
          <button
            onClick={fetchReport} disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 0 16px rgba(139,92,246,0.25)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading…
              </span>
            ) : 'Generate Report'}
          </button>
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); setFetched(false); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-2">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {fetched && summary && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border p-4" style={cardStyle}>
            <p className="text-2xl font-bold text-white tabular-nums">{summary.totalFaqs}</p>
            <p className="text-xs text-white/40 mt-1">FAQs in Range</p>
          </div>
          <div className="rounded-xl border p-4" style={cardStyle}>
            <p className="text-2xl font-bold text-white tabular-nums">{summary.totalSearches}</p>
            <p className="text-xs text-white/40 mt-1">Searches in Range</p>
          </div>
          {summary.statusBreakdown?.map(s => (
            <div key={s._id} className="rounded-xl border p-4" style={cardStyle}>
              <p className="text-2xl font-bold text-white tabular-nums">{s.count}</p>
              <p className="text-xs text-white/40 mt-1 capitalize">{s._id} FAQs</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Category breakdown */}
      {fetched && summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-5" style={cardStyle}>
          <p className="text-sm font-semibold text-white/70 mb-4">Category Breakdown</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {summary.categoryBreakdown.map((c, i) => {
              const max = summary.categoryBreakdown[0]?.count || 1;
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60 truncate">{c._id}</p>
                    <div className="w-full h-1 rounded-full mt-1 bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)' }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-violet-400 tabular-nums">{c.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Download cards */}
      <div>
        <p className="text-sm font-semibold text-white/60 mb-3">Export Options</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {reportCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl border p-5 flex flex-col gap-4"
              style={{ ...cardStyle, borderColor: `${card.color}22` }}
            >
              <div className="text-2xl">{card.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white/80">{card.title}</p>
                <p className="text-xs text-white/30 mt-1">{card.desc}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                {card.formats.map(f => (
                  <button
                    key={f.label}
                    onClick={f.action}
                    disabled={!fetched}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-30 hover:opacity-90"
                    style={{ color: card.color, borderColor: `${card.color}30`, background: `${card.color}10` }}
                  >
                    <DownloadIcon />
                    {f.label}
                  </button>
                ))}
              </div>
              {!fetched && <p className="text-[10px] text-white/20">Generate report first to enable download</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
