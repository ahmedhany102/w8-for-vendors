import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, BarChart3, Settings, LogOut, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorSettings from './VendorSettings';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { VendorStatusBanner } from '@/components/vendor/VendorStatusBanner';
import { VendorProductsTab } from '@/components/vendor/VendorProductsTab';
import { VendorOrdersTab } from '@/components/vendor/VendorOrdersTab';
import VendorAdsManagement from '@/components/vendor/VendorAdsManagement';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';
import { useVendorProducts } from '@/hooks/useVendorProducts';
import { useVendorOrders } from '@/hooks/useVendorOrders';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useVendorProfile();
  const { products } = useVendorProducts();
  const { orders } = useVendorOrders();
  const [vendorId, setVendorId] = React.useState<string | null>(null);

  // Fetch vendor ID for the current user
  React.useEffect(() => {
    const fetchVendorId = async () => {
      if (!user?.id) return;
      const { data } = await (await import('@/integrations/supabase/client')).supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) setVendorId(data.id);
    };
    fetchVendorId();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isApproved = profile?.status === 'approved';
  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'approved').length;
  const pendingOrders = orders.filter(o => o.order_status === 'PENDING' || o.order_status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.vendor_total || 0), 0);

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة تحكم البائع</h1>
            <p className="text-muted-foreground mt-1">
              مرحباً، {profile?.store_name || user?.name || user?.email?.split('@')[0] || 'البائع'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {profile && <VendorStatusBanner status={profile.status} />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts}</div>
              <p className="text-xs text-muted-foreground">منتج نشط</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">الطلبات الجديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">طلب جديد</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} ج.م</div>
              <p className="text-xs text-muted-foreground">إجمالي المبيعات</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">التقييم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">متوسط التقييمات</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">المنتجات</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">الطلبات</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">الإعلانات</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">التحليلات</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <VendorProductsTab isApproved={isApproved} />
          </TabsContent>

          <TabsContent value="orders">
            <VendorOrdersTab isApproved={isApproved} />
          </TabsContent>

          <TabsContent value="ads">
            {vendorId ? (
              <VendorAdsManagement vendorId={vendorId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {vendorId ? (
              <VendorAnalytics vendorId={vendorId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <VendorSettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VendorDashboard;
