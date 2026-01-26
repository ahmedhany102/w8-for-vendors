import React from 'react';
import AdminOrdersManagement from '@/components/admin/AdminOrdersManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminVendorOrders: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <AdminOrdersManagement />
    </div>
  );
};

export default AdminVendorOrders;
