import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string; // color name
  image_url: string; // the product image for this color
  hex_code?: string; // optional hex color code
  price_adjustment: number; // price adjustment from base price
  stock: number;
  is_default: boolean;
  position: number;
  created_at?: string;
  updated_at?: string;
}

export const useProductVariants = (productId: string) => {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      // First try the new color-variant schema (product_color_variants + options)
      const { data: colorVariants, error: colorErr } = await supabase
        .from('product_color_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (colorErr) {
        console.warn('Failed loading color variants, will fallback:', colorErr.message);
      }

      if (colorVariants && colorVariants.length > 0) {
        const variantIds = colorVariants.map(v => v.id);
        const { data: options, error: optErr } = await supabase
          .from('product_color_variant_options')
          .select('color_variant_id, price, stock')
          .in('color_variant_id', variantIds)
          .order('created_at', { ascending: true });

        if (optErr) {
          console.warn('Failed loading color variant options:', optErr.message);
        }

        const mapped: ProductVariant[] = colorVariants.map((cv: any, idx: number) => {
          const myOpts = (options || []).filter(o => o.color_variant_id === cv.id);
          const totalStock = myOpts.reduce((s, o: any) => s + (Number(o.stock) || 0), 0);
          return {
            id: cv.id,
            product_id: productId,
            label: cv.color,
            image_url: cv.image || '',
            hex_code: undefined,
            price_adjustment: 0, // base price handled in UI; per-size pricing not adjusted here
            stock: totalStock,
            is_default: idx === 0,
            position: idx,
            created_at: cv.created_at,
            updated_at: cv.updated_at,
          } as ProductVariant;
        });

        setVariants(mapped);
        return; // Do not fallback if we have new schema data
      }

      // Fallback to legacy product_variants table
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('position', { ascending: true });

      if (error) {
        toast.error('Failed to load product variants: ' + error.message);
        setVariants([]);
      } else {
        setVariants(data || []);
      }
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const addVariant = async (variant: { 
    label: string; 
    image_url: string; 
    hex_code?: string;
    price_adjustment?: number;
    stock?: number;
    is_default?: boolean;
    position?: number;
  }) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          ...variant,
          price_adjustment: variant.price_adjustment || 0,
          stock: variant.stock || 0,
          position: variant.position || 0
        });

      if (error) {
        toast.error("Failed to add variant: " + error.message);
        return false;
      }

      await fetchVariants();
      return true;
    } catch (err) {
      console.error("Error adding variant:", err);
      toast.error("Failed to add variant");
      return false;
    }
  };

  const updateVariant = async (id: string, updates: Partial<ProductVariant>) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", id);

      if (error) {
        toast.error("Failed to update variant: " + error.message);
        return false;
      }

      await fetchVariants();
      return true;
    } catch (err) {
      console.error("Error updating variant:", err);
      toast.error("Failed to update variant");
      return false;
    }
  };

  const deleteVariant = async (id: string) => {
    try {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Failed to delete variant: " + error.message);
        return false;
      }

      await fetchVariants();
      return true;
    } catch (err) {
      console.error("Error deleting variant:", err);
      toast.error("Failed to delete variant");
      return false;
    }
  };

  return {
    variants,
    loading,
    fetchVariants,
    addVariant,
    updateVariant,
    deleteVariant,
  };
};