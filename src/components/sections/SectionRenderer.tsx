import React from 'react';
import { Flame, Star, Clock, Tag } from 'lucide-react';
import { Section } from '@/types/section';
import AdCarousel from '@/components/AdCarousel';
import MidPageAds from '@/components/MidPageAds';
import CategoryGrid from './CategoryGrid';
import ProductCarousel from './ProductCarousel';
import { useBestSellers, useHotDeals, useLastViewed, useCategoryProducts, useSectionProducts } from '@/hooks/useSections';
import { useAuth } from '@/contexts/AuthContext';

interface SectionRendererProps {
  section: Section;
  vendorId?: string;
  onCategorySelect?: (categoryId: string | null) => void;
}

// Individual section type components
const HeroCarouselSection: React.FC = () => {
  return <AdCarousel />;
};

const CategoryGridSection: React.FC<{ config: Section['config']; onCategorySelect?: (categoryId: string | null) => void }> = ({ config, onCategorySelect }) => {
  return <CategoryGrid limit={config.limit || 10} onCategorySelect={onCategorySelect} />;
};

const BestSellerSection: React.FC<{ section: Section; config: Section['config']; vendorId?: string }> = ({ section, config, vendorId }) => {
  const { products, loading } = useBestSellers(vendorId, config.limit || 12);

  return (
    <ProductCarousel
      title="Best Sellers"
      products={products}
      loading={loading}
      variant="best_seller"
      icon={<Star className="w-5 h-5" fill="currentColor" />}
      showMoreLink={vendorId ? undefined : `/section/${section.slug || section.id}`}
    />
  );
};

const HotDealsSection: React.FC<{ section: Section; config: Section['config']; vendorId?: string }> = ({ section, config, vendorId }) => {
  const { products, loading } = useHotDeals(vendorId, config.limit || 12);

  return (
    <ProductCarousel
      title="Hot Deals 🔥"
      products={products}
      loading={loading}
      variant="hot_deals"
      icon={<Flame className="w-5 h-5" />}
      showMoreLink={vendorId ? undefined : `/section/${section.slug || section.id}`}
    />
  );
};


const LastViewedSection: React.FC<{ config: Section['config']; vendorId?: string }> = ({ config, vendorId }) => {
  const { user } = useAuth();
  const { products, loading } = useLastViewed(vendorId, config.limit || 10);

  // Don't show if not logged in or no products
  if (!user || (!loading && products.length === 0)) return null;

  return (
    <ProductCarousel
      title="Recently Viewed"
      products={products}
      loading={loading}
      icon={<Clock className="w-5 h-5" />}
    />
  );
};

const CategoryProductsSection: React.FC<{ section: Section; config: Section['config']; vendorId?: string }> = ({ section, config, vendorId }) => {
  const { products, loading } = useCategoryProducts(config.category_id || '', vendorId, config.limit || 12);

  if (!config.category_id) return null;

  return (
    <ProductCarousel
      title="Category Products"
      products={products}
      loading={loading}
      icon={<Tag className="w-5 h-5" />}
      showMoreLink={vendorId ? undefined : `/section/${section.slug || section.id}`}
    />
  );
};

const ManualSection: React.FC<{ section: Section }> = ({ section }) => {
  const { products, loading } = useSectionProducts(section.id, section.config.limit || 12);
  const backgroundColor = section.config?.background_color;

  return (
    <ProductCarousel
      title={section.title}
      products={products}
      loading={loading}
      showMoreLink={section.slug ? `/section/${section.slug}` : `/section/${section.id}`}
      backgroundColor={backgroundColor}
    />
  );
};

// Main SectionRenderer component
const SectionRenderer: React.FC<SectionRendererProps> = ({ section, vendorId, onCategorySelect }) => {
  switch (section.type) {
    case 'hero_carousel':
      return <HeroCarouselSection />;

    case 'category_grid':
      return <CategoryGridSection config={section.config} onCategorySelect={onCategorySelect} />;

    case 'best_seller':
      return <BestSellerSection section={section} config={section.config} vendorId={vendorId} />;

    case 'hot_deals':
      return <HotDealsSection section={section} config={section.config} vendorId={vendorId} />;

    case 'last_viewed':
      return <LastViewedSection config={section.config} vendorId={vendorId} />;

    case 'category_products':
      return <CategoryProductsSection section={section} config={section.config} vendorId={vendorId} />;

    case 'manual':
      return <ManualSection section={section} />;

    case 'mid_page_ads':
      return <MidPageAds className="my-6" />;

    default:
      return null;
  }
};

export default SectionRenderer;
