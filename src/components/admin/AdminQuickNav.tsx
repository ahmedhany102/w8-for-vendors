import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Package, ShoppingCart, Users, Store, Ticket, 
  Settings, Star, BarChart3, FolderTree, LayoutGrid, MessageSquare 
} from 'lucide-react';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const AdminQuickNav: React.FC = () => {
  const location = useLocation();
  const { language, direction } = useLanguageSafe();

  const navItems = [
    { icon: Home, label: language === 'ar' ? 'الرئيسية' : 'Dashboard', path: '/admin', exact: true },
    { icon: FolderTree, label: language === 'ar' ? 'الأقسام' : 'Categories', path: '/admin/categories' },
    { icon: LayoutGrid, label: language === 'ar' ? 'السيكشنز' : 'Sections', path: '/admin/sections' },
    { icon: Package, label: language === 'ar' ? 'المنتجات' : 'Products', path: '/admin/products' },
    { icon: Store, label: language === 'ar' ? 'منتجات البائعين' : 'Vendor Products', path: '/admin/vendor-products' },
    { icon: ShoppingCart, label: language === 'ar' ? 'الطلبات' : 'Orders', path: '/admin/orders' },
    { icon: ShoppingCart, label: language === 'ar' ? 'طلبات البائعين' : 'Vendor Orders', path: '/admin/vendor-orders' },
    { icon: Ticket, label: language === 'ar' ? 'الكوبونات' : 'Coupons', path: '/admin/coupons' },
    { icon: MessageSquare, label: language === 'ar' ? 'بيانات التواصل' : 'Contact', path: '/admin/contact' },
    { icon: Settings, label: language === 'ar' ? 'الإعلانات' : 'Ads', path: '/admin/ads' },
    { icon: Star, label: language === 'ar' ? 'التقييمات' : 'Reviews', path: '/admin/reviews' },
    { icon: Store, label: language === 'ar' ? 'البائعين' : 'Vendors', path: '/admin/vendors' },
    { icon: BarChart3, label: language === 'ar' ? 'الإيرادات' : 'Analytics', path: '/admin/analytics' },
    { icon: Users, label: language === 'ar' ? 'المستخدمين' : 'Users', path: '/admin/users' },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path || location.pathname === path + '/';
    }
    return location.pathname === path;
  };

  return (
    <div className="w-full overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" dir={direction}>
      <div className="inline-flex flex-nowrap min-w-max gap-1 p-1 bg-muted rounded-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors shrink-0",
                active
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminQuickNav;
