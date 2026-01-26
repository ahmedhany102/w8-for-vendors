
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UserWelcome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Get display name based on role - NOT email
  const getDisplayName = (): string => {
    const role = user.user_metadata?.role || user.role;
    
    // Admin/Super Admin
    if (role === 'SUPER_ADMIN' || role === 'super_admin' || role === 'ADMIN' || role === 'admin') {
      return 'المدير';
    }
    
    // Vendor
    if (role === 'VENDOR' || role === 'vendor') {
      return 'التاجر';
    }
    
    // Regular user - short name
    const firstName = user.user_metadata?.first_name || user.user_metadata?.name;
    if (firstName && firstName.length < 15) {
      return firstName;
    }
    
    // Fallback
    if (user.name && !user.name.includes('@')) {
      return user.name.length > 12 ? user.name.substring(0, 12) : user.name;
    }
    
    return 'مستخدم';
  };

  const displayName = getDisplayName();

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium">مرحباً، {displayName}</p>
        <div className="flex gap-2 mt-1">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs underline-offset-4"
            onClick={() => navigate('/profile')}
          >
            الملف الشخصي
          </Button>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs underline-offset-4"
            onClick={() => logout()}
          >
            خروج
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;
