import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, BarChart3, Settings, LogOut, Image, LayoutList, Truck } from 'lucide-react';
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
import VendorFooterSettings from '@/components/vendor/VendorFooterSettings';
import VendorShippingSettings from '@/components/vendor/VendorShippingSettings';
import { useVendorNotifications } from '@/hooks/useVendorNotifications';
import { trackCompleteRegistration } from '@/services/facebookPixel';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useVendorProfile();
  const { products } = useVendorProducts();
  const { orders } = useVendorOrders();
  const [vendorId, setVendorId] = React.useState<string | null>(null);
  const [strictRevenue, setStrictRevenue] = React.useState<number>(0);
  
  // Ref to track if conversion has been fired (prevent duplicate events)
  const conversionTrackedRef = useRef(false);

  // Enable real-time order notifications
  useVendorNotifications();

  // ===========================================
  // FACEBOOK PIXEL: TRACK COMPLETE REGISTRATION
  // ===========================================
  useEffect(() => {
    // Only track once when vendor first accesses dashboard after registration
    if (profile?.status === 'approved' && !conversionTrackedRef.current) {
      // Check if this is a new registration (from session storage)
      const isNewRegistration = sessionStorage.getItem('newVendorRegistration');
      
      if (isNewRegistration) {
        // Track the conversion event
        trackCompleteRegistration({
          content_name: profile.store_name || 'Vendor Store Registration',
          value: 0,
          currency: 'EGP',
        });
        
        // Clear the flag to prevent duplicate tracking
        sessionStorage.removeItem('newVendorRegistration');
        conversionTrackedRef.current = true;
      }
    }
  }, [profile?.status, profile?.store_name]);

  // Fetch vendor ID for the current user
  React.useEffect(() => {
    const fetchVendorId = async () => {
      if (!user?.id) return;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (data) setVendorId(data.id);
    };
    fetchVendorId();
  }, [user?.id]);

  // Fetch strict revenue from analytics RPC (only paid + delivered orders)
  React.useEffect(() => {
    const fetchStrictRevenue = async () => {
      if (!user?.id) return;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.rpc('get_vendor_analytics');
      if (!error && data && data.length > 0) {
        setStrictRevenue(data[0].total_revenue || 0);
      }
    };
    fetchStrictRevenue();
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isApproved = profile?.status === 'approved';
  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'approved').length;
  const pendingOrders = orders.filter(o => o.order_status === 'PENDING' || o.order_status === 'pending').length;

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-8 gap-4">
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
              <div className="text-2xl font-bold">{strictRevenue.toFixed(2)} ج.م</div>
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
          <TabsList className="grid w-full grid-cols-7 mb-8">
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
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">الشحن</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">التحليلات</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">الفوتر</span>
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

          <TabsContent value="shipping">
            {profile?.id ? (
              <VendorShippingSettings vendorProfileId={profile.id} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
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

          <TabsContent value="footer">
            {vendorId ? (
              <VendorFooterSettings vendorId={vendorId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <LayoutList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VendorDashboard;
