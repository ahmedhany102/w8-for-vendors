import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Plus, Minus, ShoppingCart, Loader2, Store, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { formatProductForDisplay } from '@/utils/productUtils';
import { LoadingFallback } from '@/utils/loadingFallback';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import { ProductVariantSelectorV2 } from '@/components/ProductVariantSelectorV2';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { Separator } from '@/components/ui/separator';
import { trackProductView } from '@/hooks/useSections';
import { useSimilarProducts, useMoreFromVendor } from '@/hooks/useProductRecommendations';
import RecommendationCarousel from '@/components/sections/RecommendationCarousel';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  main_image?: string;
  images?: string[];
  colors?: string[];
  sizes?: any[];
  discount?: number;
  featured?: boolean;
  stock?: number;
  inventory?: number;
  vendor_store_name?: string;
  vendor_logo_url?: string;
  vendor_slug?: string;
  vendor_id?: string;
  [key: string]: any;
}

interface VariantSelection {
  colorVariantId: string | null;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  image: string | null;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCartIntegration();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [variantSelection, setVariantSelection] = useState<VariantSelection>({
    colorVariantId: null,
    color: null,
    size: null,
    price: 0,
    stock: 0,
    image: null
  });

  // Check if user came from a vendor store
  const isFromVendorStore = location.pathname.includes('/store/') || 
    (location.state as any)?.fromVendor === true;

