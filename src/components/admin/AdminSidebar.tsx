import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Store, 
  ShoppingCart, 
  Settings,
  BarChart3,
  Tags,
  FileText,
  Home,
  ChevronRight,
  Ticket,
  Star,
  LayoutGrid,
  MessageSquare
} from 'lucide-react';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavigate }) => {
  const location = useLocation();
  const { direction, language } = useLanguageSafe();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: language === 'ar' ? 'الرئيسية' : 'Dashboard',
      path: '/admin',
      exact: true
    },
    {
      icon: Tags,
      label: language === 'ar' ? 'الأقسام' : 'Categories',
      path: '/admin?tab=categories',
      isTab: true
    },
    {
      icon: LayoutGrid,
      label: language === 'ar' ? 'السيكشنز' : 'Sections',
      path: '/admin?tab=sections',
      isTab: true
    },
    {
      icon: Package,
      label: language === 'ar' ? 'المنتجات' : 'Products',
      path: '/admin/products'
    },
    {
      icon: Store,
      label: language === 'ar' ? 'منتجات البائعين' : 'Vendor Products',
      path: '/admin?tab=vendor-products',
      isTab: true
    },
    {
      icon: ShoppingCart,
      label: language === 'ar' ? 'الطلبات' : 'Orders',
      path: '/admin/orders'
    },
    {
      icon: ShoppingCart,
      label: language === 'ar' ? 'طلبات البائعين' : 'Vendor Orders',
      path: '/admin?tab=vendor-orders',
      isTab: true
    },
    {
      icon: Ticket,
      label: language === 'ar' ? 'الكوبونات' : 'Coupons',
      path: '/admin/coupons'
    },
    {
      icon: MessageSquare,
      label: language === 'ar' ? 'بيانات التواصل' : 'Contact Settings',
      path: '/admin/contact'
    },
    {
      icon: Settings,
      label: language === 'ar' ? 'الإعلانات' : 'Ads',
      path: '/admin/ads'
    },
    {
      icon: Star,
      label: language === 'ar' ? 'التقييمات' : 'Reviews',
      path: '/admin?tab=reviews',
      isTab: true
    },
    {
      icon: Store,
      label: language === 'ar' ? 'البائعين' : 'Vendors',
      path: '/admin/vendors'
    },
    {
      icon: BarChart3,
      label: language === 'ar' ? 'الإيرادات' : 'Analytics',
      path: '/admin?tab=analytics',
      isTab: true
    },
    {
      icon: Users,
      label: language === 'ar' ? 'المستخدمين' : 'Users',
      path: '/admin/users'
    }
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside 
      className="w-full lg:w-64 bg-white border-e border-gray-200 h-full flex flex-col"
      dir={direction}
    >
      {/* Logo Section */}
      <div className="h-14 md:h-16 flex items-center px-4 border-b border-gray-200 flex-shrink-0">
        <Link 
          to="/admin" 
          className="flex items-center gap-2"
          onClick={handleClick}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-primary">
              {language === 'ar' ? 'سرعلي' : 'Sarraly'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors text-start",
                  active
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {active && (
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      direction === 'rtl' && "rotate-180"
                    )} 
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Back to Site Link */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <Link
          to="/"
          onClick={handleClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-start"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">
            {language === 'ar' ? 'العودة للموقع' : 'Back to Site'}
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
