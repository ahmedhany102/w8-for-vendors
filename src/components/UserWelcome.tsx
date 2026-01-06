
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UserWelcome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;
  
  // Extract just the name part before @ if it's an email
  // Adding a safety check to prevent the "includes" error
  const displayName = user.name && user.name.includes('@') ? user.name.split('@')[0] : user.name || 'User';
  
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium">Welcome, {displayName}</p>
        <div className="flex gap-2 mt-1">
          <Button 
            variant="link" 
            size="sm"
            className="h-auto p-0 text-xs underline-offset-4"
            onClick={() => navigate('/profile')}
          >
            Profile
          </Button>
          <Button 
            variant="link" 
            size="sm"
            className="h-auto p-0 text-xs underline-offset-4"
            onClick={() => logout()}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserWelcome;
