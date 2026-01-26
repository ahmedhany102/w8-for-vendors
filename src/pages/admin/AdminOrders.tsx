import React from 'react';
import OrdersPanel from '@/components/admin/OrdersPanel';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminOrders: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <OrdersPanel />
    </div>
  );
};

export default AdminOrders;
