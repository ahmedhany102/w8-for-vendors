import React from 'react';
import AdminDashboardStats from '@/components/AdminDashboardStats';
import AdminQuickNav from '@/components/admin/AdminQuickNav';
import { useSupabaseProducts, useSupabaseUsers, useSupabaseOrders } from '@/hooks/useSupabaseData';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, ShoppingCart, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { language } = useLanguageSafe();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { orders, loading: ordersLoading } = useSupabaseOrders();

  const statsLoading = productsLoading || usersLoading || ordersLoading;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <AdminDashboardStats
        totalProducts={products?.length || 0}
        totalUsers={users?.length || 0}
        totalOrders={orders?.length || 0}
        loading={statsLoading}
      />

      {/* Quick Navigation */}
      <AdminQuickNav />

      {/* Welcome Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {language === 'ar' ? 'إدارة المتجر' : 'Store Management'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'مرحباً بك في لوحة التحكم. يمكنك إدارة المنتجات والطلبات والمزيد من هنا.'
                : 'Welcome to the admin panel. You can manage products, orders, and more from here.'}
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                {language === 'ar' ? 'المنتجات:' : 'Products:'} {products?.length || 0}
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {language === 'ar' ? 'المستخدمين:' : 'Users:'} {users?.length || 0}
              </p>
              <p className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                {language === 'ar' ? 'الطلبات:' : 'Orders:'} {orders?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {language === 'ar' ? 'ملخص سريع' : 'Quick Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {language === 'ar'
                ? 'استخدم القائمة الجانبية أو الروابط السريعة أعلاه للتنقل بين الأقسام المختلفة.'
                : 'Use the sidebar or quick links above to navigate between different sections.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
