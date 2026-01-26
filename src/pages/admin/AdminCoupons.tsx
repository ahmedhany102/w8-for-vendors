import React from 'react';
import CouponManagement from '@/components/admin/CouponManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminCoupons: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <CouponManagement />
    </div>
  );
};

export default AdminCoupons;
