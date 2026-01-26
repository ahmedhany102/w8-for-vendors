import React from 'react';
import SectionsManager from '@/components/admin/SectionsManager';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminSections: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <SectionsManager />
    </div>
  );
};

export default AdminSections;
