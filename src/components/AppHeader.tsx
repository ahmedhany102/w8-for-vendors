
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { LogOut, Shield, Moon, Sun, Store } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const AppHeader = () => {
  const { user, logout, isAdmin, isVendor } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, direction } = useLanguageSafe();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if currently on an admin or vendor page
  const isAdminPage = location.pathname.includes('/admin');
  const isVendorPage = location.pathname.includes('/vendor');

  // Super admins and admins should not see vendor UI
  const isSuperAdminOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  const handleAdminLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج من لوحة الإدارة');
    navigate('/admin-login');
  };

  // Determine user role badge
  const getRoleBadge = () => {
    if (!user) return null;
    if (user.role === 'SUPER_ADMIN') return direction === 'rtl' ? "(مدير عام)" : "(CEO)";
    if (user.role === 'ADMIN') return direction === 'rtl' ? "(مدير)" : "(Admin)";
    if (user.role === 'VENDOR') return direction === 'rtl' ? "(بائع)" : "(Vendor)";
    return null;
  };

  // Get display name based on role - NOT email
  const getUserDisplayName = (): string => {
    if (!user) return direction === 'rtl' ? 'ضيف' : 'Guest';
    
    const role = user.role;
    
    // Admin/Super Admin
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return direction === 'rtl' ? 'المدير' : 'Admin';
    }
    
    // Vendor
    if (role === 'VENDOR') {
      return direction === 'rtl' ? 'التاجر' : 'Vendor';
    }
    
    // Regular user - short name
    const firstName = user.user_metadata?.first_name || user.user_metadata?.name;
    if (firstName && firstName.length < 15) {
      return firstName;
    }
    
    // Fallback to short email prefix
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.length > 10 ? prefix.substring(0, 10) : prefix;
    }
    
    return direction === 'rtl' ? 'مستخدم' : 'User';
  };

  return (
    <header className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b border-border shadow-sm">
      <div className="container px-3 md:px-4 py-2 md:py-3 mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2 md:gap-4">
            {isAdminPage ? (
              <Link to="/admin" className="text-lg md:text-xl font-bold text-foreground flex items-center flex-shrink-0">
                <Shield className="ml-2 h-4 w-4 md:h-5 md:w-5" /> <span className="hidden xs:inline">لوحة الإدارة</span>
              </Link>
            ) : isVendorPage ? (
              <Link to="/vendor" className="text-lg md:text-xl font-bold text-foreground flex items-center flex-shrink-0">
                <Store className="ml-2 h-4 w-4 md:h-5 md:w-5" /> <span className="hidden xs:inline">لوحة البائع</span>
              </Link>
            ) : (
              <Link to="/" className="flex items-center flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Sarraly Logo"
                  className="h-8 md:h-10 lg:h-14 w-auto object-contain"
                />
              </Link>
            )}
            <div className="flex items-center gap-1 md:gap-2">
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

              {/* Language Switcher */}
              <LanguageSwitcher variant="ghost" size="sm" />

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground hidden md:block">
                    {getUserDisplayName()} {getRoleBadge()}
                  </div>

                  {/* Show admin dashboard link for admins */}
                  {isSuperAdminOrAdmin && !isAdminPage && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden md:inline text-xs">الإدارة</span>
                      </Button>
                    </Link>
                  )}

                  {/* Show vendor dashboard link for vendors (NOT for admins) */}
                  {isVendor && !isSuperAdminOrAdmin && !isAdminPage && !isVendorPage && (
                    <Link to="/vendor">
                      <Button variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3 flex items-center gap-1">
                        <Store className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden md:inline text-xs">متجري</span>
                      </Button>
                    </Link>
                  )}

                  {/* Show become vendor link for regular users only (NOT for admins or existing vendors) */}
                  {!isVendor && !isSuperAdminOrAdmin && !isAdminPage && !isVendorPage && (
                    <Link to="/become-vendor">
                      <Button variant="ghost" size="sm" className="h-8 md:h-9 px-2 md:px-3 flex items-center gap-1 text-primary hover:text-primary/80">
                        <Store className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden md:inline text-xs">{t?.nav?.becomeVendor || 'ابدأ البيع'}</span>
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAdminPage ? handleAdminLogout : handleLogout}
                    className="h-8 md:h-9 px-2 md:px-3 flex items-center gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="hidden md:inline text-xs">{t?.nav?.logout || 'خروج'}</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 md:gap-2">
                  {/* Welcome message - Hidden on mobile */}
                  <div className="hidden lg:block text-sm text-muted-foreground">
                    {t?.hero?.welcome || 'أهلاً بك'}، {t?.common?.guest || 'زائر'}
                  </div>
                  {/* Sell With Us CTA - Compact on mobile */}
                  <Link to="/become-vendor" className="hidden sm:block">
                    <Button variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3 flex items-center gap-1 text-primary border-primary hover:bg-primary/10">
                      <Store className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="text-xs hidden md:inline">{t?.nav?.becomeVendor || 'ابدأ البيع'}</span>
                      <span className="text-xs md:hidden">{direction === 'rtl' ? 'بيع' : 'Sell'}</span>
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="default" size="sm" className="h-8 md:h-9 px-3 md:px-4 text-xs">
                      {t?.nav?.login || 'دخول'}
                    </Button>
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
