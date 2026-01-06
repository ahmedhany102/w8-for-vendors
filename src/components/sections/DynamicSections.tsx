import React from 'react';
import { useSections, useBestSellers, useHotDeals, useLastViewed } from '@/hooks/useSections';
import SectionRenderer from './SectionRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import AdCarousel from '@/components/AdCarousel';
import CategoryGrid from './CategoryGrid';
import MidPageAds from '@/components/MidPageAds';
import { ProductCarousel } from '@/components/sections';
import { Star, Flame, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Section } from '@/types/section';

interface DynamicSectionsProps {
  scope?: 'global' | 'vendor';
  vendorId?: string;
  onCategorySelect?: (categoryId: string | null) => void;
}

const DynamicSections: React.FC<DynamicSectionsProps> = ({
  scope = 'global',
  vendorId,
  onCategorySelect
}) => {
  const { user } = useAuth();
  const { sections, loading } = useSections(scope, vendorId);

  // Fallback data hooks - always loaded for potential use
  const { products: bestSellers, loading: bestSellersLoading } = useBestSellers(vendorId, 12);
  const { products: hotDeals, loading: hotDealsLoading } = useHotDeals(vendorId, 12);
  const { products: lastViewed, loading: lastViewedLoading } = useLastViewed(vendorId, 10);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Hero skeleton */}
        <Skeleton className="h-48 md:h-64 lg:h-80 w-full rounded-lg" />

        {/* Categories skeleton */}
        <div>
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Product section skeleton */}
        <div>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[180px] h-64 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check which section types are configured in DB
  const hasHeroSection = sections.some(s => s.type === 'hero_carousel');
  const hasCategorySection = sections.some(s => s.type === 'category_grid');
  const hasMidPageAds = sections.some(s => s.type === 'mid_page_ads');
  const hasBestSellers = sections.some(s => s.type === 'best_seller');
  const hasHotDeals = sections.some(s => s.type === 'hot_deals');
  const hasLastViewed = sections.some(s => s.type === 'last_viewed');

  // Get sections that display products/content (excluding fixed position elements)
  const productSections = sections.filter(s =>
    !['hero_carousel', 'category_grid', 'mid_page_ads'].includes(s.type)
  );

  // Sections to show BEFORE mid-page ads (max 1)
  const sectionsBeforeAds = productSections.slice(0, 1);
  // Sections to show AFTER mid-page ads
  const sectionsAfterAds = productSections.slice(1);

  return (
    <div className="space-y-6">
      {/* 1. ALWAYS render Hero Banner first */}
      {!hasHeroSection ? (
        <section>
          <AdCarousel />
        </section>
      ) : (
        sections.filter(s => s.type === 'hero_carousel').map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            vendorId={vendorId}
            onCategorySelect={onCategorySelect}
          />
        ))
      )}

      {/* 2. ALWAYS render Categories Grid */}
      {!hasCategorySection ? (
        <section>
          <CategoryGrid limit={10} onCategorySelect={onCategorySelect} />
        </section>
      ) : (
        sections.filter(s => s.type === 'category_grid').map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            vendorId={vendorId}
            onCategorySelect={onCategorySelect}
          />
        ))
      )}

      {/* 3. ONE section BEFORE mid-page ads (if exists) */}
      {sectionsBeforeAds.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          vendorId={vendorId}
          onCategorySelect={onCategorySelect}
        />
      ))}

      {/* 4. Auto best sellers before ads if no sections defined */}
      {!hasBestSellers && bestSellers.length > 0 && sectionsBeforeAds.length === 0 && (
        <section>
          <ProductCarousel
            title="Best Sellers"
            products={bestSellers}
            loading={bestSellersLoading}
            variant="best_seller"
            icon={<Star className="w-5 h-5" fill="currentColor" />}
            showMoreLink="/section/best-sellers"
          />
        </section>
      )}

      {/* 5. MID-PAGE ADS - FIXED POSITION (always in the middle) */}
      {hasMidPageAds ? (
        sections.filter(s => s.type === 'mid_page_ads').map(section => (
          <SectionRenderer
            key={section.id}
            section={section}
            vendorId={vendorId}
            onCategorySelect={onCategorySelect}
          />
        ))
      ) : (
        <section>
          <MidPageAds className="my-4" />
        </section>
      )}

      {/* 6. ALL remaining sections AFTER mid-page ads */}
      {sectionsAfterAds.map(section => (
        <SectionRenderer
          key={section.id}
          section={section}
          vendorId={vendorId}
          onCategorySelect={onCategorySelect}
        />
      ))}

      {/* 7. Auto hot deals after ads if not configured */}
      {!hasHotDeals && hotDeals.length > 0 && (
        <section>
          <ProductCarousel
            title="Hot Deals 🔥"
            products={hotDeals}
            loading={hotDealsLoading}
            variant="hot_deals"
            icon={<Flame className="w-5 h-5" />}
            showMoreLink="/section/hot-deals"
          />
        </section>
      )}

      {/* 8. Last Viewed - always shows for logged-in users at the end */}
      {user && !hasLastViewed && lastViewed.length > 0 && (
        <section>
          <ProductCarousel
            title="Recently Viewed"
            products={lastViewed}
            loading={lastViewedLoading}
            icon={<Clock className="w-5 h-5" />}
          />
        </section>
      )}
    </div>
  );
};

export default DynamicSections;