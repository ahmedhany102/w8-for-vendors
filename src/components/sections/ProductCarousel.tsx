import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, Flame, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionProduct } from '@/types/section';
import { toast } from 'sonner';
import CartDatabase from '@/models/CartDatabase';

interface ProductCarouselProps {
  title: string;
  products: SectionProduct[];
  loading?: boolean;
  showMoreLink?: string;
  variant?: 'default' | 'hot_deals' | 'best_seller';
  icon?: React.ReactNode;
  backgroundColor?: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  products,
  loading = false,
  showMoreLink,
  variant = 'default',
  icon,
  backgroundColor
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
    navigate(`/product/${productId}`);
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
      const productForCart = {
        id: product.id,
        name: product.name,
        price: product.discount 
          ? product.price - (product.price * product.discount / 100)
          : product.price,
        mainImage: product.image_url,
        inventory: 1
      };
      await cartDb.addToCart(productForCart as any, '', '', 1);
      toast.success('تم إضافة المنتج إلى السلة');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('فشل في إضافة المنتج');
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-40" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="min-w-[180px] h-64 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  const getVariantStyles = () => {
    // If a custom background color is provided, use it
    if (backgroundColor) {
      return {
        headerBg: '',
        headerStyle: { backgroundColor },
        headerText: 'text-white',
        badge: 'bg-primary text-primary-foreground'
      };
    }
    
    switch (variant) {
      case 'hot_deals':
        return {
          headerBg: 'bg-gradient-to-r from-red-500 to-orange-500',
          headerStyle: {},
          headerText: 'text-white',
          badge: 'bg-red-500 text-white'
        };
      case 'best_seller':
        return {
          headerBg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
          headerStyle: {},
          headerText: 'text-white',
          badge: 'bg-amber-500 text-white'
        };
      default:
        return {
          headerBg: 'bg-transparent',
          headerStyle: {},
          headerText: 'text-foreground',
          badge: 'bg-primary text-primary-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="mb-8">
      <div 
        className={`flex items-center justify-between mb-4 p-3 rounded-lg ${styles.headerBg}`}
        style={styles.headerStyle}
      >
        <div className={`flex items-center gap-2 ${styles.headerText}`}>
          {icon}
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {showMoreLink && (
            <Button
              variant={variant === 'default' ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => navigate(showMoreLink)}
              className="flex items-center gap-1"
            >
              عرض المزيد
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="hidden md:flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${variant !== 'default' ? 'text-white hover:bg-white/20' : ''}`}
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${variant !== 'default' ? 'text-white hover:bg-white/20' : ''}`}
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {products.map((product) => {
          const finalPrice = product.discount
            ? product.price - (product.price * product.discount / 100)
            : product.price;

          // Check stock availability using SAME logic as ProductCard/ProductDetails
          const checkStockAvailability = () => {
            const stockValue = (product as any).stock ?? 0;
            const inventoryValue = (product as any).inventory ?? 0;
            // Product is out of stock if BOTH stock and inventory are <= 0
            return stockValue <= 0 && inventoryValue <= 0;
          };
          const isOutOfStock = checkStockAvailability();

          return (
            <Card
              key={product.id}
              className="min-w-[180px] max-w-[180px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow group"
              style={{ scrollSnapAlign: 'start' }}
              onClick={() => handleProductClick(product.id)}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-muted overflow-hidden rounded-t-lg">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name || 'Product'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}

                {/* Discount Badge */}
                {product.discount && product.discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
                    {product.discount}% خصم
                  </Badge>
                )}

                {/* Best Seller Badge */}
                {variant === 'best_seller' && (
                  <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-xs flex items-center gap-1">
                    <Star className="w-3 h-3" fill="currentColor" />
                    الأكثر مبيعاً
                  </Badge>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold">غير متوفر</span>
                  </div>
                )}
              </div>

              <CardContent className="p-3">
                {/* Product Name */}
                <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[40px]">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground">
                      {product.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-primary">
                    {finalPrice.toFixed(0)} ج.م
                  </span>
                  {product.discount && product.discount > 0 && (
                    <span className="text-xs text-muted-foreground line-through">
                      {product.price.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Vendor */}
                {product.vendor_name && (
                  <button
                    onClick={(e) => handleVendorClick(e, product.vendor_slug)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    بواسطة: {product.vendor_name}
                  </button>
                )}
              </CardContent>
              
              <CardFooter className="p-3 pt-0">
                <Button
                  onClick={(e) => handleAddToCart(e, product)}
                  className={`w-full text-sm ${isOutOfStock ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                  size="sm"
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
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

export default ProductCarousel;
