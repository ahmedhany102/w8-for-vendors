import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from '@/components/ui/loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag } from 'lucide-react';
import DynamicSections from '@/components/sections/DynamicSections';
import SEO from '@/components/SEO';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'home' | 'products'>('home');

  // Show loading state while maintaining layout to prevent CLS
  if (loading) {
    return (
      <Layout>
        <SEO />
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
      <SEO
        title="سرعلي - امتلك متجرك الإلكتروني في ثوانٍ"
        description="أفضل منصة للتجارة الإلكترونية في مصر. تسوق آلاف المنتجات أو ابدأ مشروعك الخاص اليوم."
      />
      <div className="container mx-auto px-4 py-6">
        {/* Hero Section for Guest Users - Speed-focused branding */}
        {!user && (
          <div className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-10 text-center md:text-right">
            <h1 className="text-2xl md:text-4xl font-bold mb-3">
              انطلق وابدأ البيع في <span className="text-primary">30 ثانية</span> فقط
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-2">
              Launch and Sell in <span className="text-primary font-bold">30 Seconds</span>
            </p>
            <p className="text-muted-foreground mb-6">
              مع سرعلي - أسرع طريقة لإنشاء متجرك الإلكتروني
            </p>
            <a
              href="/become-vendor"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              <Store className="w-5 h-5" />
              امتلك متجرك الإلكتروني الآن
            </a>
          </div>
        )}

        {/* Greeting Section for Logged-in Users */}
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
            {/* Stores tab navigates to /vendors page */}
            <TabsTrigger
              value="vendors"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                navigate('/vendors');
              }}
            >
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
