import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useCategories } from '@/hooks/useCategories';
import { useVendorCategories } from '@/hooks/useVendors';
import { useVendorContext } from '@/hooks/useVendorContext';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import { useBulkProductVariants } from '@/hooks/useBulkProductVariants';
import ShoppingCartDialog from '@/components/ShoppingCartDialog';
import ProductCatalogHeader from '@/components/ProductCatalogHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';
import { useLanguageSafe } from '@/contexts/LanguageContext';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, subcategories: getSubcategories, loading: categoriesLoading } = useCategories();
  const { cartItems, addToCart: addToCartDB, removeFromCart, updateQuantity, clearCart } = useCartIntegration();
  const [showCartDialog, setShowCartDialog] = useState(false);

  // Read subcategory from URL query param or local state
  const subFromUrl = searchParams.get('sub');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(subFromUrl);

  // Sync state with URL param changes
  useEffect(() => {
    setSelectedSubcategory(subFromUrl);
  }, [subFromUrl]);

  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [vendorSelectedCategory, setVendorSelectedCategory] = useState<string | null>(null);
  const [vendorSelectedSubcategory, setVendorSelectedSubcategory] = useState<string | null>(null);

  // Get vendor context - NO MANUAL DETECTION
  const { isVendorContext, vendorId, vendorSlug } = useVendorContext();
  const { t } = useLanguageSafe();

  // Only fetch vendor categories when in vendor context
  const { mainCategories, subcategories: vendorSubcategories } = useVendorCategories(vendorId);

  // Find the current category by slug OR id (hamburger menu passes id, direct URL uses slug)
  const category = categories.find(cat => cat.slug === slug || cat.id === slug);

  // Get subcategories for current category (if it's a parent)
  const childCategories = useMemo(() => {
    if (!category?.id) return [];
    return getSubcategories(category.id);
  }, [category?.id, getSubcategories]);

  // Check if this is a parent category (has no parent_id and has children)
  const isParentCategory = category && !category.parent_id && childCategories.length > 0;

  // Determine effective category for server-side filtering
  // If subcategory selected, use that; otherwise use the current category
  const effectiveCategoryId = useMemo(() => {
    if (selectedSubcategory) return selectedSubcategory;
    return category?.id || null;
  }, [selectedSubcategory, category?.id]);

  // Fetch products with SERVER-SIDE category filtering
  const { products: allProducts, loading: productsLoading } = useSupabaseProducts(
    effectiveCategoryId,
    null // search is handled separately
  );

  // Products are already filtered by category at the server level
  // Just apply vendor filtering if in vendor context
  const categoryProducts = useMemo(() => {
    if (!isVendorContext || !vendorId) return allProducts;
    return allProducts.filter(p => p.vendor_id === vendorId);
  }, [allProducts, isVendorContext, vendorId]);

  // Fetch color variants for all products
  const productIds = useMemo(() => categoryProducts.map(p => p.id), [categoryProducts]);
  const { variantsByProduct } = useBulkProductVariants(productIds);

  // Product filtering (search)
  const {
    filteredProducts,
    searchQuery,
    handleSearch,
    clearFilters
  } = useProductFiltering(categoryProducts);

  // Convert cart items to the format expected by ShoppingCartDialog
  const cartForDialog = cartItems.map(item => ({
    product: {
      id: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl
    },
    quantity: item.quantity
  }));

  const handleAddToCart = async (product: any, size: string, quantity?: number) => {
    const defaultColor =
      product.variants && product.variants.length > 0
        ? product.variants[0].color
        : '';
    await addToCartDB(product, size, defaultColor, quantity || 1);
  };

  const handleUpdateCartItem = async (productId: string, newQuantity: number) => {
    const item = cartItems.find(item => item.productId === productId);
    if (item) {
      if (newQuantity <= 0) {
        await removeFromCart(item.id);
      } else {
        await updateQuantity(item.id, newQuantity);
      }
    }
  };

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleProceedToCheckout = () => {
    setShowCartDialog(false);
    navigate('/cart');
  };

  // Back navigation based on context
  const handleBack = () => {
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}`);
    } else {
      navigate('/');
    }
  };

  // Show 404 if category not found and not loading
  if (!categoriesLoading && !category && slug !== 'all') {
    return (
      <Layout hideGlobalHeader={isVendorContext}>
        {isVendorContext && vendorId && (
          <VendorStoreHeader
            vendorId={vendorId}
            mainCategories={mainCategories}
            subcategories={vendorSubcategories}
            searchQuery={vendorSearchQuery}
            onSearchChange={setVendorSearchQuery}
            selectedCategory={vendorSelectedCategory}
            onCategorySelect={setVendorSelectedCategory}
            selectedSubcategory={vendorSelectedSubcategory}
            onSubcategorySelect={setVendorSelectedSubcategory}
          />
        )}
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t?.common?.noResults || 'Category Not Found'}</h1>
          <p className="text-gray-600 mb-6">{t?.products?.noProducts || 'The category you are looking for is not available'}</p>
          <Button onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {isVendorContext ? (t?.common?.backToHome || 'Back to Store') : (t?.common?.backToHome || 'Back to Home')}
          </Button>
        </div>
      </Layout>
    );
  }

  const isLoading = productsLoading || categoriesLoading;
  const pageTitle = category ? category.name : 'جميع المنتجات';

  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      {/* Vendor Header (when in vendor context) */}
      {isVendorContext && vendorId && (
        <VendorStoreHeader
          vendorId={vendorId}
          mainCategories={mainCategories}
          subcategories={vendorSubcategories}
          searchQuery={vendorSearchQuery}
          onSearchChange={setVendorSearchQuery}
          selectedCategory={vendorSelectedCategory}
          onCategorySelect={setVendorSelectedCategory}
          selectedSubcategory={vendorSelectedSubcategory}
          onSubcategorySelect={setVendorSelectedSubcategory}
        />
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-auto font-normal text-primary hover:text-primary/80"
              >
                {isVendorContext ? (t?.products?.vendor || 'Store') : (t?.nav?.home || 'Home')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {category?.image_url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{pageTitle}</h1>
              {category?.description && (
                <p className="text-gray-600 mt-2">{category.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length} منتج
              </p>
            </div>
          </div>
        </div>

        {/* Subcategory Tabs - only show non-empty categories */}
        {isParentCategory && childCategories.length > 0 && (() => {
          // Filter to only show subcategories with products
          const nonEmptySubcategories = childCategories.filter(sub =>
            allProducts.some(p => p.category_id === sub.id)
          );

          // Don't render tabs section if no subcategories have products
          if (nonEmptySubcategories.length === 0) return null;

          return (
            <div className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={!selectedSubcategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSubcategory(null)}
                  className="whitespace-nowrap"
                >
                  الكل ({categoryProducts.length})
                </Button>
                {nonEmptySubcategories.map(sub => {
                  const subCount = allProducts.filter(p => p.category_id === sub.id).length;
                  return (
                    <Button
                      key={sub.id}
                      variant={selectedSubcategory === sub.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSubcategory(sub.id)}
                      className="whitespace-nowrap"
                    >
                      {sub.name} ({subCount})
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Product Catalog Header */}
        <ProductCatalogHeader
          cart={cartForDialog}
          onCartClick={() => setShowCartDialog(true)}
        />

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} placeholder="ابحث في المنتجات..." />

        {/* Products Grid */}
        <ProductGrid
          products={filteredProducts}
          loading={isLoading}
          searchQuery={searchQuery}
          onAddToCart={handleAddToCart}
          onClearSearch={clearFilters}
          variantsByProduct={variantsByProduct}
        />

        {/* Shopping Cart Dialog */}
        <ShoppingCartDialog
          isOpen={showCartDialog}
          onClose={setShowCartDialog}
          cart={cartForDialog}
          onUpdateCartItem={handleUpdateCartItem}
          onClearCart={handleClearCart}
          onProceedToCheckout={handleProceedToCheckout}
        />
      </div>
    </Layout>
  );
};

export default CategoryPage;
