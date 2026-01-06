
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateProductData } from '@/utils/productValidation';
import { LoadingFallback } from '@/utils/loadingFallback';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type?: string;
  category?: string;
  main_image?: string;
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

export const useProductFetching = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Start loading timeout fallback
      LoadingFallback.startTimeout('product-fetch', 5000, () => {
        setLoading(false);
        setProducts([]);
      });
      
      console.log('🔄 Fetching products with public access...');
      
      // Fetch products without authentication requirement
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Clear loading timeout
      LoadingFallback.clearTimeout('product-fetch');
      
      if (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Failed to load products: ' + error.message);
        setProducts([]);
        return;
      }
      
      console.log('✅ Raw products fetched:', data?.length || 0);
      
      // Validate and clean product data
      const validatedProducts = (data || [])
        .map(validateProductData)
        .filter((product): product is Product => product !== null);
      
      console.log('✅ Validated products:', validatedProducts.length);
      setProducts(validatedProducts);
      
    } catch (error: any) {
      LoadingFallback.clearTimeout('product-fetch');
      console.error('💥 Exception while fetching products:', error);
      toast.error('Failed to load products: ' + error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, refetch: fetchProducts };
};
