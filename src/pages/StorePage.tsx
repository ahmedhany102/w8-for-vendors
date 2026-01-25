import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import Layout from '@/components/Layout';
import { useVendorProducts, useVendorCategories } from '@/hooks/useVendors';
import { useVendorContext } from '@/hooks/useVendorContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';
import { Store, Package, ArrowRight, Loader2 } from 'lucide-react';
import { useBestSellers, useLastViewed } from '@/hooks/useSections';
import { useBulkProductVariants } from '@/hooks/useBulkProductVariants';
import { ProductCarousel } from '@/components/sections';
import VendorAdCarousel from '@/components/vendor/VendorAdCarousel';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';
import SEO from '@/components/SEO';
import { useLanguageSafe } from '@/contexts/LanguageContext';

const StorePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Get vendor context - NO MANUAL DETECTION
  // VendorContextProvider guarantees vendorId is available
  const { vendorId, vendorSlug, vendor } = useVendorContext();
  const { t } = useLanguageSafe();

  // Vendor data hooks - use vendorId from context with pagination
  const { products, loading: productsLoading, loadingMore, hasMore, loadMore } = useVendorProducts(
    vendorId,
    selectedSubcategory || selectedCategory,
    searchQuery
  );

  // Infinite scroll trigger
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Trigger load more when element comes into view
  useEffect(() => {
    if (inView && hasMore && !loadingMore) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, loadMore]);
  const { mainCategories, subcategories } = useVendorCategories(vendorId);

  // Get child categories when parent is selected
  const childCategories = selectedCategory ? subcategories(selectedCategory) : [];

  // Vendor-specific sections - NO VENDORID PARAMS, read from context
  const { products: bestSellers, loading: bestSellersLoading } = useBestSellers(12);
  const { products: lastViewed, loading: lastViewedLoading } = useLastViewed(10);

  // Fetch color variants for all products
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { variantsByProduct } = useBulkProductVariants(productIds);

  // Check if filters are active (hides promotional sections)
  const hasFiltersActive = !!(searchQuery || selectedCategory);

  const handleAddToCart = async (product: any, size: string, quantity?: number) => {
    navigate(`/store/${vendorSlug}/product/${product.id}`);
  };

  return (
    <Layout hideGlobalHeader hideFooter>
      <SEO
        title={vendor?.name ? `${vendor.name} | متجر سرعلي` : 'متجر سرعلي'}
        description={vendor?.description || `تسوق من متجر ${vendor?.name || 'سرعلي'} - أفضل المنتجات بأفضل الأسعار`}
        image={vendor?.logo_url || undefined}
      />
      {/* Unified Shopify-style Header */}
      <VendorStoreHeader
        vendorId={vendorId}
        mainCategories={mainCategories}
        subcategories={subcategories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        selectedSubcategory={selectedSubcategory}
        onSubcategorySelect={setSelectedSubcategory}
      />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-6">

        {/*
          MARKETING SECTIONS - SINGLE RENDER GATE
          All sections controlled by ONE condition: !hasFiltersActive
        */}
        {!hasFiltersActive && (
          <div className="marketing-sections">
            {/* TOP ADS CAROUSEL */}
            <VendorAdCarousel position="top" />

            {/* BEST SELLERS - Links to vendor-scoped section */}
            {bestSellers.length > 0 && (
              <div className="mb-8">
                <ProductCarousel
                  title={t?.products?.bestSeller || "Best Sellers"}
                  products={bestSellers}
                  loading={bestSellersLoading}
                  showMoreLink={`/store/${vendorSlug}/section/best-sellers`}
                />
              </div>
            )}

            {/* MIDDLE ADS CAROUSEL */}
            <VendorAdCarousel position="middle" />

            {/* RECENTLY VIEWED */}
            {lastViewed.length > 0 && (
              <div className="mb-8">
                <ProductCarousel
                  title="شوهد مؤخراً"
                  products={lastViewed}
                  loading={lastViewedLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-4">
            {selectedSubcategory
              ? childCategories.find(c => c.id === selectedSubcategory)?.name || (t?.products?.title || 'Products')
              : selectedCategory
                ? mainCategories.find(c => c.id === selectedCategory)?.name || (t?.products?.title || 'Products')
                : (t?.products?.allProducts || 'All Products')}
          </h2>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {searchQuery || selectedCategory
                ? (t?.products?.noProducts || 'No matching products')
                : (t?.products?.noProducts || 'No products in this store yet')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory
                ? (t?.common?.noResults || 'Try changing search criteria')
                : (t?.common?.noResults || 'Products coming soon')}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                {t?.common?.cancel || 'Clear Filters'}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  variants={variantsByProduct[product.id] || []}
                />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t?.common?.loading || 'Loading...'}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">{t?.products?.viewMore || 'Scroll to load more'}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StorePage;
