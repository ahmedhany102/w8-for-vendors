import React from 'react';
import CategoryManagement from '@/components/admin/CategoryManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminCategories: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <CategoryManagement />
    </div>
  );
};

export default AdminCategories;
