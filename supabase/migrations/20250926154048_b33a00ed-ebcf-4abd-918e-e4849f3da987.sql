-- Ensure categories table has proper structure
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE public.categories ADD COLUMN description text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'image_url') THEN
        ALTER TABLE public.categories ADD COLUMN image_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'product_count') THEN
        ALTER TABLE public.categories ADD COLUMN product_count integer DEFAULT 0;
    END IF;
END $$;

-- Create index on category_id in products table for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Create trigger to automatically update product_count in categories
CREATE OR REPLACE FUNCTION public.update_category_product_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_category_product_count ON public.products;
CREATE TRIGGER trigger_update_category_product_count
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_category_product_count();

-- Initialize product counts for existing categories
UPDATE public.categories 
SET product_count = (
    SELECT COUNT(*) FROM public.products 
    WHERE products.category_id = categories.id
);

-- Function to prevent category deletion if products exist
CREATE OR REPLACE FUNCTION public.prevent_category_deletion_with_products()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.products WHERE category_id = OLD.id) THEN
        RAISE EXCEPTION 'Cannot delete category with assigned products. Please reassign or delete products first.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion of categories with products
DROP TRIGGER IF EXISTS trigger_prevent_category_deletion ON public.categories;
CREATE TRIGGER trigger_prevent_category_deletion
    BEFORE DELETE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.prevent_category_deletion_with_products();

-- Enable realtime for categories table
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;