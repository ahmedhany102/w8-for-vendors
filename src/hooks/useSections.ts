import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionProduct } from '@/types/section';

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

export function useBestSellers(vendorId?: string, limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_best_seller_products', {
            _limit: limit,
            _vendor_id: vendorId || null
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
        console.error('Error fetching best sellers:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendorId, limit]);

  return { products, loading };
}

export function useHotDeals(vendorId?: string, limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_hot_deals_products', {
            _vendor_id: vendorId || null,
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
        console.error('Error fetching hot deals:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendorId, limit]);

  return { products, loading };
}

export function useLastViewed(vendorId?: string, limit: number = 10) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use the RPC function which now includes stock/inventory
        const { data, error } = await supabase
          .rpc('get_last_viewed_products', {
            _user_id: user.id,
            _limit: limit,
            _vendor_id: vendorId || null
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
        console.error('Error fetching last viewed:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [vendorId, limit]);

  return { products, loading };
}

export function useCategoryProducts(categoryId: string, vendorId?: string, limit: number = 12) {
  const [products, setProducts] = useState<SectionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            _vendor_id: vendorId || null,
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
  }, [categoryId, vendorId, limit]);

  return { products, loading };
}

export async function trackProductView(productId: string) {
  try {
    await supabase.rpc('track_product_view', { _product_id: productId });
  } catch (err) {
    console.error('Error tracking product view:', err);
  }
}
