import React, { useState, useEffect, useMemo } from 'react';
import { useProductVariantsWithOptions, ColorVariantWithOptions, VariantOption } from '@/hooks/useProductVariantsWithOptions';
import { Badge } from '@/components/ui/badge';

interface ProductVariantSelectorV2Props {
  productId: string;
  basePrice: number;
  onSelectionChange: (selection: {
    colorVariantId: string | null;
    color: string | null;
    size: string | null;
    price: number;
    stock: number;
    image: string | null;
  }) => void;
}

export const ProductVariantSelectorV2: React.FC<ProductVariantSelectorV2Props> = ({
  productId,
  basePrice,
  onSelectionChange
}) => {
  const { variants, loading } = useProductVariantsWithOptions(productId);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Get selected color variant
  const selectedColorVariant = useMemo(() => {
    return variants.find(v => v.color_variant_id === selectedColorId) || null;
  }, [variants, selectedColorId]);

  // Get available sizes for selected color
  const availableSizes = useMemo(() => {
    if (!selectedColorVariant) return [];
    return selectedColorVariant.options.filter(opt => opt.size);
  }, [selectedColorVariant]);

  // Get selected option (size)
  const selectedOption = useMemo(() => {
    if (!selectedColorVariant || !selectedSize) return null;
    return selectedColorVariant.options.find(opt => opt.size === selectedSize) || null;
  }, [selectedColorVariant, selectedSize]);

  // Auto-select first color variant when loaded
  useEffect(() => {
    if (variants.length > 0 && !selectedColorId) {
      const firstWithStock = variants.find(v => 
        v.options.some(opt => (opt.stock || 0) > 0)
      ) || variants[0];
      setSelectedColorId(firstWithStock.color_variant_id);
    }
  }, [variants, selectedColorId]);

  // Reset size when color changes
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColorId]);

  // Notify parent of selection changes
  useEffect(() => {
    const price = selectedOption?.price || basePrice;
    const stock = selectedOption?.stock || 0;
    const image = selectedColorVariant?.image || null;

    onSelectionChange({
      colorVariantId: selectedColorId,
      color: selectedColorVariant?.color || null,
      size: selectedSize,
      price,
      stock,
      image
    });
  }, [selectedColorId, selectedSize, selectedOption, selectedColorVariant, basePrice, onSelectionChange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return null;
  }

  const getTotalStockForColor = (variant: ColorVariantWithOptions) => {
    return variant.options.reduce((sum, opt) => sum + (opt.stock || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Color Selector */}
      <div>
        <h3 className="text-sm font-medium mb-3">اللون:</h3>
        <div className="flex flex-wrap gap-3">
          {variants.map((variant) => {
            const totalStock = getTotalStockForColor(variant);
            const isOutOfStock = totalStock === 0;
            const isSelected = selectedColorId === variant.color_variant_id;

            return (
              <button
                key={variant.color_variant_id}
                onClick={() => setSelectedColorId(variant.color_variant_id)}
                className={`relative group flex flex-col items-center ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-2'
                    : 'ring-1 ring-border hover:ring-2 hover:ring-primary/50'
                } rounded-lg p-1 transition-all`}
                disabled={isOutOfStock}
              >
                <div className="w-16 h-16 rounded-md overflow-hidden">
                  {variant.image ? (
                    <img
                      src={variant.image}
                      alt={variant.color}
                      className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
                    />
                  ) : (
                    <div className={`w-full h-full bg-muted flex items-center justify-center ${isOutOfStock ? 'opacity-50' : ''}`}>
                      <span className="text-xs text-muted-foreground">{variant.color}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{variant.color}</span>
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <span className="text-white text-xs font-bold">نفذ</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selector */}
      {selectedColorVariant && availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">المقاس:</h3>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((option) => {
              const isOutOfStock = (option.stock || 0) === 0;
              const isSelected = selectedSize === option.size;
              const isLowStock = (option.stock || 0) > 0 && (option.stock || 0) <= 3;

              return (
                <button
                  key={option.option_id}
                  onClick={() => !isOutOfStock && setSelectedSize(option.size)}
                  disabled={isOutOfStock}
                  className={`relative px-4 py-2 rounded-md border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isOutOfStock
                      ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed'
                      : 'bg-background hover:bg-accent border-border'
                  }`}
                >
                  <span className="font-medium">{option.size}</span>
                  {isOutOfStock && (
                    <span className="block text-[10px]">نفذ</span>
                  )}
                  {isLowStock && !isOutOfStock && (
                    <span className="block text-[10px] text-destructive">
                      بقي {option.stock}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Variant Info */}
      {selectedColorVariant && selectedOption && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedColorVariant.color} - {selectedOption.size}
              </p>
              <p className="text-lg font-bold text-primary">
                {selectedOption.price} جنيه
              </p>
            </div>
            <div>
              {(selectedOption.stock || 0) > 0 ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  متوفر ({selectedOption.stock})
                </Badge>
              ) : (
                <Badge variant="destructive">نفذ المخزون</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning if no size selected */}
      {selectedColorVariant && availableSizes.length > 0 && !selectedSize && (
        <p className="text-sm text-muted-foreground">
          يرجى اختيار المقاس
        </p>
      )}
    </div>
  );
};
