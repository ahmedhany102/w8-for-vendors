import React, { useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import UserOrders from '@/components/UserOrders';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';
import { useVendorBySlug, useVendorCategories } from '@/hooks/useVendors';

const OrderTracking = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Detect vendor context from URL path
  const vendorContext = useMemo(() => {
    const match = location.pathname.match(/^\/store\/([^/]+)/);
    if (match) {
      return { isVendorContext: true, vendorSlug: match[1] };
    }
    return { isVendorContext: false, vendorSlug: null };
  }, [location.pathname]);

  const { isVendorContext, vendorSlug } = vendorContext;

  // Get vendor data for header
  const { vendor } = useVendorBySlug(vendorSlug || undefined);
  const { mainCategories, subcategories } = useVendorCategories(vendor?.id);

  if (loading) {
    return (
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        {isVendorContext && vendor?.id && (
          <VendorStoreHeader
            vendorId={vendor.id}
            mainCategories={mainCategories}
            subcategories={subcategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        )}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if not authenticated, saving current URL
  React.useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
    }
  }, [user, loading, location.pathname, navigate]);

  if (!user) {
    return null; // Wait for redirect
  }

  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      {/* Vendor Header when in vendor context */}
      {isVendorContext && vendor?.id && (
        <VendorStoreHeader
          vendorId={vendor.id}
          mainCategories={mainCategories}
          subcategories={subcategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <UserOrders />
      </div>
    </Layout>
  );
};

export default OrderTracking;
