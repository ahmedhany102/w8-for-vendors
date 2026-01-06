export interface Section {
  id: string;
  title: string;
  type: 'hero_carousel' | 'category_grid' | 'best_seller' | 'hot_deals' | 'last_viewed' | 'category_products' | 'manual' | 'vendor_highlights' | 'mid_page_ads';
  scope: 'global' | 'vendor';
  vendor_id: string | null;
  sort_order: number;
  is_active: boolean;
  slug?: string;
  config: {
    limit?: number;
    category_id?: string;
    auto?: boolean;
    background_color?: string;
  };
}

export interface SectionProduct {
  id: string;
  name: string;
  price: number;
  discount: number | null;
  image_url: string | null;
  rating: number | null;
  stock: number;
  inventory: number;
  vendor_name: string | null;
  vendor_slug: string | null;
  vendor_logo_url: string | null;
}
