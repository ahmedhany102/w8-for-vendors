import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/models/Product';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Layout from '@/components/Layout';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';
import { useVendorBySlug, useVendorCategories } from '@/hooks/useVendors';

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, loading: favoritesLoading, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user) {
      // Save current URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
      return;
    }
    fetchFavoriteProducts();
  }, [user, favorites]);

  const fetchFavoriteProducts = async () => {
    if (favorites.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const productIds = favorites.map(f => f.product_id);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;

      const productData = (data || []).map(p => {
        const images = Array.isArray(p.images)
          ? p.images
          : (typeof p.images === 'string' ? JSON.parse(p.images) : []);
        const colors = Array.isArray(p.colors)
          ? p.colors
          : (typeof p.colors === 'string' ? JSON.parse(p.colors) : []);
        const sizes = Array.isArray(p.sizes)
          ? p.sizes
          : (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : []);

        return {
          ...p,
          images,
          colors,
          sizes
        } as Product;
      });

      setProducts(productData);
    } catch (error: any) {
      console.error('Error fetching favorite products:', error);
      toast.error('Failed to load favorite products');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    await toggleFavorite(productId);
  };

  const handleViewProduct = (productId: string) => {
    // Vendor-aware product navigation
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}/product/${productId}`);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  // Browse Products - vendor-aware navigation
  const handleBrowseProducts = () => {
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}`);
    } else {
      navigate('/');
    }
  };

  if (favoritesLoading || loading) {
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
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">
            {products.length} {products.length === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent>
              <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start adding products you love to your favorites
              </p>
              <Button onClick={handleBrowseProducts}>
                Browse Products
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const mainImage = product.main_image || product.image_url || product.images?.[0] || '/placeholder.svg';
              const finalPrice = product.discount
                ? product.price * (1 - product.discount / 100)
                : product.price;

              return (
                <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <AspectRatio ratio={3 / 4}>
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleViewProduct(product.id)}
                      />
                    </AspectRatio>

                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                        -{product.discount}%
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                      onClick={() => handleRemoveFavorite(product.id)}
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <h3
                      className="font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => handleViewProduct(product.id)}
                    >
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg font-bold text-primary">
                        ${finalPrice.toFixed(2)}
                      </span>
                      {product.discount && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Favorites;
