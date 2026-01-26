import React from 'react';
import { ReviewsManagement } from '@/components/admin/ReviewsManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminReviews: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <ReviewsManagement />
    </div>
  );
};

export default AdminReviews;
