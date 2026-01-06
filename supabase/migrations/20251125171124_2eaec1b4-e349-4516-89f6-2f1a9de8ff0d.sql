-- Fix Function Search Path Mutable security warning
-- Add SET search_path to functions that are missing it

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_category_product_count
CREATE OR REPLACE FUNCTION public.update_category_product_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Update count for old category (if exists)
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
        IF OLD.category_id IS NOT NULL THEN
            UPDATE public.categories 
            SET product_count = (
                SELECT COUNT(*) FROM public.products 
                WHERE category_id = OLD.category_id
            )
            WHERE id = OLD.category_id;
        END IF;
    END IF;
    
    -- Update count for new category (if exists)
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id) THEN
        IF NEW.category_id IS NOT NULL THEN
            UPDATE public.categories 
            SET product_count = (
                SELECT COUNT(*) FROM public.products 
                WHERE category_id = NEW.category_id
            )
            WHERE id = NEW.category_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix prevent_category_deletion_with_products
CREATE OR REPLACE FUNCTION public.prevent_category_deletion_with_products()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF EXISTS (SELECT 1 FROM public.products WHERE category_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete category with assigned products. Please reassign or delete products first.';
    END IF;
    RETURN OLD;
END;
$function$;

-- Fix update_coupons_updated_at
CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;