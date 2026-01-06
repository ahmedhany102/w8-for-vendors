import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { useSectionProducts, useBestSellers, useHotDeals, useCategoryProducts } from '@/hooks/useSections';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionProduct } from '@/types/section';

const SectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = React.useState<Section | null>(null);
  const [sectionLoading, setSectionLoading] = React.useState(true);

  // Fetch section details by slug or id
  React.useEffect(() => {
    const fetchSection = async () => {
      if (!id) {
        setSectionLoading(false);
        return;
      }

      try {
        // Check if the route param looks like a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase
          .from('sections')
          .select('*')
          .eq('is_active', true);

        // Query by ID if UUID format, otherwise by slug
        if (isUUID) {
          query = query.eq('id', id);
        } else {
          query = query.eq('slug', id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Error fetching section:', error);
          setSection(null);
        } else {
          setSection(data as unknown as Section);
        }
      } catch (err) {
        console.error('Exception fetching section:', err);
        setSection(null);
      } finally {
        setSectionLoading(false);
      }
    };

    fetchSection();
  }, [id]);

  // ✅ ALL HOOKS CALLED AT TOP LEVEL (React Rules of Hooks compliant)
  // Each hook runs independently - we select the correct data below
  const { products: manualProducts, loading: manualLoading } = useSectionProducts(section?.id || '', 100);
  const { products: bestSellers, loading: bsLoading } = useBestSellers(undefined, 100);
  const { products: hotDeals, loading: hdLoading } = useHotDeals(undefined, 100);
  const { products: categoryProducts, loading: cpLoading } = useCategoryProducts(
    section?.config?.category_id || '',
    undefined,
    100
  );

  // ✅ DATA SWITCHING based on section.type (not conditional hooks)
  const getProductsForType = (): { products: SectionProduct[]; loading: boolean } => {
    if (!section) return { products: [], loading: true };

    switch (section.type) {
      case 'best_seller':
        return { products: bestSellers, loading: bsLoading };
      case 'hot_deals':
        return { products: hotDeals, loading: hdLoading };
      case 'category_products':
        return { products: categoryProducts, loading: cpLoading };
      case 'manual':
      default:
        return { products: manualProducts, loading: manualLoading };
    }
  };

  const { products, loading: productsLoading } = getProductsForType();
  const loading = sectionLoading || productsLoading;

  // Section not found
  if (!sectionLoading && !section) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">القسم غير موجود</h2>
          <p className="text-muted-foreground mb-6">لم يتم العثور على القسم المطلوب</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للرئيسية
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-0 h-auto font-normal text-primary hover:text-primary/80"
              >
                الرئيسية
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{section?.title || 'القسم'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{section?.title || 'القسم'}</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              {products.length} منتج
            </p>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">لا توجد منتجات</h2>
            <p className="text-muted-foreground mb-6">
              هذا القسم فارغ حالياً
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة للرئيسية
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  discount: product.discount,
                  main_image: product.image_url,
                  image_url: product.image_url,
                  rating: product.rating,
                  stock: product.stock,
                  inventory: product.inventory,
                  vendor_name: product.vendor_name,
                  vendor_slug: product.vendor_slug,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SectionPage;