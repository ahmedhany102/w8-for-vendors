import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useVendorBySlug, useVendorProducts, useVendorCategories } from '@/hooks/useVendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/ProductCard';
import { Store, Search, Package, ArrowRight, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBestSellers, useLastViewed } from '@/hooks/useSections';
import { ProductCarousel } from '@/components/sections';
import { useVendorAds } from '@/hooks/useVendorAds';

const StorePage = () => {
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  const navigate = useNavigate();
  const { vendor, loading: vendorLoading, error: vendorError } = useVendorBySlug(vendorSlug);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const { products, loading: productsLoading } = useVendorProducts(
    vendor?.id,
    selectedSubcategory || selectedCategory,  // Use subcategory if selected, else parent
    searchQuery
  );
  const { mainCategories, subcategories } = useVendorCategories(vendor?.id);

  // Get child categories when parent is selected
  const childCategories = selectedCategory ? subcategories(selectedCategory) : [];

  // Vendor-specific sections
  const { products: bestSellers, loading: bestSellersLoading } = useBestSellers(vendor?.id, 12);
  const { products: lastViewed, loading: lastViewedLoading } = useLastViewed(vendor?.id, 10);

  // Vendor ads
  const { ads: vendorAds } = useVendorAds(vendor?.id);

  // Compute ads ONCE, OUTSIDE JSX (no magic number ranges)
  const topAd = vendorAds.find(ad => ad.position === 0);
  const middleAds = vendorAds.filter(ad => ad.position === 10);

  // Check if filters are active (hides promotional sections)
  const hasFiltersActive = !!(searchQuery || selectedCategory);

  const handleAddToCart = async (product: any, size: string, quantity?: number) => {
    navigate(`/product/${product.id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: vendor?.name,
          text: `تفقد متجر ${vendor?.name}`,
          url: url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('تم نسخ رابط المتجر');
    }
  };

  if (vendorLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="w-full h-48 md:h-64 rounded-lg mb-6" />
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (vendorError || !vendor) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">المتجر غير موجود</h1>
          <p className="text-muted-foreground mb-6">
            عذراً، لم نتمكن من العثور على هذا المتجر
          </p>
          <Button onClick={() => navigate('/vendors')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للمتاجر
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 1. Store Cover (Banner) - Layer 0 */}
      <div className="relative z-0 w-full h-48 md:h-64 bg-gradient-to-br from-primary/30 to-primary/10 overflow-hidden">
        {vendor.cover_url ? (
          <img
            src={vendor.cover_url}
            alt={`${vendor.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Share Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 2. Container (Holds Content) - Layer 10 */}
      <div className="relative z-10 container mx-auto px-4">

        {/* 3. Store Header */}
        <div className="relative -mt-16 mb-8 flex flex-col sm:flex-row items-center sm:items-end gap-4">

          {/* Vendor Logo */}
          <div className="shrink-0 w-28 h-28 rounded-full bg-background border-4 border-background shadow-lg flex items-center justify-center overflow-hidden z-20">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={vendor.name}
                // التعديل هنا: object-contain بدل object-cover
                // وضفنا p-1 عشان الصورة تاخد راحتها وماتلزقش في الحواف
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Store className="w-12 h-12 text-primary" />
            )}
          </div>

          {/* Vendor Info */}
          <div className="text-center sm:text-right pb-2 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{vendor.name}</h1>
            {vendor.description && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{vendor.description}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">
              {products.length} منتج متاح
            </p>
          </div>
        </div>

        {/* Store Controls Row */}
        <div className="mb-8 space-y-4">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`ابحث داخل متجر ${vendor.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Category Filters - Root categories only */}
          {mainCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
              >
                <Package className="w-4 h-4 ml-1" />
                الكل
              </Button>
              {mainCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedSubcategory(null);
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}

          {/* Subcategory Tabs - shown when parent category is selected */}
          {selectedCategory && childCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 pr-4">
              <span className="text-sm text-muted-foreground self-center">الفئات الفرعية:</span>
              <Button
                variant={!selectedSubcategory ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedSubcategory(null)}
              >
                الكل
              </Button>
              {childCategories.map((sub) => (
                <Button
                  key={sub.id}
                  variant={selectedSubcategory === sub.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedSubcategory(sub.id)}
                >
                  {sub.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/*
          =============================================
          MARKETING SECTIONS - SINGLE RENDER GATE
          =============================================
          All sections controlled by ONE condition: !hasFiltersActive
          Layout order: TOP_AD → BEST_SELLERS → MIDDLE_ADS → RECENTLY_VIEWED
        */}
        {!hasFiltersActive && (
          <div className="marketing-sections">
            {/* TOP AD - Single banner */}
            {topAd && (
              <div className="mb-8">
                <a
                  href={topAd.redirect_url || '#'}
                  target={topAd.redirect_url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <img
                    src={topAd.image_url}
                    alt={topAd.title || 'Store advertisement'}
                    className="w-full h-32 md:h-48 object-cover"
                  />
                </a>
              </div>
            )}

            {/* BEST SELLERS */}
            {bestSellers.length > 0 && (
              <div className="mb-8">
                <ProductCarousel
                  title="Best Sellers"
                  products={bestSellers}
                  loading={bestSellersLoading}
                  showMoreLink="/section/best-sellers"
                />
              </div>
            )}

            {/* MIDDLE ADS - Grid of max 2 */}
            {middleAds.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {middleAds.map((ad) => (
                  <a
                    key={ad.id}
                    href={ad.redirect_url || '#'}
                    target={ad.redirect_url ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={ad.image_url}
                      alt={ad.title || 'Store advertisement'}
                      className="w-full h-40 md:h-48 object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* RECENTLY VIEWED */}
            {lastViewed.length > 0 && (
              <div className="mb-8">
                <ProductCarousel
                  title="Recently Viewed"
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
              ? childCategories.find(c => c.id === selectedSubcategory)?.name || 'Products'
              : selectedCategory
                ? mainCategories.find(c => c.id === selectedCategory)?.name || 'Products'
                : 'All Products'}
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
                ? 'No matching products'
                : 'No products in this store yet'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory
                ? 'Try changing your search criteria'
                : 'Products will be added soon'}
            </p>
            {(searchQuery || selectedCategory) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StorePage;
