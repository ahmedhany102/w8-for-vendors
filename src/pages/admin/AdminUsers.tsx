import React from 'react';
import UsersPanel from '@/components/admin/UsersPanel';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminUsers: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <UsersPanel />
    </div>
  );
};

export default AdminUsers;
