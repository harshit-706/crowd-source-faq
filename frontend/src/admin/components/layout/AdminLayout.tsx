import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#030307' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #030307 0%, #060612 50%, #030307 100%)' }}>
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <AdminNavbar onMobileMenuToggle={() => setMobileOpen(v => !v)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}