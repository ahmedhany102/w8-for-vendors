
import { supabase } from '@/integrations/supabase/client';
import { ProductFormData, ProductUpdateData } from '@/types/product';
import { useAuth } from '@/contexts/AuthContext';
import { validateRequiredFields, validateUpdateFields } from '@/utils/productValidation';
import { cleanProductDataForInsert } from '@/utils/productUtils';
import { toastManager } from '@/utils/toastManager';

export const useProductOperations = () => {
  const { user } = useAuth();

  const addProduct = async (productData: ProductFormData) => {
    if (!user) {
      toastManager.error('You must be logged in to add products');
      return null;
    }

    try {
      console.log('🎯 Adding product with complete data validation...', productData);
      
      const validationError = validateRequiredFields(productData);
      if (validationError) {
        toastManager.error(validationError);
        return null;
      }

      const userId = user.id;
      const cleanData = cleanProductDataForInsert(productData, userId);
      
      console.log('📤 Sending to database:', cleanData);
      
      const { data, error } = await supabase
        .from('products')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to add product:', error);
        toastManager.error('Failed to add product: ' + error.message);
        return null;
      }

      console.log('✅ Product added successfully:', data);
      toastManager.success('Product added successfully!');
      return data;
    } catch (error: any) {
      console.error('💥 Exception while adding product:', error);
      toastManager.error('Failed to add product: ' + error.message);
      return null;
    }
  };

  const updateProduct = async (id: string, updates: ProductUpdateData) => {
    if (!user) {
      toastManager.error('You must be logged in to update products');
      return null;
    }

    try {
      const validationError = validateUpdateFields(updates);
      if (validationError) {
        toastManager.error(validationError);
        return null;
      }

      const updateData: Record<string, any> = {};
      
      if (updates.name) updateData.name = updates.name.trim();
      if (updates.description !== undefined) updateData.description = updates.description?.trim() || '';
      if (updates.price) updateData.price = parseFloat(String(updates.price));
      if (updates.category) updateData.category = updates.category;
      if (updates.main_image !== undefined) {
        updateData.main_image = updates.main_image || '';
        updateData.image_url = updates.main_image || '';
      }
      if (updates.images) updateData.images = Array.isArray(updates.images) ? updates.images.filter(Boolean) : [];
      if (updates.colors) updateData.colors = Array.isArray(updates.colors) ? updates.colors.filter(Boolean) : [];
      if (updates.sizes) updateData.sizes = Array.isArray(updates.sizes) ? updates.sizes.filter(size => size?.size) : [];
      if (updates.discount !== undefined) updateData.discount = parseFloat(String(updates.discount)) || 0;
      if (updates.featured !== undefined) updateData.featured = Boolean(updates.featured);
      if (updates.stock !== undefined) updateData.stock = parseInt(String(updates.stock)) || 0;
      if (updates.inventory !== undefined) updateData.inventory = parseInt(String(updates.inventory)) || parseInt(String(updates.stock || 0)) || 0;

      const userId = user.id;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update product:', error);
        toastManager.error('Failed to update product: ' + error.message);
        return null;
      }

      console.log('✅ Product updated successfully:', data);
      toastManager.success('Product updated successfully!');
      return data;
    } catch (error: any) {
      console.error('💥 Exception while updating product:', error);
      toastManager.error('Failed to update product: ' + error.message);
      return null;
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) {
      toastManager.error('You must be logged in to delete products');
      return null;
    }

    try {
      const userId = user.id;
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to delete product:', error);
        toastManager.error('Failed to delete product: ' + error.message);
        return null;
      }

      console.log('✅ Product deleted successfully');
      toastManager.success('Product deleted successfully!');
      return true;
    } catch (error: any) {
      console.error('💥 Exception while deleting product:', error);
      toastManager.error('Failed to delete product: ' + error.message);
      return null;
    }
  };

  return { addProduct, updateProduct, deleteProduct };
};
