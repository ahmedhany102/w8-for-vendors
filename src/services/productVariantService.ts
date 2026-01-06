
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductVariantOption {
  id?: string;
  size: string;
  price: number;
  stock: number;
}

export interface ProductVariant {
  id?: string;
  color: string;
  image: string | null;
  options: ProductVariantOption[];
}

export class ProductVariantService {
  static async saveProductVariants(productId: string, variants: ProductVariant[]) {
    try {
      console.log('🎯 Saving product variants for product:', productId);
      console.log('📦 Variants data:', variants);

      // First, delete existing variants for this product to avoid duplicates
      const { error: deleteError } = await supabase
        .from('product_color_variants')
        .delete()
        .eq('product_id', productId);

      if (deleteError) {
        console.error('❌ Error deleting existing variants:', deleteError);
        throw deleteError;
      }

      // Insert new variants
      for (const variant of variants) {
        if (!variant.color.trim() || !variant.image) {
          console.warn('⚠️ Skipping incomplete variant:', variant);
          continue;
        }

        // Insert color variant
        const { data: colorVariant, error: colorError } = await supabase
          .from('product_color_variants')
          .insert({
            product_id: productId,
            color: variant.color.trim(),
            image: variant.image
          })
          .select('id')
          .single();

        if (colorError || !colorVariant) {
          console.error('❌ Error inserting color variant:', colorError);
          throw colorError;
        }

        console.log('✅ Color variant created:', colorVariant.id);

        // Insert options for this color variant
        const validOptions = variant.options.filter(opt => 
          opt.size.trim() && opt.price > 0 && opt.stock >= 0
        );

        if (validOptions.length > 0) {
          const optionsToInsert = validOptions.map(option => ({
            color_variant_id: colorVariant.id,
            size: option.size.trim(),
            price: option.price,
            stock: option.stock
          }));

          const { error: optionsError } = await supabase
            .from('product_color_variant_options')
            .insert(optionsToInsert);

          if (optionsError) {
            console.error('❌ Error inserting variant options:', optionsError);
            throw optionsError;
          }

          console.log('✅ Options created for variant:', colorVariant.id);
        }
      }

      console.log('🎉 All variants saved successfully!');
      return true;
    } catch (error: any) {
      console.error('💥 Error in saveProductVariants:', error);
      toast.error('فشل في حفظ ألوان المنتج: ' + error.message);
      return false;
    }
  }

  static async loadProductVariants(productId: string): Promise<ProductVariant[]> {
    try {
      console.log('📥 Loading variants for product:', productId);

      // Get color variants
      const { data: colorVariants, error: colorError } = await supabase
        .from('product_color_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (colorError) {
        console.error('❌ Error loading color variants:', colorError);
        throw colorError;
      }

      if (!colorVariants || colorVariants.length === 0) {
        console.log('📭 No color variants found for product:', productId);
        return [];
      }

      // Get options for all variants
      const variantIds = colorVariants.map(v => v.id);
      const { data: options, error: optionsError } = await supabase
        .from('product_color_variant_options')
        .select('*')
        .in('color_variant_id', variantIds)
        .order('created_at');

      if (optionsError) {
        console.error('❌ Error loading variant options:', optionsError);
        throw optionsError;
      }

      // Combine data
      const variants: ProductVariant[] = colorVariants.map(variant => ({
        id: variant.id,
        color: variant.color,
        image: variant.image,
        options: (options || [])
          .filter(opt => opt.color_variant_id === variant.id)
          .map(opt => ({
            id: opt.id,
            size: opt.size,
            price: opt.price,
            stock: opt.stock
          }))
      }));

      console.log('✅ Loaded variants:', variants);
      return variants;
    } catch (error: any) {
      console.error('💥 Error in loadProductVariants:', error);
      toast.error('فشل في تحميل ألوان المنتج: ' + error.message);
      return [];
    }
  }

  static async deleteProductVariants(productId: string) {
    try {
      const { error } = await supabase
        .from('product_color_variants')
        .delete()
        .eq('product_id', productId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting product variants:', error);
      return false;
    }
  }
}
