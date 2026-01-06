import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingFallback } from '@/utils/loadingFallback';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  main_image?: string;
  image_url?: string;
  images?: string[];
  colors?: string[];
  sizes?: Array<{ size: string; stock: number; price?: number }>;
  discount?: number;
  featured?: boolean;
  stock?: number;
  inventory?: number;
  user_id?: string;
  [key: string]: any;
}

export const useSupabaseProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      LoadingFallback.startTimeout('product-fetch', 5000, () => {
        setLoading(false);
        setProducts([]);
      });
      
      console.log('🔄 Fetching products with vendor info...');
      
      // Use RPC to get products with vendor info, filtering to only approved products
      const { data, error } = await supabase.rpc('get_products_with_vendor', {
        _category_id: null,
        _search_query: null,
        _limit: 1000
      });
      
      LoadingFallback.clearTimeout('product-fetch');
      
      if (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Failed to load products: ' + error.message);
        setProducts([]);
        return;
      }
      
      console.log('✅ Raw products fetched:', data?.length || 0);
      
      const cleanedProducts = (data || []).map(product => {
        let cleanImages: string[] = [];
        if (product.images) {
          if (Array.isArray(product.images)) {
            cleanImages = (product.images as unknown as string[]).filter(Boolean);
          } else if (typeof product.images === 'string') {
            try {
              const parsed = JSON.parse(product.images);
              cleanImages = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
              console.warn('Failed to parse images JSON:', product.images);
              cleanImages = [];
            }
          }
        }
        
        let cleanColors: string[] = [];
        if (product.colors) {
          if (Array.isArray(product.colors)) {
            cleanColors = (product.colors as unknown as string[]).filter(Boolean);
          } else if (typeof product.colors === 'string') {
            try {
              const parsed = JSON.parse(product.colors);
              cleanColors = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (e) {
              console.warn('Failed to parse colors JSON:', product.colors);
              cleanColors = [];
            }
          }
        }
        
        let cleanSizes: Array<{ size: string; stock: number; price?: number }> = [];
        if (product.sizes) {
          if (Array.isArray(product.sizes)) {
            cleanSizes = (product.sizes as unknown as any[])
              .filter(size => size && typeof size === 'object' && size.size)
              .map(size => ({
                size: String(size.size).trim(),
                stock: Number(size.stock) || 0,
                price: Number(size.price) || Number(product.price) || 0
              }));
          } else if (typeof product.sizes === 'string') {
            try {
              const parsed = JSON.parse(product.sizes);
              if (Array.isArray(parsed)) {
                cleanSizes = parsed
                  .filter(size => size && typeof size === 'object' && size.size)
                  .map(size => ({
                    size: String(size.size).trim(),
                    stock: Number(size.stock) || 0,
                    price: Number(size.price) || Number(product.price) || 0
                  }));
              }
            } catch (e) {
              console.warn('Failed to parse sizes JSON:', product.sizes);
              cleanSizes = [];
            }
          }
        }

        console.log('📦 Product:', product.name, 'Category ID:', product.category_id);

        return {
          ...product,
          images: cleanImages,
          colors: cleanColors,
          sizes: cleanSizes,
          price: Number(product.price) || 0,
          discount: Number(product.discount) || 0,
          stock: Number(product.stock) || 0,
          inventory: Number(product.inventory) || 0,
          category_id: product.category_id,
          // Include vendor info from RPC
          vendor_name: product.vendor_name || null,
          vendor_slug: product.vendor_slug || null,
          vendor_logo_url: product.vendor_logo_url || null
        };
      });
      
      console.log('✅ Cleaned products:', cleanedProducts.length);
      console.log('📊 Sample product structure:', cleanedProducts[0]);

      // === FIX: Use cleanedProducts to ensure type correctness ===
      setProducts(cleanedProducts);

    } catch (error: any) {
      LoadingFallback.clearTimeout('product-fetch');
      console.error('💥 Exception while fetching products:', error);
      toast.error('Failed to load products: ' + error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: any) => {
    try {
      console.log('🆕 Adding product with data:', productData);
      console.log('🎯 CRITICAL - Category ID being saved:', productData.category_id);
      
      // CRITICAL: Validate category_id before saving
      if (!productData.category_id || productData.category_id === "" || productData.category_id === "placeholder") {
        console.error('❌ Invalid category_id provided:', productData.category_id);
        toast.error('Please select a valid category');
        return false;
      }
      
      // FIXED: Ensure category_id is properly set and all required fields are included
      const cleanProductData = {
        name: productData.name?.trim() || '',
        description: productData.description?.trim() || '',
        price: Number(productData.price) || 0,
        category_id: productData.category_id, // CRITICAL: Must be included
        main_image: productData.main_image || productData.image_url || '',
        image_url: productData.main_image || productData.image_url || '',
        // FIXED: Properly separate main image from additional images
        images: Array.isArray(productData.images) ? productData.images.filter(Boolean) : [],
        colors: Array.isArray(productData.colors) ? productData.colors.filter(Boolean) : [],
        sizes: Array.isArray(productData.sizes) ? productData.sizes.filter(size => size?.size) : [],
        discount: Number(productData.discount) || 0,
        stock: Number(productData.stock) || Number(productData.inventory) || 0,
        inventory: Number(productData.inventory) || Number(productData.stock) || 0,
        featured: Boolean(productData.featured) || false
      };
      
      // CRITICAL: Remove any undefined values to prevent DB errors
      Object.keys(cleanProductData).forEach(key => {
        if (cleanProductData[key] === undefined) {
          delete cleanProductData[key];
        }
      });
      
      console.log('📤 Final data being sent to DB (fixed category_id):', cleanProductData);
      
      const { data, error } = await supabase
        .from('products')
        .insert([cleanProductData])
        .select('*')
        .single();
      
      if (error) {
        console.error('❌ Error adding product:', error);
        toast.error('Failed to add product: ' + error.message);
        return { success: false, error };
      }
      
      console.log('✅ Product added successfully with category_id:', data.category_id);
      console.log('🆔 New product ID:', data.id);
      
      // Store the product ID for variant saving
      const productId = data.id;
      
      toast.success('Product added successfully!');
      
      await fetchProducts();
      
      // Return the product data including the ID for variant saving
      return { success: true, id: productId, data };
    } catch (error: any) {
      console.error('💥 Exception adding product:', error);
      toast.error('Failed to add product: ' + error.message);
      return { success: false, error };
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    try {
      console.log('✏️ Updating product:', id, updates);
      
      // FIXED: Clean update data and ensure category_id is preserved
      const cleanUpdates = {
        name: updates.name?.trim(),
        description: updates.description?.trim() || '',
        price: updates.price !== undefined ? Number(updates.price) : undefined,
        category_id: updates.category_id, // CRITICAL: Preserve category_id
        main_image: updates.main_image,
        image_url: updates.main_image,
        // FIXED: Properly handle image arrays without overwriting
        images: Array.isArray(updates.images) ? updates.images.filter(Boolean) : undefined,
        colors: Array.isArray(updates.colors) ? updates.colors.filter(Boolean) : undefined,
        sizes: Array.isArray(updates.sizes) ? updates.sizes.filter(size => size?.size) : undefined,
        discount: updates.discount !== undefined ? Number(updates.discount) : undefined,
        featured: updates.featured !== undefined ? Boolean(updates.featured) : undefined,
        stock: updates.stock !== undefined ? Number(updates.stock) : undefined,
        inventory: updates.inventory !== undefined ? Number(updates.inventory) : Number(updates.stock) || undefined
      };
      
      // Remove undefined values
      Object.keys(cleanUpdates).forEach(key => {
        if (cleanUpdates[key] === undefined) {
          delete cleanUpdates[key];
        }
      });
      
      console.log('📤 Clean update data (preserving category_id):', cleanUpdates);
      
      const { data, error } = await supabase
        .from('products')
        .update(cleanUpdates)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        console.error('❌ Error updating product:', error);
        toast.error('Failed to update product: ' + error.message);
        return false;
      }
      
      console.log('✅ Product updated successfully with category_id:', data.category_id);
      toast.success('Product updated successfully!');
      
      await fetchProducts();
      return true;
    } catch (error: any) {
      console.error('💥 Exception updating product:', error);
      toast.error('Failed to update product: ' + error.message);
      return false;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('🗑️ Deleting product:', id);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting product:', error);
        toast.error('Failed to delete product: ' + error.message);
        return false;
      }
      
      console.log('✅ Product deleted successfully');
      toast.success('Product deleted successfully!');
      
      await fetchProducts();
      return true;
    } catch (error: any) {
      console.error('💥 Exception deleting product:', error);
      toast.error('Failed to delete product: ' + error.message);
      return false;
    }
  };

  return { 
    products, 
    loading, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    refetch: fetchProducts 
  };
};
