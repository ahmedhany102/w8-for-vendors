import React from 'react';
import RevenueAnalytics from '@/components/admin/RevenueAnalytics';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminAnalytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <RevenueAnalytics />
    </div>
  );
};

export default AdminAnalytics;
