import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import CategoryNavigation from './CategoryNavigation';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import { useCategories } from '@/hooks/useCategories';
import ProductCatalogHeader from './ProductCatalogHeader';
import ProductGrid from './ProductGrid';
import ShoppingCartDialog from './ShoppingCartDialog';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import { useBulkProductVariants } from '@/hooks/useBulkProductVariants';
import { Button } from '@/components/ui/button';

const ProductCatalog: React.FC = () => {
  const { products, loading } = useSupabaseProducts();
  const { categories, subcategories: getSubcategories } = useCategories();
  const { cartItems, cartCount, addToCart: addToCartDB, removeFromCart, updateQuantity, clearCart } = useCartIntegration();

  // Get child categories for the selected parent
  const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState<string | null>(null);

  const childCategories = useMemo(() => {
    if (!internalSelectedCategoryId) return [];
    return getSubcategories(internalSelectedCategoryId);
  }, [internalSelectedCategoryId, getSubcategories]);

  // Check if selected category is a parent (has children)
  const selectedCategory = categories.find(c => c.id === internalSelectedCategoryId);
  const isParentCategory = selectedCategory && !selectedCategory.parent_id && childCategories.length > 0;

  // Get child IDs for filtering
  const childCategoryIds = useMemo(() =>
    childCategories.map(c => c.id),
    [childCategories]
  );

  const {
    filteredProducts,
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    handleSearch,
    handleCategoryFilter,
    handleSubcategoryFilter,
    clearFilters
  } = useProductFiltering(products, {
    categories,
    childCategoryIds: isParentCategory ? childCategoryIds : undefined
  });

  // Fetch all variants in bulk for all products
  const productIds = React.useMemo(() => products.map(p => p.id), [products]);
  const { variantsByProduct } = useBulkProductVariants(productIds);
  const [showCartDialog, setShowCartDialog] = React.useState(false);

  // Sync internal category state with filter
  const handleCategorySelect = (categoryId: string | null) => {
    setInternalSelectedCategoryId(categoryId);
    handleCategoryFilter(categoryId);
  };

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
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : '';
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
    window.location.href = '/cart';
  };

  return (
    <div className="container mx-auto px-4 py-4 min-h-[1000px]">
      <ProductCatalogHeader
        cart={cartForDialog}
        onCartClick={() => setShowCartDialog(true)}
      />

      <CategoryNavigation
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategoryId}
      />

      {/* Subcategory Tabs - shown when parent category is selected */}
      {isParentCategory && childCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={!selectedSubcategoryId ? "default" : "outline"}
              size="sm"
              onClick={() => handleSubcategoryFilter(null)}
              className="whitespace-nowrap"
            >
              الكل ({filteredProducts.length})
            </Button>
            {childCategories.map(sub => {
              const subCount = products.filter(p => p.category_id === sub.id).length;
              return (
                <Button
                  key={sub.id}
                  variant={selectedSubcategoryId === sub.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSubcategoryFilter(sub.id)}
                  className="whitespace-nowrap"
                >
                  {sub.name} ({subCount})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <SearchBar onSearch={handleSearch} placeholder="ابحث عن المنتجات..." />

      <ProductGrid
        products={filteredProducts}
        loading={loading}
        searchQuery={searchQuery}
        onAddToCart={handleAddToCart}
        onClearSearch={clearFilters}
        variantsByProduct={variantsByProduct}
      />

      <ShoppingCartDialog
        isOpen={showCartDialog}
        onClose={setShowCartDialog}
        cart={cartForDialog}
        onUpdateCartItem={handleUpdateCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
      />
    </div>
  );
};
export default ProductCatalog;

