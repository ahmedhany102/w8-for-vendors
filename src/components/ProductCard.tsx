
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from '@/models/Product';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Store, Star, Truck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import CartDatabase from "@/models/CartDatabase";
import { ProductVariant } from '@/hooks/useProductVariants';
import { useFavorites } from '@/hooks/useFavorites';
import { useVendorContext } from '@/hooks/useVendorContext';

// 🔴 Image optimization helper to reduce Supabase egress
const getOptimizedUrl = (
  url: string | null | undefined,
  width: number = 400
): string => {
  if (!url) return "/placeholder.svg";
  // External images remain untouched
  if (!url.includes('supabase.co')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=80&resize=cover`;
};

interface ProductCardProps {
  product: Product & {
    vendor_name?: string;
    vendor_slug?: string;
    vendor_logo_url?: string;
  };
  onAddToCart?: (product: Product, size: string, quantity?: number) => void;
  className?: string;
  variants?: ProductVariant[];
}

const ProductCard = ({ product, className = '', variants = [] }: ProductCardProps) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Get vendor context for vendor-scoped navigation
  const { isVendorContext, vendorSlug } = useVendorContext();

  useEffect(() => {
    if (variants.length > 0) {
      const defaultVariant = variants.find(v => v.is_default) || variants[0];
      setSelectedVariant(defaultVariant);
    }
  }, [variants]);

  if (!product || typeof product !== "object") {
    console.warn('⚠️ Invalid product passed to ProductCard:', product);
    return null;
  }

  // Use variant image if available, otherwise fallback to product main image
  const mainImage = selectedVariant?.image_url ||
    (product.mainImage && product.mainImage !== "" ? product.mainImage : null) ||
    (product.main_image && product.main_image !== "" ? product.main_image : null) ||
    (product.image_url && product.image_url !== "" ? product.image_url : null) ||
    (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
    "/placeholder.svg";

  // Check if product is out of stock - Fix availability logic
  // Priority: variants > sizes > direct stock/inventory fields
  const checkStockAvailability = () => {
    // If variants exist, check variant stock
    if (variants.length > 0) {
      return variants.every(v => v.stock <= 0);
    }
    // If sizes exist, check size stock
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      return product.sizes.every(s => !s || s.stock <= 0);
    }
    // Check direct stock and inventory fields (support both naming conventions)
    const stockValue = product.stock ?? (product as any).stock ?? 0;
    const inventoryValue = product.inventory ?? (product as any).inventory ?? 0;
    // Product is in stock if either stock or inventory > 0
    return stockValue <= 0 && inventoryValue <= 0;
  };
  const isOutOfStock = checkStockAvailability();

  // Calculate price (base price + variant adjustment)
  const basePrice = product.price || 0;
  const variantAdjustedPrice = selectedVariant
    ? basePrice + (selectedVariant.price_adjustment || 0)
    : (Array.isArray(product.sizes) && product.sizes.length > 0
      ? Math.min(...product.sizes.filter(s => s && s.stock > 0).map(s => s.price || basePrice))
      : basePrice);

  // Original price is the base price before discount
  const originalPrice = variantAdjustedPrice;

  // Apply discount if available (discount is a percentage)
  const discountPercent = Number(product.discount) || 0;
  const finalPrice = discountPercent > 0
    ? variantAdjustedPrice - (variantAdjustedPrice * discountPercent / 100)
    : variantAdjustedPrice;

  // Quick add to cart handler with enhanced error handling
  const handleQuickAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error("المنتج غير متوفر حالياً");
      return;
    }

    try {
      // For products with variants
      if (selectedVariant) {
        const productForCart = {
          ...product,
          price: finalPrice,
          mainImage: selectedVariant.image_url,
          inventory: selectedVariant.stock
        };

        const cartDb = CartDatabase.getInstance();
        await cartDb.addToCart(productForCart, 'متاح', selectedVariant.label, 1);
      } else {
        // Legacy system for products without variants
        let size = "";
        let color = "";

        const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
        if (productSizes.length > 0) {
          const availableSize = productSizes.find(s => s && s.stock > 0);
          if (availableSize) {
            size = availableSize.size;
          }
        }

        if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
          color = product.colors[0];
        }

        const cartDb = CartDatabase.getInstance();
        await cartDb.addToCart(product, size, color, 1);
      }

      toast.success("تم إضافة المنتج إلى السلة");
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("فشل في إضافة المنتج إلى السلة");
    }
  };

  // Handle product click to view details
  // Uses vendor-scoped URL when in vendor context
  const handleProductClick = () => {
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}/product/${product.id}`);
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    await toggleFavorite(product.id);
  };

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-300 border-gray-200 flex flex-col h-full ${className}`}
      onClick={handleProductClick}
      style={{ minHeight: '380px' }}
    >
      <CardHeader className="p-0 pb-2 relative">
        <AspectRatio ratio={1} className="bg-gray-100 rounded-t-lg overflow-hidden">
          <img
            src={getOptimizedUrl(mainImage, 300)}
            alt={product.name}
            width="300"
            height="300"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </AspectRatio>

        {/* Favorites button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 bg-white/90 hover:bg-white z-10 h-8 w-8"
          onClick={handleToggleFavorite}
        >
          <Heart
            className={`h-4 w-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </Button>

        {/* Discount badge - show if discount exists and > 0 */}
        {Number(product.discount || 0) > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
            {product.discount}% خصم
          </div>
        )}

        {/* Rating Badge - Top Left of Image */}
        {(product.average_rating ?? 0) > 0 && (
          <div className="absolute top-2 left-10 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 z-10">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{(product.average_rating ?? 0).toFixed(1)}</span>
            <span className="text-white/70">({product.reviews_count ?? 0})</span>
          </div>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg z-20">
            <span className="text-white font-bold text-lg">غير متوفر</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-3 pb-2 flex-grow">
        <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Vendor link */}
        {product.vendor_name && product.vendor_slug && (
          <Link
            to={`/store/${product.vendor_slug}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
          >
            <Store className="w-3 h-3" />
            <span>بواسطة: {product.vendor_name}</span>
          </Link>
        )}

        {/* Shipping Badges - Fixed height container */}
        <div className="min-h-[22px] mb-1">
          {product.is_free_shipping && (
            <div className="flex items-center gap-1 text-xs text-primary font-medium">
              <Truck className="w-3 h-3" />
              <span>شحن مجاني</span>
            </div>
          )}
          {product.is_fast_shipping && (
            <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <Zap className="w-3 h-3" />
              <span>شحن سريع</span>
            </div>
          )}
        </div>

        {/* Color Variants */}
        {variants.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-muted-foreground">الألوان:</span>
            <div className="flex gap-1">
              {variants.slice(0, 4).map((variant) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(variant);
                  }}
                  className={`w-4 h-4 rounded-full border-2 ${selectedVariant?.id === variant.id
                    ? 'border-primary shadow-md'
                    : 'border-gray-300'
                    }`}
                  style={{
                    backgroundImage: `url(${variant.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  title={variant.label}
                />
              ))}
              {variants.length > 4 && (
                <span className="text-xs text-muted-foreground">+{variants.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {/* Legacy Available colors (for backward compatibility) */}
        {variants.length === 0 && product.colors && Array.isArray(product.colors) && product.colors.length > 1 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-muted-foreground">الألوان:</span>
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-muted-foreground">+{product.colors.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Available sizes (only show for legacy products without variants) */}
        {variants.length === 0 && Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs text-muted-foreground">المقاسات:</span>
            <div className="flex gap-1 flex-wrap">
              {product.sizes.slice(0, 4).map((sizeInfo, index) => (
                <span
                  key={index}
                  className={`text-xs px-1 py-0.5 rounded border ${sizeInfo.stock > 0
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-muted border-border text-muted-foreground'
                    }`}
                >
                  {sizeInfo.size}
                </span>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-xs text-muted-foreground">+{product.sizes.length - 4}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Price + Button anchored to bottom together */}
      <CardFooter className="p-3 pt-0 mt-auto flex flex-col gap-2">
        {/* Price section */}
        <div className="flex items-center gap-2 w-full">
          <span className="text-lg font-bold text-primary">
            {finalPrice.toFixed(0)} جنيه
          </span>
          {discountPercent > 0 && originalPrice > finalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {originalPrice.toFixed(0)} جنيه
            </span>
          )}
        </div>

        <Button
          onClick={handleQuickAddToCart}
          disabled={isOutOfStock}
          className={`w-full text-sm ${isOutOfStock
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isOutOfStock ? 'غير متوفر' : 'أضف للسلة'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
