import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VariantOption {
  option_id: string | null;
  size: string | null;
  price: number | null;
  stock: number | null;
}

export interface ColorVariantWithOptions {
  color_variant_id: string;
  color: string;
  image: string | null;
  options: VariantOption[];
}

export const useProductVariantsWithOptions = (productId: string) => {
  const [variants, setVariants] = useState<ColorVariantWithOptions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVariants = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_product_variant_options', {
        p_product_id: productId
      });

      if (error) {
        console.error('Error fetching product variants:', error);
        setVariants([]);
        return;
      }

      // Group by color_variant_id
      const variantMap = new Map<string, ColorVariantWithOptions>();
      
      for (const row of (data || [])) {
        const variantId = row.color_variant_id;
        
        if (!variantMap.has(variantId)) {
          variantMap.set(variantId, {
            color_variant_id: variantId,
            color: row.color,
            image: row.image,
            options: []
          });
        }
        
        // Add option if it exists
        if (row.option_id) {
          variantMap.get(variantId)!.options.push({
            option_id: row.option_id,
            size: row.size,
            price: row.price,
            stock: row.stock
          });
        }
      }

      setVariants(Array.from(variantMap.values()));
    } catch (err) {
      console.error('Error in fetchVariants:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  return {
    variants,
    loading,
    refetch: fetchVariants
  };
};
