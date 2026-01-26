import React from 'react';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  sidebarContent?: React.ReactNode;
  onLogout?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  onMenuClick, 
  showMenuButton = true,
  sidebarContent,
  onLogout
}) => {
  const { user } = useAuth();
  const { t, direction, language } = useLanguageSafe();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  // Get user role display - COMPACT VERSION
  const getRoleDisplay = () => {
    if (user?.role === 'SUPER_ADMIN') {
      return language === 'ar' ? 'المدير' : 'CEO';
    }
    if (user?.role === 'ADMIN') {
      return language === 'ar' ? 'مدير' : 'Admin';
    }
    return language === 'ar' ? 'مستخدم' : 'User';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    if (user?.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header 
      className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      dir={direction}
    >
      <div className="flex items-center justify-between h-14 md:h-16 px-3 md:px-6 gap-2">
        
        {/* Left Side: Menu Button + Title */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Mobile Menu Button */}
          {showMenuButton && sidebarContent && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden h-9 w-9"
                  onClick={onMenuClick}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side={direction === 'rtl' ? 'right' : 'left'}
                className="w-[280px] p-0"
              >
                <div dir={direction} className="h-full">
                  {sidebarContent}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Greeting - Compact for mobile */}
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-semibold text-start truncate">
              {language === 'ar' ? 'مرحباً، ' : 'Welcome, '}
              <span className="text-primary">{getRoleDisplay()}</span>
            </h1>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Moon className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>

          {/* Language Toggle - Icon only on mobile */}
          <div className="md:hidden">
            <LanguageSwitcher iconOnly={true} />
          </div>
          <div className="hidden md:block">
            <LanguageSwitcher variant="ghost" size="sm" />
          </div>

          {/* User Menu */}
          <DropdownMenu dir={direction}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 md:h-9 px-2 gap-2"
              >
                <Avatar className="h-6 w-6 md:h-7 md:w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-xs md:text-sm font-medium">
                  {getRoleDisplay()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={direction === 'rtl' ? 'start' : 'end'} 
              className="w-56"
            >
              <DropdownMenuLabel className="text-start">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getRoleDisplay()}</p>
                  <p className="text-xs text-muted-foreground truncate" dir="ltr">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="me-2 h-4 w-4" />
                <span>{t?.nav?.logout || (language === 'ar' ? 'تسجيل الخروج' : 'Logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
