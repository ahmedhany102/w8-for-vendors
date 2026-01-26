import React from 'react';
import AdManagement from '@/components/admin/AdManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminAds: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <AdManagement />
    </div>
  );
};

export default AdminAds;
