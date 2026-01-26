import React from 'react';
import ProductManagement from '@/components/admin/ProductManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminProducts: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <ProductManagement />
    </div>
  );
};

export default AdminProducts;
