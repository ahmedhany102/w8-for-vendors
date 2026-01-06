
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from './ui/button';
import { LogOut, Shield, Moon, Sun, Store } from 'lucide-react';
import { toast } from 'sonner';

const AppHeader = () => {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if currently on an admin or vendor page
  const isAdminPage = location.pathname.includes('/admin');
  const isVendorPage = location.pathname.includes('/vendor');
  
  // Super admins and admins should not see vendor UI
  const isSuperAdminOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleAdminLogout = () => {
    logout();
    toast.success('Logged out from admin panel');
    navigate('/admin-login');
  };

  // Determine user role badge
  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'SUPER_ADMIN') return "(Super Admin)";
    if (user.role === 'ADMIN') return "(Admin)";
    if (user.role === 'VENDOR') return "(Vendor)";
    return null;
  };

  return (
    <header className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b border-border shadow-sm">
      <div className="container px-4 py-2 mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            {isAdminPage ? (
              <Link to="/admin" className="text-xl font-bold text-foreground flex items-center">
                <Shield className="mr-2" /> Admin Panel
              </Link>
            ) : isVendorPage ? (
              <Link to="/vendor" className="text-xl font-bold text-foreground flex items-center">
                <Store className="mr-2" /> Vendor Panel
              </Link>
            ) : (
              <Link to="/" className="text-xl font-bold text-foreground">
                W8
              </Link>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {user.name} {getRoleBadge()}
                  </div>
                  
                  {/* Show admin dashboard link for admins */}
                  {isSuperAdminOrAdmin && !isAdminPage && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Admin</span>
                      </Button>
                    </Link>
                  )}
                  
                  {/* Show vendor dashboard link for vendors (NOT for admins) */}
                  {isVendor && !isSuperAdminOrAdmin && !isAdminPage && !isVendorPage && (
                    <Link to="/vendor">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Store className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Vendor</span>
                      </Button>
                    </Link>
                  )}

                  {/* Show become vendor link for regular users only (NOT for admins or existing vendors) */}
                  {!isVendor && !isSuperAdminOrAdmin && !isAdminPage && !isVendorPage && (
                    <Link to="/become-vendor">
                      <Button variant="ghost" size="sm" className="flex items-center gap-1 text-primary hover:text-primary/80">
                        <Store className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline text-xs">Sell with us</span>
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={isAdminPage ? handleAdminLogout : handleLogout}
                    className="flex items-center gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-xs">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground mr-2">
                    Welcome, Guest
                  </div>
                  <Link to="/login" className="text-sm text-foreground hover:text-primary mr-2">
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
