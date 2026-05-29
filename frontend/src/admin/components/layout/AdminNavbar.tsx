import React, { useState, useEffect, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import adminApi from '../../utils/adminApi';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/faqs': 'FAQ Management',
  '/admin/analytics': 'Analytics',
  '/admin/users': 'User Activity',
  '/admin/search': 'Search Insights',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

interface Notification {
  id: number;
  type: 'pending' | 'user' | 'search' | 'system';
  msg: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: Notification[] = [
  { id: 1, type: 'pending', msg: '3 FAQs awaiting approval', time: '2m ago', read: false },
  { id: 2, type: 'user', msg: 'New user registered: priya@iitm.ac.in', time: '15m ago', read: false },
  { id: 3, type: 'search', msg: 'Search spike: "assignment submission"', time: '1h ago', read: true },
  { id: 4, type: 'system', msg: 'Database backup completed', time: '3h ago', read: true },
];

interface AdminNavbarProps {
  onMobileMenuToggle: () => void;
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

const notifColor: Record<Notification['type'], string> = { pending: '#f59e0b', user: '#8b5cf6', search: '#22d3ee', system: '#10b981' };

export default function AdminNavbar({ onMobileMenuToggle }: AdminNavbarProps) {
  const location = useLocation();
  const { user } = useAdminAuth();
  const [time, setTime] = useState<Date>(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/admin') {
      adminApi.get('/admin/stats')
        .then(r => setPendingCount((r.data as { pendingFaqs?: number }).pendingFaqs || 0))
        .catch(() => {});
    }
  }, [location.pathname]);

  const unread = notifs.filter(n => !n.read).length + (pendingCount > 0 ? 1 : 0);
  const title = PAGE_TITLES[location.pathname] || 'Admin';

  const markAllRead = () => setNotifs(ns => ns.map(x => ({ ...x, read: true })));

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 border-b"
      style={{ background: 'rgba(3,3,7,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-3">
        <button className="lg:hidden text-white/40 hover:text-white/80 transition-colors" onClick={onMobileMenuToggle}>
          <MenuIcon />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-white/90">{title}</h1>
          <p className="text-[10px] text-white/25 hidden sm:block">
            {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' · '}
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-all"
          >
            <BellIcon />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-violet-500" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-80 rounded-xl border z-20 overflow-hidden"
                  style={{ background: 'rgba(10,10,22,0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white/80">Notifications</p>
                    <button onClick={markAllRead} className="text-[11px] text-violet-400 hover:text-violet-300">Mark all read</button>
                  </div>
                  {pendingCount > 0 && (
                    <div className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] bg-amber-500/[0.05]">
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-amber-400" />
                      <div>
                        <p className="text-xs text-white/70">{pendingCount} FAQ{pendingCount > 1 ? 's' : ''} awaiting approval</p>
                        <p className="text-[10px] text-white/25 mt-0.5">just now</p>
                      </div>
                    </div>
                  )}
                  {notifs.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] ${!n.read ? 'bg-white/[0.02]' : ''}`}>
                      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: notifColor[n.type] }} />
                      <div>
                        <p className="text-xs text-white/70">{n.msg}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ml-1"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
          {user?.name?.[0]?.toUpperCase() || 'A'}
        </div>
      </div>
    </header>
  );
}