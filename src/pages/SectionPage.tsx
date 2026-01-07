import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { useSectionProducts, useBestSellers, useHotDeals, useCategoryProducts } from '@/hooks/useSections';
import { useVendorContext } from '@/hooks/useVendorContext';
import { useVendorCategories } from '@/hooks/useVendors';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Star, Flame } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { Section, SectionProduct } from '@/types/section';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';

// ===========================================
// VIRTUAL SECTION DEFINITIONS
// These sections don't exist in the database
// but are handled by direct product queries
// ===========================================
const VIRTUAL_SECTIONS: Record<string, { title: string; type: string }> = {
  'best-sellers': { title: 'الأكثر مبيعاً', type: 'best_seller' },
  'best-seller': { title: 'الأكثر مبيعاً', type: 'best_seller' },
  'hot-deals': { title: 'عروض ساخنة', type: 'hot_deals' },
  'hot-deal': { title: 'عروض ساخنة', type: 'hot_deals' },
};

const SectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [section, setSection] = React.useState<Section | null>(null);
  const [sectionLoading, setSectionLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = React.useState<string | null>(null);

  // Get vendor context
  const { isVendorContext, vendorId, vendorSlug } = useVendorContext();

  // Only fetch vendor categories when in vendor context
  const { mainCategories, subcategories } = useVendorCategories(vendorId);

  // Check if this is a virtual section (best-sellers, hot-deals)
  const virtualSection = id ? VIRTUAL_SECTIONS[id.toLowerCase()] : null;
  const isVirtualSection = !!virtualSection;

  // Fetch section details by slug or id - SKIP for virtual sections
  React.useEffect(() => {
    const fetchSection = async () => {
      // Skip DB lookup for virtual sections
      if (isVirtualSection) {
        setSectionLoading(false);
        return;
      }

      if (!id) {
        setSectionLoading(false);
        return;
      }

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase
          .from('sections')
          .select('*')
          .eq('is_active', true);

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
  }, [id, isVirtualSection]);

  // ALL HOOKS - Read from VendorContext
  const { products: manualProducts, loading: manualLoading } = useSectionProducts(section?.id || '', 100);
  const { products: bestSellers, loading: bsLoading } = useBestSellers(100);
  const { products: hotDeals, loading: hdLoading } = useHotDeals(100);
  const { products: categoryProducts, loading: cpLoading } = useCategoryProducts(
    section?.config?.category_id || '',
    100
  );

  // Get section type - from virtual section OR database section
  const getSectionType = (): string => {
    if (isVirtualSection && virtualSection) {
      return virtualSection.type;
    }
    return section?.type || 'manual';
  };

  // Get section title - from virtual section OR database section
  const getSectionTitle = (): string => {
    if (isVirtualSection && virtualSection) {
      return virtualSection.title;
    }
    return section?.title || 'القسم';
  };

  // DATA SWITCHING based on section type
  const getProductsForType = (): { products: SectionProduct[]; loading: boolean } => {
    const sectionType = getSectionType();

    switch (sectionType) {
      case 'best_seller':
        return { products: bestSellers, loading: bsLoading };
      case 'hot_deals':
        return { products: hotDeals, loading: hdLoading };
      case 'category_products':
        return { products: categoryProducts, loading: cpLoading };
      case 'manual':
      default:
        // For manual sections, we need the section.id
        if (!section) return { products: [], loading: true };
        return { products: manualProducts, loading: manualLoading };
    }
  };

  const { products, loading: productsLoading } = getProductsForType();

  // Loading state: wait for section lookup (unless virtual) OR products
  const loading = (!isVirtualSection && sectionLoading) || productsLoading;

  // Back navigation based on context
  const handleBack = () => {
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}`);
    } else {
      navigate('/');
    }
  };

  // Section not found - only show if NOT virtual AND not in DB
  if (!sectionLoading && !section && !isVirtualSection) {
    return (
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        {isVendorContext && vendorId && (
          <VendorStoreHeader
            vendorId={vendorId}
            mainCategories={mainCategories}
            subcategories={subcategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        )}
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">القسم غير موجود</h2>
          <p className="text-muted-foreground mb-6">لم يتم العثور على القسم المطلوب</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isVendorContext ? 'العودة للمتجر' : 'العودة للرئيسية'}
          </Button>
        </div>
      </Layout>
    );
  }

  const sectionTitle = getSectionTitle();

  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      {/* Vendor Header (when in vendor context) */}
      {isVendorContext && vendorId && (
        <VendorStoreHeader
          vendorId={vendorId}
          mainCategories={mainCategories}
          subcategories={subcategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
        />
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-0 h-auto font-normal text-primary hover:text-primary/80"
              >
                {isVendorContext ? 'المتجر' : 'الرئيسية'}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sectionTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{sectionTitle}</h1>
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
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isVendorContext ? 'العودة للمتجر' : 'العودة للرئيسية'}
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