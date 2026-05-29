import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// User pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import FAQPage from './pages/FAQPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import Spinner from './components/ui/Spinner';
// Admin pages
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminFAQs from './admin/pages/AdminFAQs';
import AdminAnalytics from './admin/pages/AdminAnalytics';
import AdminUsers from './admin/pages/AdminUsers';
import AdminSearch from './admin/pages/AdminSearch';
import AdminReports from './admin/pages/AdminReports';
import AdminSettings from './admin/pages/AdminSettings';
import AdminLayout from './admin/components/layout/AdminLayout';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Helper component to lock down specific routes
function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  // Show a minimal loading spinner while the app verifies the token in the background
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  // If authenticated, render the requested page; otherwise, kick them back to login
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

interface AdminRouteProps {
  children: React.ReactNode;
}

function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return isAuthenticated && (user?.role === 'admin' || user?.role === 'moderator')
    ? children
    : <Navigate to="/" replace />;
}

// Component defining all available URLs in the app
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Prevent route flashing by waiting for the initial auth check to finish
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes: Redirect to home if the user is already logged in */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Private Routes: Wrapped in ProtectedRoute to enforce authentication */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/faq" element={<ProtectedRoute><FAQPage /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/admin/old" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* Admin Panel dedicated routes (guarded by AdminRoute) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
      <Route path="/admin/faqs" element={<AdminRoute><AdminLayout><AdminFAQs /></AdminLayout></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminLayout><AdminAnalytics /></AdminLayout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>} />
      <Route path="/admin/search" element={<AdminRoute><AdminLayout><AdminSearch /></AdminLayout></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminLayout><AdminReports /></AdminLayout></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminLayout><AdminSettings /></AdminLayout></AdminRoute>} />

      {/* Catch-all fallback: Redirect any unknown URLs to the home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// The absolute root of the React tree
export default function App() {
  return (
    // 1. BrowserRouter enables URL navigation
    <BrowserRouter>
      {/* 2. AuthProvider injects global user state into all child components */}
      <AuthProvider>
        {/* 4. AppRoutes actually renders the correct page based on the URL */}
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}