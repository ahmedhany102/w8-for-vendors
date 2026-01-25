import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Plus, Minus, ShoppingCart, Loader2, Store, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useVendorContext } from '@/hooks/useVendorContext';
import { useVendorCategories } from '@/hooks/useVendors';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';
import SEO from '@/components/SEO';
import { useLanguageSafe } from '@/contexts/LanguageContext';

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
  galleryUrls: string[];
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, direction } = useLanguageSafe();
  const { addToCart } = useCartIntegration();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Dynamic gallery for variant-specific images
  const [currentGallery, setCurrentGallery] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [variantSelection, setVariantSelection] = useState<VariantSelection>({
    colorVariantId: null,
    color: null,
    size: null,
    price: 0,
    stock: 0,
    image: null,
    galleryUrls: []
  });

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Check if user came from a vendor store
  const isFromVendorStore = location.pathname.includes('/store/') ||
    (location.state as any)?.fromVendor === true;

  // Get vendor context for vendor-scoped behavior
  const { isVendorContext, vendorId: contextVendorId, vendorSlug } = useVendorContext();

  // Vendor categories for header (only in vendor context)
  const { mainCategories, subcategories } = useVendorCategories(contextVendorId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

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
          // Fallback to direct query with vendor status check
          const { data, error } = await supabase
            .from('products')
            .select(`
              *,
              vendors!inner (
                id,
                status
              )
            `)
            .eq('id', id)
            .eq('vendors.status', 'active') // Only show if vendor is active
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

  // Store reference to original product gallery for fallback
  const [mainProductGallery, setMainProductGallery] = useState<string[]>([]);

  // STRICT URL validation - filters out dirty data like [""], ["null"], short strings
  const isValidImageUrl = (url: unknown): url is string => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
      trimmed.length > 10 && // Must be a real URL, not " " or "http"
      !trimmed.includes('undefined') &&
      !trimmed.includes('null') &&
      (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))
    );
  };

  const handleVariantSelectionChange = useCallback((selection: VariantSelection) => {
    setVariantSelection(selection);

    console.log('🎨 Variant selection changed:', {
      color: selection.color,
      galleryUrls: selection.galleryUrls,
      image: selection.image
    });

    // STRICT filter - only accept valid image URLs
    const validGalleryUrls = (selection.galleryUrls || []).filter(isValidImageUrl);
    const hasValidSingleImage = isValidImageUrl(selection.image);

    console.log('🔍 Validation result:', {
      rawUrls: selection.galleryUrls?.length || 0,
      validUrls: validGalleryUrls.length,
      hasValidSingleImage,
      mainGalleryAvailable: mainProductGallery.length
    });

    // CRITICAL FIX: Only replace gallery if variant has MORE or EQUAL images
    // Otherwise, keep main gallery and just highlight the variant's image
    if (validGalleryUrls.length > 0 && validGalleryUrls.length >= mainProductGallery.length) {
      // Variant has a rich gallery - use it
      console.log('🖼️ Using variant gallery (has more images):', validGalleryUrls);
      setCurrentGallery(validGalleryUrls);
      setGalleryIndex(0);
      setActiveImage(validGalleryUrls[0]);
    } else if (hasValidSingleImage && selection.image) {
      // Variant has image(s) but fewer than main gallery - keep main gallery, just highlight variant image
      console.log('🖼️ Variant has image, keeping main gallery, highlighting variant');
      // Ensure main gallery is shown
      if (mainProductGallery.length > 0 && currentGallery.length < mainProductGallery.length) {
        setCurrentGallery(mainProductGallery);
      }
      // Set variant image as active
      setActiveImage(selection.image);
      // Try to find this image in main gallery
      const idx = mainProductGallery.indexOf(selection.image);
      if (idx >= 0) {
        setGalleryIndex(idx);
      } else {
        setGalleryIndex(0); // Default to first
      }
    } else if (validGalleryUrls.length > 0) {
      // Variant has some gallery images but less than main - still show main, but set first variant image as active
      console.log('🖼️ Variant has fewer images, keeping main gallery');
      if (mainProductGallery.length > 0) {
        setCurrentGallery(mainProductGallery);
      }
      setActiveImage(validGalleryUrls[0]);
    } else {
      // No valid variant images - just ensure main gallery is visible
      console.log('⚠️ No valid variant images, ensuring main gallery');
      if (mainProductGallery.length > 0 && currentGallery.length === 0) {
        setCurrentGallery(mainProductGallery);
        setGalleryIndex(0);
        setActiveImage(mainProductGallery[0]);
      }
      // Don't change anything if main gallery is already showing
    }
  }, [mainProductGallery, currentGallery]);

  // Initialize gallery when product loads
  useEffect(() => {
    if (product) {
      // DEBUG: Log product images data
      console.log('🖼️ Product images debug:', {
        main_image: product.main_image,
        images: product.images,
        images_type: typeof product.images,
        images_length: Array.isArray(product.images) ? product.images.length : 'not array'
      });

      // Combine main_image and images array, removing duplicates
      const allImages: string[] = [];
      if (product.main_image) {
        allImages.push(product.main_image);
      }
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach((img: string) => {
          if (img && !allImages.includes(img)) {
            allImages.push(img);
          }
        });
      }

      console.log('🖼️ Final gallery:', allImages);

      // Filter valid images only (remove null, undefined, empty strings)
      // Use strict validation to filter out dirty data like [""] or ["null"]
      const initialGallery = allImages.filter(isValidImageUrl);

      const finalGallery = initialGallery.length > 0 ? initialGallery : ['/placeholder.svg'];

      // Save main product gallery for fallback when variant has no images
      setMainProductGallery(finalGallery);
      setCurrentGallery(finalGallery);

      if (finalGallery.length > 0) {
        setActiveImage(finalGallery[0]);
        setGalleryIndex(0);
      }

      console.log('✅ Gallery initialized with', finalGallery.length, 'valid images');
    }
  }, [product]);

  // Gallery navigation
  const goToPrevImage = () => {
    if (currentGallery.length <= 1) return;
    const newIndex = galleryIndex === 0 ? currentGallery.length - 1 : galleryIndex - 1;
    setGalleryIndex(newIndex);
    setActiveImage(currentGallery[newIndex]);
  };

  const goToNextImage = () => {
    if (currentGallery.length <= 1) return;
    const newIndex = galleryIndex === currentGallery.length - 1 ? 0 : galleryIndex + 1;
    setGalleryIndex(newIndex);
    setActiveImage(currentGallery[newIndex]);
  };

  const handleImageClick = (imageUrl: string) => {
    setActiveImage(imageUrl);
  };

  // Touch swipe handlers for mobile
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextImage();
    } else if (isRightSwipe) {
      goToPrevImage();
    }
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
        updatedAt: new Date().toISOString(),
        // Critical: Shipping/Logistics fields for cart calculations
        user_id: (product as any).user_id,
        vendor_id: (product as any).vendor_id || vendorId,
        is_free_shipping: (product as any).is_free_shipping || false,
        is_fast_shipping: (product as any).is_fast_shipping || false,
      };

      const cartSize = variantSelection.size || 'متاح';
      const cartColor = variantSelection.color || '';
      const success = await addToCart(productForCart, cartSize, cartColor, quantity, discountedPrice);

      if (success) {
        toast.success(t?.products?.addedToCart || 'Added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(t?.products?.addToCartError || 'Error adding to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const displayStockMessage = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">{t?.products?.outOfStock || 'Out of Stock'}</Badge>;
    } else if (stock === 1) {
      return <Badge variant="destructive">{t?.products?.lastOne || 'Only 1 left!'}</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{(t?.products?.fewLeft || 'Only {count} left').replace('{count}', String(stock))}</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        {isVendorContext && contextVendorId && (
          <VendorStoreHeader
            vendorId={contextVendorId}
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
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        {isVendorContext && contextVendorId && (
          <VendorStoreHeader
            vendorId={contextVendorId}
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
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">المنتج غير موجود</h2>
          <Button onClick={() => isVendorContext && vendorSlug ? navigate(`/store/${vendorSlug}`) : navigate('/')}>
            {isVendorContext ? 'العودة للمتجر' : 'العودة للرئيسية'}
          </Button>
        </div>
      </Layout>
    );
  }


  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      <SEO
        title={product.name}
        description={product.description?.substring(0, 160) || `تسوق ${product.name} بأفضل سعر`}
        image={product.main_image || (product.images && product.images[0]) || undefined}
        type="product"
      />
      {/* Vendor Header (when in vendor context) */}
      {isVendorContext && contextVendorId && (
        <VendorStoreHeader
          vendorId={contextVendorId}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ direction: direction }}>
          {/* Product Images */}
          <div>
            <div
              className="mb-4 border rounded overflow-hidden relative touch-pan-y"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
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

              {/* Navigation Arrows */}
              {currentGallery.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {galleryIndex + 1} / {currentGallery.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery - Filter valid images only */}
            {currentGallery.filter(isValidImageUrl).length > 0 && (
              <div className="flex overflow-x-auto gap-2 pb-2">
                {currentGallery
                  .filter(isValidImageUrl)
                  .map((image, index) => (
                    <div
                      key={`thumb-${index}-${image.slice(-20)}`}
                      className={`border rounded cursor-pointer flex-shrink-0 w-16 h-16 overflow-hidden ${galleryIndex === index ? 'ring-2 ring-primary' : ''
                        }`}
                      onClick={() => {
                        setGalleryIndex(index);
                        setActiveImage(image);
                      }}
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
                discount={product.discount || 0}
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
              ) : !hasVariants && isOutOfStock ? (
                'نفذت الكمية'
              ) : hasVariants && !variantSelection.size ? (
                'يجب اختيار مقاس ولون'
              ) : hasVariants && variantSelection.stock === 0 ? (
                'هذا الخيار غير متاح'
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
              title={t?.products?.similarProducts || "Similar Products"}
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
                title={t?.products?.moreFromStore || "More from this Store"}
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
                showMoreLabel={t?.products?.visitStore || "Visit Store"}
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
    </Layout >
  );
};

export default ProductDetails;
