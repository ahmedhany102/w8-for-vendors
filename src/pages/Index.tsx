import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCatalog from '@/components/ProductCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { Loader } from '@/components/ui/loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingBag } from 'lucide-react';
import DynamicSections from '@/components/sections/DynamicSections';
import SEO from '@/components/SEO';

const Index = () => {
  const { user, loading } = useAuth();
  const { t, direction } = useLanguageSafe();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'home' | 'products'>('home');

  // Helper to get user display name based on role
  const getUserDisplayName = (user: any): string => {
    if (!user) return direction === 'rtl' ? 'ضيف' : 'Guest';
    
    const role = user.user_metadata?.role || user.role;
    
    // Admin/Super Admin
    if (role === 'SUPER_ADMIN' || role === 'super_admin' || role === 'ADMIN' || role === 'admin') {
      return direction === 'rtl' ? 'المدير' : 'CEO';
    }
    
    // Vendor
    if (role === 'VENDOR' || role === 'vendor') {
      return direction === 'rtl' ? 'التاجر' : 'Vendor';
    }
    
    // Regular user - use first name or short email prefix
    const firstName = user.user_metadata?.first_name || user.user_metadata?.name;
    if (firstName && firstName.length < 15) {
      return firstName;
    }
    
    // Fallback to email prefix
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.length > 12 ? prefix.substring(0, 12) + '...' : prefix;
    }
    
    return direction === 'rtl' ? 'مستخدم' : 'User';
  };

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
          <div dir={direction} className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-10 flex flex-col justify-center items-start text-start">
            <h1 className="text-2xl md:text-4xl font-bold mb-3">
              {t?.hero?.title || 'Launch and Sell'} <span className="text-primary">{t?.hero?.subtitle || 'in just 30 seconds'}</span>
            </h1>
            <p className="text-muted-foreground mb-6">
              {direction === 'rtl'
                ? 'مع سرعلي - أسرع طريقة لإنشاء متجرك الإلكتروني'
                : 'With Sarraly - The fastest way to build your online store'}
            </p>
            <a
              href="/become-vendor"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              <Store className="w-5 h-5" />
              {t?.hero?.cta || 'Get Your Online Store Now'}
            </a>
          </div>
        )}

        {/* Greeting Section for Logged-in Users */}
        {user && (
          <div dir={direction} className="mb-6">
            <h2 className="text-xl font-bold mb-2">{t?.hero?.welcome || 'Welcome'} {getUserDisplayName(user)}!</h2>
            <p className="text-muted-foreground">
              {direction === 'rtl' ? 'نتمنى لك تجربة تسوق ممتعة' : 'Enjoy your shopping experience'}
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <div dir={direction} className="flex w-full justify-start">
            <TabsList dir={direction} className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="home" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t?.nav?.home || 'Home'}
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                {t?.nav?.products || 'Products'}
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
                {t?.nav?.stores || 'Stores'}
              </TabsTrigger>
            </TabsList>
          </div>

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
