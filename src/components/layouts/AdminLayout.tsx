import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { direction } = useLanguageSafe();
  const navigate = useNavigate();

  // Check if user exists and is admin (ADMIN or SUPER_ADMIN)
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/admin-login" />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with mobile menu */}
          <AdminHeader
            showMenuButton={true}
            sidebarContent={<AdminSidebar onNavigate={() => {}} />}
            onLogout={handleLogout}
          />

          {/* Page Content - Renders nested route */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-4 px-4 md:px-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
