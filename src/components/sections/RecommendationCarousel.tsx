import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionProduct } from '@/types/section';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ChevronLeft, ChevronRight, ShoppingCart, Store, Eye } from 'lucide-react';
import { toast } from 'sonner';
import CartDatabase from '@/models/CartDatabase';
import { useVendorContext } from '@/hooks/useVendorContext';

interface RecommendationCarouselProps {
  title: string;
  products: SectionProduct[];
  loading: boolean;
  icon?: React.ReactNode;
  showMoreLink?: string;
  showMoreAction?: () => void;
  showMoreLabel?: string;
}

const RecommendationCarousel: React.FC<RecommendationCarouselProps> = ({
  title,
  products,
  loading,
  icon,
  showMoreLink,
  showMoreAction,
  showMoreLabel = 'عرض المزيد'
}) => {
  const navigate = useNavigate();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Get vendor context for vendor-scoped navigation
  const { isVendorContext, vendorSlug } = useVendorContext();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleProductClick = (productId: string) => {
    // Use vendor-scoped URL when in vendor context
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}/product/${productId}`);
    } else {
      navigate(`/product/${productId}`);
    }
  };

  const handleVendorClick = (e: React.MouseEvent, slug: string | null) => {
    e.stopPropagation();
    if (slug) {
      navigate(`/store/${slug}`);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: SectionProduct) => {
    e.stopPropagation();
    try {
      const cartDb = CartDatabase.getInstance();

      // CRITICAL: Include ALL shipping-related fields for proper shipping calculation
      const productForCart = {
        id: product.id,
        name: product.name,
        price: product.discount && product.discount > 0
          ? product.price - (product.price * product.discount / 100)
          : product.price,
        mainImage: product.image_url,
        inventory: product.inventory ?? product.stock ?? 1,
        // SHIPPING FIELDS - Required for shipping calculation
        user_id: (product as any).user_id || null,
        vendor_id: (product as any).vendor_id || null,
        is_free_shipping: product.is_free_shipping || false,
      };

      console.log('🛒 RecommendationCarousel adding to cart:', {
        name: productForCart.name,
        user_id: productForCart.user_id,
        vendor_id: productForCart.vendor_id,
        is_free_shipping: productForCart.is_free_shipping
      });

      await cartDb.addToCart(productForCart as any, '', '', 1);
      toast.success('تمت الإضافة إلى السلة');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('فشل في إضافة المنتج');
    }
  };

  // Check stock availability using same logic as ProductCard
  const checkStockAvailability = (product: SectionProduct) => {
    const stockValue = product.stock ?? 0;
    const inventoryValue = product.inventory ?? 0;
    // Product is out of stock if BOTH stock and inventory are <= 0
    return stockValue <= 0 && inventoryValue <= 0;
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[200px] h-64 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {(showMoreLink || showMoreAction) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => showMoreAction ? showMoreAction() : navigate(showMoreLink!)}
              className="text-primary"
            >
              {showMoreLabel}
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          )}
          <div className="hidden md:flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth items-stretch"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const isOutOfStock = checkStockAvailability(product);
          const discountedPrice = product.discount && product.discount > 0
            ? product.price - (product.price * product.discount / 100)
            : product.price;

          return (
            <Card
              key={product.id}
              className="min-w-[180px] max-w-[180px] min-h-[340px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow group flex flex-col"
              onClick={() => handleProductClick(product.id)}
            >
              <CardHeader className="p-0 relative">
                <AspectRatio ratio={1} className="bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={product.image_url || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </AspectRatio>

                {product.discount && product.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-destructive text-white px-2 py-1 rounded-full text-xs font-bold">
                    -{product.discount}%
                  </div>
                )}

                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                    <span className="text-white font-bold">غير متوفر</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-3 pb-2 flex-grow flex flex-col">
                {/* Title - Fixed 2-line height */}
                <h4 className="font-medium text-sm line-clamp-2 mb-1 min-h-[40px] group-hover:text-primary transition-colors">
                  {product.name}
                </h4>

                {/* Vendor - Fixed height container */}
                <div className="min-h-[24px]">
                  {product.vendor_name && product.vendor_slug && (
                    <button
                      onClick={(e) => handleVendorClick(e, product.vendor_slug)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Store className="w-3 h-3" />
                      <span>{product.vendor_name}</span>
                    </button>
                  )}
                </div>
              </CardContent>

              {/* Price + Button anchored to bottom together */}
              <CardFooter className="p-3 pt-0 mt-auto flex flex-col gap-2">
                {/* Price */}
                <div className="flex items-center gap-2 w-full">
                  <span className="text-primary font-bold">{discountedPrice.toFixed(0)} ج.م</span>
                  {product.discount && product.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      {product.price.toFixed(0)} ج.م
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => handleAddToCart(e, product)}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  {isOutOfStock ? 'غير متوفر' : 'أضف للسلة'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationCarousel;