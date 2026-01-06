import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  status: string;
  product_count?: number;
  description?: string;
  owner_id?: string;
}

export const useVendors = (searchQuery?: string) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, [searchQuery]);

  const fetchVendors = async () => {
    try {
      setLoading(true);

      // Use get_active_vendors RPC which returns vendors with product counts
      const { data, error } = await supabase.rpc('get_active_vendors');

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter if provided
      if (searchQuery) {
        filteredData = filteredData.filter((v: any) =>
          v.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Map to Vendor interface
      const mappedVendors: Vendor[] = filteredData.map((v: any) => ({
        id: v.id,
        name: v.name,
        slug: v.slug,
        logo_url: v.logo_url,
        cover_url: v.cover_url,
        status: v.status,
        product_count: v.product_count || 0
      }));

      setVendors(mappedVendors);
    } catch (err: any) {
      console.error('Error fetching vendors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { vendors, loading, error, refetch: fetchVendors };
};

// Fetch vendor by slug (SEO-friendly URL)
export const useVendorBySlug = (slug: string | undefined) => {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    fetchVendor();
  }, [slug]);

  const fetchVendor = async () => {
    if (!slug) return;
    try {
      setLoading(true);

      // Try to find by slug in vendors table
      let { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      // If not found by slug, try by id (backwards compatibility)
      if (!data && !error) {
        const { data: dataById, error: errorById } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', slug)
          .eq('status', 'active')
          .maybeSingle();

        data = dataById;
        error = errorById;
      }

      if (error) throw error;

      if (!data) {
        setVendor(null);
        return;
      }

      // Fetch vendor_profiles to get logo/cover images (they're stored there)
      const { data: profileData } = await supabase
        .from('vendor_profiles')
        .select('logo_url, cover_url')
        .eq('user_id', data.owner_id)
        .maybeSingle();

      // Map to Vendor interface, prioritizing vendor_profiles images
      const mappedVendor: Vendor = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo_url: profileData?.logo_url || data.logo_url,
        cover_url: profileData?.cover_url || data.cover_url,
        status: data.status,
        description: data.description,
        owner_id: data.owner_id
      };

      setVendor(mappedVendor);
    } catch (err: any) {
      console.error('Error fetching vendor:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { vendor, loading, error };
};

// Fetch products for a specific vendor
export const useVendorProducts = (vendorId: string | undefined, categoryId?: string | null, searchQuery?: string) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetchProducts();
  }, [vendorId, categoryId, searchQuery]);

  const fetchProducts = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);

      let query = supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .in('status', ['active', 'approved']);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (searchQuery?.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching vendor products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};

// Fetch categories that a vendor has products in
export const useVendorCategories = (vendorId: string | undefined) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    fetchCategories();
  }, [vendorId]);

  const fetchCategories = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);

      // Get distinct category_ids from vendor's products
      const { data: products, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('vendor_id', vendorId)
        .in('status', ['active', 'approved'])
        .not('category_id', 'is', null);

      if (error) throw error;

      const categoryIds = [...new Set(products?.map(p => p.category_id).filter(Boolean))];

      if (categoryIds.length === 0) {
        setCategories([]);
        return;
      }

      // Get the categories and their parents
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (catError) throw catError;

      // Filter to only categories that vendor has products in (or their parents)
      const vendorCategoryIds = new Set(categoryIds);
      const parentIds = new Set<string>();

      // Find parent IDs for vendor's categories
      (categoriesData || []).forEach(cat => {
        if (vendorCategoryIds.has(cat.id) && cat.parent_id) {
          parentIds.add(cat.parent_id);
        }
      });

      // Include both vendor's categories and their parents
      const relevantCategories = (categoriesData || []).filter(cat =>
        vendorCategoryIds.has(cat.id) || parentIds.has(cat.id)
      );

      setCategories(relevantCategories);
    } catch (err: any) {
      console.error('Error fetching vendor categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter to root categories only (no parent)
  const mainCategories = categories.filter(c => {
    const hasNoParent = !c.parent_id || c.parent_id === null;
    return hasNoParent;
  });

  // Get subcategories for a given parent
  const subcategories = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId);

  return { categories, mainCategories, subcategories, loading };
};
