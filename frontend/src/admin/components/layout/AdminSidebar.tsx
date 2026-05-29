import React, { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminAuth } from '../../hooks/useAdminAuth';

interface NavItem {
  to: string;
  label: string;
  icon: () => ReactNode;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/admin/faqs', label: 'FAQs', icon: DocIcon },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartIcon },
  { to: '/admin/users', label: 'User Activity', icon: UsersIcon },
  { to: '/admin/search', label: 'Search Insights', icon: SearchIcon },
  { to: '/admin/reports', label: 'Reports', icon: ReportIcon },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

function GridIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function DocIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function ChartIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function UsersIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function SearchIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function ReportIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function SettingsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 1.41 14.14M4.93 4.93a10 10 0 0 0 0 14.14M4.93 19.07A10 10 0 0 0 12 22M19.07 19.07A10 10 0 0 1 12 22"/></svg>; }
function LogoutIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

const sidebarVariants = {
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  closed: { x: -280, opacity: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onMobileClose }: { onMobileClose: () => void }) {
  const { logout, user } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">Yaksha</p>
            <p className="text-[10px] text-white/30 tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative group ${
                isActive
                  ? 'text-violet-300 bg-violet-500/[0.12]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-violet-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className={`transition-colors ${isActive ? 'text-violet-400' : 'text-white/30 group-hover:text-white/60'}`}>
                  {item.icon()}
                </span>
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-white/[0.05] pt-4 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/70 truncate">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150"
        >
          <LogoutIcon />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 fixed left-0 top-0 h-full z-40 border-r"
        style={{ background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <SidebarContent onMobileClose={onMobileClose} />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              variants={sidebarVariants}
              initial="closed" animate="open" exit="closed"
              className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col lg:hidden border-r"
              style={{ background: 'rgba(5,5,15,0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <SidebarContent onMobileClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}