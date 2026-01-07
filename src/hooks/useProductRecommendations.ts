import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SectionProduct } from '@/types/section';
import { useVendorContext } from '@/hooks/useVendorContext';

/**
 * Hook to fetch similar products based on category
 * 
 * VENDOR CONTEXT BEHAVIOR:
 * - In vendor routes: Returns similar products from SAME vendor only
 * - In global routes: Returns similar products from all vendors
 */
export function useSimilarProducts(productId: string | undefined, limit: number = 8) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVendorContext, vendorId } = useVendorContext();

  useEffect(() => {
    // GATE: If vendor context but vendorId not resolved, wait
    if (isVendorContext && !vendorId) {
      setProducts([]);
      setLoading(true);
      return;
    }

    const fetchSimilar = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // First get the product's category
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('category_id, vendor_id')
          .eq('id', productId)
          .maybeSingle();

        if (productError || !product) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Build query for similar products
        let query = supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            discount,
            main_image,
            image_url,
            rating,
            stock,
            inventory,
            vendor_id,
            vendors!inner (
              name,
              logo_url,
              slug
            )
          `)
          .eq('category_id', product.category_id)
          .neq('id', productId)
          .in('status', ['active', 'approved'])
          .limit(limit);

        // IN VENDOR CONTEXT: Only show products from same vendor
        if (isVendorContext && vendorId) {
          query = query.eq('vendor_id', vendorId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching similar products:', error);
          setProducts([]);
          return;
        }

        const mappedProducts: SectionProduct[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          discount: p.discount || null,
          image_url: p.main_image || p.image_url || null,
          rating: p.rating || null,
          stock: p.stock ?? 0,
          inventory: p.inventory ?? 0,
          vendor_name: p.vendors?.name || null,
          vendor_slug: p.vendors?.slug || null,
          vendor_logo_url: p.vendors?.logo_url || null
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.error('Exception fetching similar products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [productId, limit, isVendorContext, vendorId]);

  return { products, loading };
}

/**
 * Hook to fetch more products from the same vendor
 * This is always vendor-scoped (shows products from product's vendor)
 */
export function useMoreFromVendor(productId: string | undefined, productVendorId: string | undefined, limit: number = 8) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMore = async () => {
      if (!productId || !productVendorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Direct query instead of RPC for reliability
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price,
            discount,
            main_image,
            image_url,
            rating,
            stock,
            inventory,
            vendor_id,
            vendors!inner (
              name,
              logo_url,
              slug
            )
          `)
          .eq('vendor_id', productVendorId)
          .neq('id', productId)
          .in('status', ['active', 'approved'])
          .limit(limit);

        if (error) {
          console.error('Error fetching vendor products:', error);
          setProducts([]);
          return;
        }

        const mappedProducts: SectionProduct[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          discount: p.discount || null,
          image_url: p.main_image || p.image_url || null,
          rating: p.rating || null,
          stock: p.stock ?? 0,
          inventory: p.inventory ?? 0,
          vendor_name: p.vendors?.name || null,
          vendor_slug: p.vendors?.slug || null,
          vendor_logo_url: p.vendors?.logo_url || null
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.error('Exception fetching vendor products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMore();
  }, [productId, productVendorId, limit]);

  return { products, loading };
}