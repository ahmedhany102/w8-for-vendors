import React from 'react';
import Layout from '@/components/Layout';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag } from 'lucide-react';
import VendorsGrid from '@/components/VendorsGrid';
import DynamicSections from '@/components/sections/DynamicSections';

const Index = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'home' | 'products' | 'vendors'>('home');

  // Show loading state while maintaining layout to prevent CLS
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="h-48 mb-6 flex items-center justify-center">
            <Loader size="lg" color="primary" className="mb-4" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Greeting Section */}
        {user && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">أهلاً بك {user.name}!</h2>
            <p className="text-muted-foreground">نتمنى لك تجربة تسوق ممتعة</p>
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              الرئيسية
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              المنتجات
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              المتاجر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-6">
            {/* Dynamic Sections from Database - Admin Controlled */}
            <DynamicSections scope="global" />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            {/* Product Catalog with filters */}
            <ProductCatalog />
          </TabsContent>

          <TabsContent value="vendors" className="mt-6">
            {/* Vendors Grid */}
            <h2 className="text-2xl font-bold mb-6">تصفح المتاجر</h2>
            <VendorsGrid />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
