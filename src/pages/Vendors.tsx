import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useVendors } from '@/hooks/useVendors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, ArrowLeft } from 'lucide-react';

const Vendors = () => {
  const { vendors, loading, error } = useVendors();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">تصفح المتاجر</h1>
          <p className="text-muted-foreground">
            اكتشف أفضل البائعين والمتاجر في منصتنا
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    <Skeleton className="w-20 h-20 rounded-full mb-4" />
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">حدث خطأ أثناء تحميل المتاجر</p>
            <Button onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && vendors.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">لا توجد متاجر حالياً</h2>
            <p className="text-muted-foreground">
              سيتم إضافة متاجر جديدة قريباً
            </p>
          </div>
        )}

        {/* Vendors Grid */}
        {!loading && !error && vendors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <Card 
                key={vendor.id} 
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/store/${vendor.slug}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    {/* Vendor Logo */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 overflow-hidden border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      {vendor.logo_url ? (
                        <img 
                          src={vendor.logo_url} 
                          alt={vendor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    
                    {/* Vendor Name */}
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                      {vendor.name}
                    </h3>
                    
                    {/* Product Count */}
                    {typeof vendor.product_count === 'number' && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {vendor.product_count} منتج
                      </p>
                    )}
                    
                    {/* Visit Store Button */}
                    <Button 
                      className="w-full gap-2 group-hover:gap-3 transition-all"
                      variant="outline"
                    >
                      <span>زيارة المتجر</span>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Vendors;
