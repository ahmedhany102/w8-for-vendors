-- =============================================
-- DYNAMIC SECTIONS ENGINE - Database Schema
-- =============================================

-- 1. Sections table - Core engine for dynamic content
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hero_carousel', 'category_grid', 'best_seller', 'hot_deals', 'last_viewed', 'category_products', 'manual', 'vendor_highlights')),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'vendor')),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Section Products - Manual product selection mapping
CREATE TABLE public.section_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(section_id, product_id)
);

-- 3. Product Views - For personalization (last viewed, recommendations)
CREATE TABLE public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_product_views_user_id ON public.product_views(user_id);
CREATE INDEX idx_product_views_viewed_at ON public.product_views(viewed_at DESC);
CREATE INDEX idx_sections_scope ON public.sections(scope, is_active);
CREATE INDEX idx_sections_vendor ON public.sections(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX idx_section_products_section ON public.section_products(section_id);

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for sections
-- =============================================
CREATE POLICY "Anyone can view active sections"
ON public.sections FOR SELECT
USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all sections"
ON public.sections FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Vendors can manage their own sections"
ON public.sections FOR ALL
USING (
  scope = 'vendor' 
  AND vendor_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = sections.vendor_id AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  scope = 'vendor' 
  AND vendor_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM vendors v WHERE v.id = sections.vendor_id AND v.owner_id = auth.uid()
  )
);

-- =============================================
-- RLS Policies for section_products
-- =============================================
CREATE POLICY "Anyone can view section products"
ON public.section_products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage section products"
ON public.section_products FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Vendors can manage their section products"
ON public.section_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM sections s 
    JOIN vendors v ON v.id = s.vendor_id 
    WHERE s.id = section_products.section_id AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sections s 
    JOIN vendors v ON v.id = s.vendor_id 
    WHERE s.id = section_products.section_id AND v.owner_id = auth.uid()
  )
);

-- =============================================
-- RLS Policies for product_views
-- =============================================
CREATE POLICY "Users can view their own product views"
ON public.product_views FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own product views"
ON public.product_views FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own product views"
ON public.product_views FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all product views"
ON public.product_views FOR SELECT
USING (is_admin(auth.uid()));

-- =============================================
-- Function: Get sections by scope
-- =============================================
CREATE OR REPLACE FUNCTION public.get_sections_by_scope(
  _scope TEXT DEFAULT 'global',
  _vendor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  type TEXT,
  scope TEXT,
  vendor_id UUID,
  sort_order INTEGER,
  is_active BOOLEAN,
  config JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.type,
    s.scope,
    s.vendor_id,
    s.sort_order,
    s.is_active,
    s.config
  FROM sections s
  WHERE 
    s.is_active = true
    AND s.scope = _scope
    AND (
      (_scope = 'global' AND s.vendor_id IS NULL)
      OR (_scope = 'vendor' AND s.vendor_id = _vendor_id)
    )
  ORDER BY s.sort_order ASC;
END;
$$;

-- =============================================
-- Function: Get section products (manual)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_section_products(
  _section_id UUID,
  _limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_logo_url TEXT,
  sort_order INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url,
    sp.sort_order
  FROM section_products sp
  JOIN products p ON p.id = sp.product_id
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    sp.section_id = _section_id
    AND p.status IN ('active', 'approved')
  ORDER BY sp.sort_order ASC
  LIMIT _limit;
END;
$$;

-- =============================================
-- Function: Get best seller products
-- =============================================
CREATE OR REPLACE FUNCTION public.get_best_seller_products(
  _vendor_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    p.status IN ('active', 'approved')
    AND p.featured = true
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- Function: Get hot deals products
-- =============================================
CREATE OR REPLACE FUNCTION public.get_hot_deals_products(
  _vendor_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    p.status IN ('active', 'approved')
    AND p.discount IS NOT NULL
    AND p.discount > 0
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.discount DESC, p.created_at DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- Function: Get last viewed products
-- =============================================
CREATE OR REPLACE FUNCTION public.get_last_viewed_products(
  _user_id UUID,
  _limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.id)
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM product_views pv
  JOIN products p ON p.id = pv.product_id
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    pv.user_id = _user_id
    AND p.status IN ('active', 'approved')
  ORDER BY p.id, pv.viewed_at DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- Function: Get products by category
-- =============================================
CREATE OR REPLACE FUNCTION public.get_category_products(
  _category_id UUID,
  _vendor_id UUID DEFAULT NULL,
  _limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  discount NUMERIC,
  image_url TEXT,
  rating NUMERIC,
  vendor_name TEXT,
  vendor_slug TEXT,
  vendor_logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.discount,
    COALESCE(p.main_image, p.image_url) as image_url,
    p.rating,
    COALESCE(v.name, vp.store_name) as vendor_name,
    COALESCE(v.slug, vp.slug) as vendor_slug,
    COALESCE(v.logo_url, vp.logo_url) as vendor_logo_url
  FROM products p
  LEFT JOIN vendors v ON v.id = p.vendor_id
  LEFT JOIN vendor_profiles vp ON vp.user_id = p.user_id
  WHERE 
    p.status IN ('active', 'approved')
    AND p.category_id = _category_id
    AND (_vendor_id IS NULL OR p.vendor_id = _vendor_id)
  ORDER BY p.created_at DESC
  LIMIT _limit;
END;
$$;

-- =============================================
-- Function: Track product view
-- =============================================
CREATE OR REPLACE FUNCTION public.track_product_view(
  _product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  INSERT INTO product_views (user_id, product_id, viewed_at)
  VALUES (auth.uid(), _product_id, now());
  
  -- Keep only last 50 views per user
  DELETE FROM product_views
  WHERE id IN (
    SELECT pv.id FROM product_views pv
    WHERE pv.user_id = auth.uid()
    ORDER BY pv.viewed_at DESC
    OFFSET 50
  );
  
  RETURN true;
END;
$$;

-- =============================================
-- Insert default global sections
-- =============================================
INSERT INTO public.sections (title, type, scope, sort_order, is_active, config) VALUES
('عروض وخصومات', 'hero_carousel', 'global', 1, true, '{}'),
('تصفح الفئات', 'category_grid', 'global', 2, true, '{"limit": 10}'),
('الأكثر مبيعاً', 'best_seller', 'global', 3, true, '{"limit": 12}'),
('عروض حصرية', 'hot_deals', 'global', 4, true, '{"limit": 12}'),
('شاهدت مؤخراً', 'last_viewed', 'global', 5, true, '{"limit": 10}');