import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductVariant } from "./useProductVariants";

export const useBulkProductVariants = (productIds: string[]) => {
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productIds.length === 0) {
      setVariantsByProduct({});
      return;
    }

    const fetchAllVariants = async () => {
      setLoading(true);
      try {
        // Fetch all color variants for all products in one query
        const { data: colorVariants, error: colorErr } = await supabase
          .from('product_color_variants')
          .select('*')
          .in('product_id', productIds)
          .order('created_at', { ascending: true });

        if (colorErr) {
          console.warn('Failed loading color variants:', colorErr.message);
        }

        const resultMap: Record<string, ProductVariant[]> = {};

        if (colorVariants && colorVariants.length > 0) {
          // Fetch all variant options in one query
          const variantIds = colorVariants.map(v => v.id);
          const { data: options, error: optErr } = await supabase
            .from('product_color_variant_options')
            .select('color_variant_id, price, stock')
            .in('color_variant_id', variantIds)
            .order('created_at', { ascending: true });

          if (optErr) {
            console.warn('Failed loading color variant options:', optErr.message);
          }

          // Group variants by product_id
          colorVariants.forEach((cv: any) => {
            if (!resultMap[cv.product_id]) {
              resultMap[cv.product_id] = [];
            }

            const myOpts = (options || []).filter(o => o.color_variant_id === cv.id);
            const totalStock = myOpts.reduce((s, o: any) => s + (Number(o.stock) || 0), 0);
            
            resultMap[cv.product_id].push({
              id: cv.id,
              product_id: cv.product_id,
              label: cv.color,
              image_url: cv.image || '',
              hex_code: undefined,
              price_adjustment: 0,
              stock: totalStock,
              is_default: resultMap[cv.product_id].length === 0,
              position: resultMap[cv.product_id].length,
              created_at: cv.created_at,
              updated_at: cv.updated_at,
            });
          });
        }

        // Fallback: fetch legacy product_variants for products that don't have color variants
        const productsWithoutVariants = productIds.filter(id => !resultMap[id]);
        if (productsWithoutVariants.length > 0) {
          const { data: legacyVariants, error: legacyErr } = await supabase
            .from('product_variants')
            .select('*')
            .in('product_id', productsWithoutVariants)
            .order('position', { ascending: true });

          if (!legacyErr && legacyVariants) {
            legacyVariants.forEach((v: any) => {
              if (!resultMap[v.product_id]) {
                resultMap[v.product_id] = [];
              }
              resultMap[v.product_id].push(v);
            });
          }
        }

        setVariantsByProduct(resultMap);
      } catch (err) {
        console.error('Error fetching bulk variants:', err);
        setVariantsByProduct({});
      } finally {
        setLoading(false);
      }
    };

    fetchAllVariants();
  }, [productIds.join(',')]);

  return {
    variantsByProduct,
    loading,
  };
};
