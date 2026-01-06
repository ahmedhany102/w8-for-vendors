import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Package, ShoppingCart, Percent, Wallet } from 'lucide-react';

interface VendorAnalyticsData {
  vendor_id: string;
  vendor_name: string;
  total_orders: number;
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  commission_rate: number;
  platform_commission: number;
  vendor_payout: number;
}

interface VendorAnalyticsProps {
  vendorId: string;
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId }) => {
  const [analytics, setAnalytics] = React.useState<VendorAnalyticsData | null>(null);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      if (!vendorId) return;
      
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Fetch vendor analytics
        const { data: analyticsData, error: analyticsError } = await supabase
          .rpc('get_vendor_analytics', { _vendor_id: vendorId });
        
        if (analyticsError) {
          console.error('Error fetching analytics:', analyticsError);
        } else if (analyticsData && analyticsData.length > 0) {
          setAnalytics(analyticsData[0]);
        }

        // Fetch top products
        const { data: topProductsData, error: topProductsError } = await supabase
          .rpc('get_vendor_top_products', { _vendor_id: vendorId, _limit: 5 });
        
        if (topProductsError) {
          console.error('Error fetching top products:', topProductsError);
        } else if (topProductsData) {
          setTopProducts(topProductsData);
        }
      } catch (error) {
        console.error('Error in analytics fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">لا توجد بيانات تحليلية متاحة</p>
          <p className="text-sm text-muted-foreground">ستظهر التحليلات بعد تلقي طلبات</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return `${(value || 0).toFixed(2)} ج.م`;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات اليوم</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.today_revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الأسبوع</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.week_revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إيرادات الشهر</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.month_revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">طلب</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">نسبة العمولة</CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(analytics.commission_rate || 0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            تفاصيل العمولة والأرباح
          </CardTitle>
          <CardDescription>ملخص العمولة المستحقة للمنصة وصافي أرباحك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">إجمالي المبيعات</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.total_revenue)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">عمولة المنصة ({analytics.commission_rate}%)</p>
              <p className="text-2xl font-bold text-red-600">- {formatCurrency(analytics.platform_commission)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">صافي أرباحك</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.vendor_payout)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              أفضل المنتجات مبيعاً
            </CardTitle>
            <CardDescription>المنتجات الأكثر مبيعاً في متجرك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.product_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.product_name}</p>
                      <p className="text-sm text-muted-foreground">{product.total_sold} قطعة مباعة</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">{formatCurrency(product.total_revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorAnalytics;
