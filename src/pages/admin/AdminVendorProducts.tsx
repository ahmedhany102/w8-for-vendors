import React from 'react';
import AdminProductsManagement from '@/components/admin/AdminProductsManagement';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminVendorProducts: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <AdminProductsManagement />
    </div>
  );
};

export default AdminVendorProducts;
