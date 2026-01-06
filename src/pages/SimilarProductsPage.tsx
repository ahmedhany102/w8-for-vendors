import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Product } from '@/models/Product';

interface RawProduct {
  id: string;
  name: string;
  price: number;
  discount: number | null;
  image_url: string;
  rating: number | null;
  stock: number;
  inventory: number;
  vendor_name: string | null;
  vendor_logo_url: string | null;
  vendor_slug: string | null;
}

const SimilarProductsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const categoryId = searchParams.get('category_id');
  const excludeProductId = searchParams.get('exclude');
  
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState<string>('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch category name
        const { data: categoryData } = await supabase
          .from('categories')
          .select('name')
          .eq('id', categoryId)
          .single();
        
        if (categoryData) {
          setCategoryName(categoryData.name);
        }

        // Fetch products using RPC
        const { data, error } = await supabase.rpc('get_products_by_category', {
          _category_id: categoryId,
          _exclude_product_id: excludeProductId || null,
          _limit: limit,
          _offset: 0
        });

        if (error) {
          console.error('Error fetching products:', error);
          setProducts([]);
          return;
        }

        setProducts((data || []) as RawProduct[]);
        setHasMore((data || []).length === limit);
      } catch (err) {
        console.error('Exception fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, excludeProductId]);

  const loadMore = async () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    
    try {
      const { data, error } = await supabase.rpc('get_products_by_category', {
        _category_id: categoryId,
        _exclude_product_id: excludeProductId || null,
        _limit: limit,
        _offset: newOffset
      });

      if (error) {
        console.error('Error loading more products:', error);
        return;
      }

      const newProducts = (data || []) as RawProduct[];
      setProducts(prev => [...prev, ...newProducts]);
      setHasMore(newProducts.length === limit);
    } catch (err) {
      console.error('Exception loading more products:', err);
    }
  };

  // Convert RawProduct to Product for ProductCard
  const toProduct = (p: RawProduct): Product & { vendor_name?: string; vendor_slug?: string; vendor_logo_url?: string } => ({
    id: p.id,
    name: p.name,
    price: p.price,
    mainImage: p.image_url,
    images: [],
    colors: [],
    sizes: [],
    description: '',
    category: '',
    inventory: p.inventory,
    featured: false,
    discount: p.discount || 0,
    hasDiscount: (p.discount || 0) > 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stock: p.stock,
    vendor_name: p.vendor_name || undefined,
    vendor_slug: p.vendor_slug || undefined,
    vendor_logo_url: p.vendor_logo_url || undefined,
  });

  if (!categoryId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">لم يتم تحديد الفئة</h1>
          <Button onClick={() => navigate('/')}>
            العودة للرئيسية
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">
            {categoryName ? `منتجات مشابهة - ${categoryName}` : 'منتجات مشابهة'}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">لا توجد منتجات مشابهة</p>
            <Button onClick={() => navigate('/')}>
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={toProduct(product)}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button onClick={loadMore} variant="outline">
                  تحميل المزيد
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default SimilarProductsPage;
