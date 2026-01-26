import React from 'react';
import AdminContactSettings from '@/components/admin/AdminContactSettings';
import AdminQuickNav from '@/components/admin/AdminQuickNav';

const AdminContact: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminQuickNav />
      <AdminContactSettings />
    </div>
  );
};

export default AdminContact;
