import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import ShoppingCartDialog from '@/components/ShoppingCartDialog';
import ProductCatalogHeader from '@/components/ProductCatalogHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useSupabaseProducts();
  const { categories, subcategories: getSubcategories, loading: categoriesLoading } = useCategories();
  const { cartItems, addToCart: addToCartDB, removeFromCart, updateQuantity, clearCart } = useCartIntegration();
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Find the current category
  const category = categories.find(cat => cat.slug === slug);

  // Get subcategories for current category (if it's a parent)
  const childCategories = useMemo(() => {
    if (!category?.id) return [];
    return getSubcategories(category.id);
  }, [category?.id, getSubcategories]);

  // Check if this is a parent category (has no parent_id and has children)
  const isParentCategory = category && !category.parent_id && childCategories.length > 0;

  // Filter products by category hierarchy
  const categoryProducts = useMemo(() => {
    if (!category) return products;

    if (selectedSubcategory) {
      // User selected a specific subcategory
      return products.filter(product => product.category_id === selectedSubcategory);
    }

    if (isParentCategory) {
      // On parent category - show products from all child categories
      const childIds = childCategories.map(c => c.id);
      return products.filter(product => childIds.includes(product.category_id));
    }

    // On a child category or category without children - exact match
    return products.filter(product => product.category_id === category.id);
  }, [category, selectedSubcategory, isParentCategory, childCategories, products]);

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
    // لو المنتج فيه ألوان ومتغيرات، اختار أول لون تلقائيًا للتجربة
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

  // Show 404 if category not found and not loading
  if (!categoriesLoading && !category && slug !== 'all') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">الفئة غير موجودة</h1>
          <p className="text-gray-600 mb-6">الفئة التي تبحث عنها غير متوفرة</p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
      </Layout>
    );
  }

  const isLoading = productsLoading || categoriesLoading;
  const pageTitle = category ? category.name : 'جميع المنتجات';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-0 h-auto font-normal text-primary hover:text-primary/80"
              >
                الرئيسية
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

        {/* Subcategory Tabs - shown when on parent category */}
        {isParentCategory && childCategories.length > 0 && (
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
              {childCategories.map(sub => {
                const subCount = products.filter(p => p.category_id === sub.id).length;
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
        )}

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