  // Fetch recommendations
  const { products: similarProducts, loading: similarLoading } = useSimilarProducts(id, 8);
  const { products: moreFromVendor, loading: moreFromVendorLoading } = useMoreFromVendor(id, vendorId || undefined, 8);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        navigate('/not-found');
        return;
      }

      try {
        setLoading(true);
        
        LoadingFallback.startTimeout('product-details', 5000, () => {
          setLoading(false);
          navigate('/not-found');
        });

        // Try to fetch with vendor info using RPC
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_product_with_vendor', {
          p_product_id: id
        });

        LoadingFallback.clearTimeout('product-details');

        if (rpcError || !rpcData || rpcData.length === 0) {
          // Fallback to direct query
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (error || !data) {
            navigate('/not-found');
            return;
          }

          const formattedProduct = formatProductForDisplay(data);
          setProduct(formattedProduct);
          setVendorId(data.vendor_id || null);
          setCategoryId(data.category_id || null);
          setActiveImage(formattedProduct.main_image || formattedProduct.images?.[0] || '/placeholder.svg');
          return;
        }

        const productData = rpcData[0];
        const formattedProduct = {
          ...formatProductForDisplay(productData),
          vendor_store_name: productData.vendor_store_name,
          vendor_logo_url: productData.vendor_logo_url,
          vendor_id: productData.vendor_id,
          vendor_slug: productData.vendor_slug
        };

        setProduct(formattedProduct);
        setVendorId(productData.vendor_id || null);
        setCategoryId(productData.category_id || null);
        setActiveImage(formattedProduct.main_image || formattedProduct.images?.[0] || '/placeholder.svg');
        
        // Track product view for personalization
        trackProductView(id);
        
      } catch (error: any) {
        LoadingFallback.clearTimeout('product-details');
        console.error('Error fetching product:', error);
        navigate('/not-found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id, navigate]);

  // Check if product has color variants
  useEffect(() => {
    const checkVariants = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('product_color_variants')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      setHasVariants(!error && data && data.length > 0);
    };

    checkVariants();
  }, [id]);

  const handleVariantSelectionChange = useCallback((selection: VariantSelection) => {
    setVariantSelection(selection);
    if (selection.image) {
      setActiveImage(selection.image);
    }
  }, []);

  const handleImageClick = (imageUrl: string) => {
    setActiveImage(imageUrl);
  };

  // Calculate stock and price
  const currentPrice = hasVariants 
    ? variantSelection.price 
    : (product?.price || 0);
  
  const currentStock = hasVariants 
    ? variantSelection.stock 
    : (product?.stock || product?.inventory || 0);
  
  const isOutOfStock = currentStock <= 0;
  const hasDiscount = product?.discount && product.discount > 0;
  const discountedPrice = hasDiscount 
    ? currentPrice - (currentPrice * (product!.discount! / 100)) 
    : currentPrice;

  const canAddToCart = hasVariants 
    ? (variantSelection.colorVariantId && variantSelection.size && currentStock > 0)
    : (currentStock > 0);

  const handleAddToCart = async () => {
    if (!product || !canAddToCart) {
      if (hasVariants && !variantSelection.size) {
        toast.error('يرجى اختيار اللون والمقاس');
      } else {
        toast.error('المنتج غير متوفر حالياً');
      }
      return;
    }

    if (quantity > currentStock) {
      toast.error(`عذراً، المتاح فقط ${currentStock} قطعة`);
      return;
    }

    try {
      setAddingToCart(true);
      
      const productForCart = {
        id: product.id,
        name: product.name,
        price: discountedPrice,
        mainImage: variantSelection.image || product.main_image,
        images: product.images,
        colors: product.colors,
        sizes: product.sizes,
        description: product.description,
        category: product.category,
        inventory: currentStock,
        featured: product.featured,
        discount: product.discount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const cartSize = variantSelection.size || 'متاح';
      const cartColor = variantSelection.color || '';
      const success = await addToCart(productForCart, cartSize, cartColor, quantity, discountedPrice);
      
      if (success) {
        toast.success('تمت الإضافة إلى العربة');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج للعربة');
    } finally {
      setAddingToCart(false);
    }
  };

  const displayStockMessage = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">نفذت الكمية</Badge>;
    } else if (stock === 1) {
      return <Badge variant="destructive">بقي قطعة واحدة فقط!</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">بقي {stock} قطع فقط</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="mb-4 border rounded overflow-hidden">
                <AspectRatio ratio={1}>
                  <div className="w-full h-full bg-muted animate-pulse" />
                </AspectRatio>
              </div>
              <div className="flex overflow-x-auto gap-2 pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border rounded flex-shrink-0 w-16 h-16 bg-muted animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
              <div className="h-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2>
          <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="mb-4 border rounded overflow-hidden">
              <AspectRatio ratio={1}>
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </AspectRatio>
            </div>

            {product.images && product.images.length > 0 && (
              <div className="flex overflow-x-auto gap-2 pb-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`border rounded cursor-pointer flex-shrink-0 w-16 h-16 overflow-hidden ${
                      activeImage === image ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Vendor Info */}
            {product.vendor_store_name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-4 w-4" />
                <span>البائع: {product.vendor_store_name}</span>
              </div>
            )}

            {/* Title and Price */}
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                {hasDiscount ? (
                  <>
                    <span className="text-muted-foreground line-through">
                      {currentPrice} جنيه
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {discountedPrice.toFixed(0)} جنيه
                    </span>
                    <Badge className="bg-destructive">خصم {product.discount}%</Badge>
                  </>
                ) : (
                  <span className="text-xl font-bold text-green-600">
                    {currentPrice} جنيه
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            {hasVariants && variantSelection.size && (
              <div>{displayStockMessage(currentStock)}</div>
            )}
            {!hasVariants && <div>{displayStockMessage(currentStock)}</div>}

            {/* Variant Selector (Color + Size) */}
            {hasVariants && product.id && (
              <ProductVariantSelectorV2
                productId={product.id}
                basePrice={product.price || 0}
                onSelectionChange={handleVariantSelectionChange}
              />
            )}

            {/* Quantity */}
            {!isOutOfStock && canAddToCart && (
              <div>
                <h3 className="text-sm font-medium mb-2">الكمية:</h3>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="mx-4 w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={currentStock <= quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to cart button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canAddToCart || addingToCart}
              onClick={handleAddToCart}
            >
              {addingToCart ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> جاري الإضافة...
                </span>
              ) : isOutOfStock ? (
                'نفذت الكمية'
              ) : !canAddToCart ? (
                'يرجى اختيار اللون والمقاس'
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> إضافة إلى العربة
                </span>
              )}
            </Button>

            {/* Description */}
            <div>
              <h3 className="text-md font-medium mb-2">وصف المنتج:</h3>
              {product.description ? (
                <p className="text-muted-foreground whitespace-pre-line bg-muted p-3 rounded-md">
                  {product.description}
                </p>
              ) : (
                <p className="text-muted-foreground italic">لا يوجد وصف متاح لهذا المنتج.</p>
              )}
            </div>

            {/* Additional information */}
            <div>
              <h3 className="text-md font-medium mb-2">معلومات إضافية:</h3>
              <div className="text-sm text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
                {product.category && (
                  <p>
                    <span className="font-semibold">التصنيف: </span>
                    {product.category}
                  </p>
                )}
                <p>
                  <span className="font-semibold">الكود: </span>
                  {product.id?.substring(0, 8) || '-'}
                </p>
                <p>
                  <span className="font-semibold">الحالة: </span>
                  {isOutOfStock ? 'غير متوفر' : 'متوفر'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-12">
          <Separator className="mb-8" />
          
          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <RecommendationCarousel
              title="منتجات مشابهة"
              products={similarProducts}
              loading={similarLoading}
              icon={<Sparkles className="w-5 h-5" />}
              showMoreLink={isFromVendorStore || !categoryId ? undefined : `/recommendations/similar?category_id=${categoryId}&exclude=${id}`}
            />
          )}
          
          {/* More From This Store */}
          {moreFromVendor.length > 0 && vendorId && (
            <>
              <Separator className="my-6" />
              <RecommendationCarousel
                title="المزيد من هذا المتجر"
                products={moreFromVendor}
                loading={moreFromVendorLoading}
                icon={<Store className="w-5 h-5" />}
                showMoreAction={() => {
                  // Find vendor slug from products
                  const vendorSlug = moreFromVendor[0]?.vendor_slug || product?.vendor_slug;
                  if (vendorSlug) {
                    navigate(`/store/${vendorSlug}`);
                  }
                }}
                showMoreLabel="زيارة المتجر"
              />
            </>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <ProductReviews productId={product.id} />
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
