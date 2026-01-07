import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionProduct } from '@/types/section';
import { useVendorContext } from '@/hooks/useVendorContext';

export function useSections(scope: 'global' | 'vendor' = 'global', vendorId?: string) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_sections_by_scope', {
            _scope: scope,
            _vendor_id: vendorId || null
          });

        if (error) throw error;

        // Map data to Section type with proper defaults
        const mappedSections: Section[] = (data || []).map((s: any) => ({
          id: s.id,
          title: s.title || '',
          type: s.type || 'manual',
          scope: s.scope || 'global',
          vendor_id: s.vendor_id || null,
          sort_order: s.sort_order || 0,
          is_active: s.is_active ?? true,
          slug: s.slug || null,
          config: s.config || {}
        }));

        setSections(mappedSections);
      } catch (err) {
        console.error('Error fetching sections:', err);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [scope, vendorId]);

  return { sections, loading };
}

export function useSectionProducts(sectionId: string, limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!sectionId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_section_products', {
            _section_id: sectionId,
            _limit: limit
          });

        if (error) throw error;

        // Map to ensure stock/inventory have defaults
        const mappedProducts: SectionProduct[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          discount: p.discount || null,
          image_url: p.image_url || null,
          rating: p.rating || null,
          stock: p.stock ?? 0,
          inventory: p.inventory ?? 0,
          vendor_name: p.vendor_name || null,
          vendor_slug: p.vendor_slug || null,
          vendor_logo_url: p.vendor_logo_url || null
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching section products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sectionId, limit]);

  return { products, loading };
}

/**
 * Fetch best sellers - context-aware
 * - In vendor context: fetch ONLY this vendor's best sellers
 * - In global context: fetch all best sellers
 * - If vendor context but no vendorId: WAIT (return loading)
 */
export function useBestSellers(limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVendorContext, vendorId } = useVendorContext();

  useEffect(() => {
    // GATE: If vendor context but vendorId not resolved, DO NOT FETCH
    if (isVendorContext && !vendorId) {
      setProducts([]);
      setLoading(true);
      return; // WAIT - do nothing
    }

    const fetchProducts = async () => {
      setProducts([]);
      setLoading(true);
      try {
        let mappedProducts: SectionProduct[] = [];

        // Build query - ALWAYS filter by vendorId if in vendor context
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
          .eq('is_best_seller', true)
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(limit);

        // Vendor context: ALWAYS filter by vendorId
        if (isVendorContext && vendorId) {
          query = query.eq('vendor_id', vendorId);
        }

        const { data, error } = await query;

        if (error) throw error;

        mappedProducts = (data || []).map((p: any) => ({
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
        console.error('Error fetching best sellers:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isVendorContext, vendorId, limit]);

  return { products, loading };
}

/**
 * Fetch hot deals - context-aware
 * - In vendor context: fetch ONLY this vendor's hot deals
 * - In global context: fetch all hot deals
 * - If vendor context but no vendorId: WAIT (return loading)
 */
export function useHotDeals(limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVendorContext, vendorId } = useVendorContext();

  useEffect(() => {
    // GATE: If vendor context but vendorId not resolved, DO NOT FETCH
    if (isVendorContext && !vendorId) {
      setProducts([]);
      setLoading(true);
      return; // WAIT - do nothing
    }

    const fetchProducts = async () => {
      setProducts([]);
      setLoading(true);
      try {
        let mappedProducts: SectionProduct[] = [];

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
          .eq('is_hot_deal', true)
          .in('status', ['active', 'approved'])
          .order('created_at', { ascending: false })
          .limit(limit);

        // Vendor context: ALWAYS filter by vendorId
        if (isVendorContext && vendorId) {
          query = query.eq('vendor_id', vendorId);
        }

        const { data, error } = await query;

        if (error) throw error;

        mappedProducts = (data || []).map((p: any) => ({
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
        console.error('Error fetching hot deals:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isVendorContext, vendorId, limit]);

  return { products, loading };
}

/**
 * Fetch last viewed products - context-aware
 * - In vendor context: fetch ONLY this vendor's last viewed products
 * - In global context: fetch all last viewed
 * - If vendor context but no vendorId: WAIT (return loading)
 */
export function useLastViewed(limit: number = 10) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVendorContext, vendorId } = useVendorContext();

  useEffect(() => {
    // GATE: If vendor context but vendorId not resolved, DO NOT FETCH
    if (isVendorContext && !vendorId) {
      setProducts([]);
      setLoading(true);
      return; // WAIT - do nothing
    }

    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_last_viewed_products', {
            _user_id: user.id,
            _limit: limit,
            _vendor_id: isVendorContext && vendorId ? vendorId : null
          });

        if (error) throw error;

        const mappedProducts: SectionProduct[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name || '',
          price: p.price || 0,
          discount: p.discount || null,
          image_url: p.image_url || null,
          rating: p.rating || null,
          stock: p.stock ?? 0,
          inventory: p.inventory ?? 0,
          vendor_name: p.vendor_name || null,
          vendor_slug: p.vendor_slug || null,
          vendor_logo_url: p.vendor_logo_url || null
        }));

        setProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching last viewed:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isVendorContext, vendorId, limit]);

  return { products, loading };
}

/**
 * Fetch category products - context-aware
 * - In vendor context: fetch ONLY this vendor's category products
 * - In global context: fetch all category products
 * - If vendor context but no vendorId: WAIT (return loading)
 */
export function useCategoryProducts(categoryId: string, limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { isVendorContext, vendorId } = useVendorContext();

  useEffect(() => {
    // GATE: If vendor context but vendorId not resolved, DO NOT FETCH
    if (isVendorContext && !vendorId) {
      setProducts([]);
      setLoading(true);
      return; // WAIT - do nothing
    }

    const fetchProducts = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_category_products', {
            _category_id: categoryId,
            _vendor_id: isVendorContext && vendorId ? vendorId : null,
            _limit: limit
          });

        if (error) throw error;
        setProducts((data as SectionProduct[]) || []);
      } catch (err) {
        console.error('Error fetching category products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, isVendorContext, vendorId, limit]);

  return { products, loading };
}

export async function trackProductView(productId: string) {
  try {
    await supabase.rpc('track_product_view', { _product_id: productId });
  } catch (err) {
    console.error('Error tracking product view:', err);
  }
}
