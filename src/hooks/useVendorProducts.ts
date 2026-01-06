import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ProductFormData } from '@/types/product';
import { cleanProductDataForInsert } from '@/utils/productUtils';
import { formatProductForDisplay } from '@/utils/productUtils';

export interface VendorProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  category_id?: string;
  main_image?: string;
  image_url?: string;
  images?: string[];
  colors?: string[];
  sizes?: any[];
  discount?: number;
  featured?: boolean;
  stock?: number;
  inventory?: number;
  status?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const useVendorProducts = (statusFilter?: string) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use RPC to get vendor products with proper filtering
      const { data, error } = await supabase.rpc('get_vendor_products', {
        _vendor_id: null, // null means current user's products (handled by RPC)
        _status_filter: statusFilter || 'all'
      });

      if (error) {
        console.error('Error fetching vendor products:', error);
        toast.error('فشل في تحميل المنتجات');
        return;
      }

      const formattedProducts = (data || []).map(formatProductForDisplay);
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast.error('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (productData: ProductFormData): Promise<{ id: string } | null> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return null;
    }

    try {
      // First check if vendor is approved in vendor_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('vendor_profiles')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching vendor profile:', profileError);
        toast.error('فشل في التحقق من حساب البائع');
        return null;
      }

      if (!profileData || profileData.status !== 'approved') {
        toast.error('يجب أن تكون بائعاً معتمداً لإضافة منتجات');
        return null;
      }

      // Get the vendor_id from vendors table (the correct FK reference)
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (vendorError) {
        console.error('Error fetching vendor:', vendorError);
        toast.error('فشل في التحقق من متجرك');
        return null;
      }

      if (!vendorData) {
        toast.error('لم يتم العثور على متجرك. يرجى التواصل مع الدعم.');
        return null;
      }

      const cleanData = cleanProductDataForInsert(productData, user.id);
      
      // The category field from HierarchicalCategorySelector is already a UUID (the child category ID)
      // We use it directly as category_id - no name lookup needed
      const categoryId = cleanData.category || null;
      
      // Set initial status to 'pending' for vendor products - requires admin approval
      const dataWithVendor = { 
        ...cleanData, 
        status: 'pending',
        vendor_id: vendorData.id,
        category_id: categoryId, // Use category directly as it's already the child category UUID
        is_best_seller: (productData as any).is_best_seller || false
      };

      const { data, error } = await supabase
        .from('products')
        .insert(dataWithVendor)
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        toast.error('فشل في إضافة المنتج: ' + error.message);
        return null;
      }

      // Save color variants if they exist
      const pendingVariants = (window as any).__pendingColorVariants;
      if (pendingVariants && pendingVariants.length > 0 && data?.id) {
        const { ProductVariantService } = await import('@/services/productVariantService');
        const variantsSaved = await ProductVariantService.saveProductVariants(data.id, pendingVariants);
        if (!variantsSaved) {
          console.warn('Failed to save color variants');
        }
        // Clear pending variants
        delete (window as any).__pendingColorVariants;
      }

      toast.success('تم إضافة المنتج بنجاح', {
        description: 'المنتج في انتظار موافقة الإدارة قبل النشر.'
      });
      await fetchProducts();
      return { id: data.id };
    } catch (error) {
      console.error('Error in addProduct:', error);
      toast.error('حدث خطأ أثناء إضافة المنتج');
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<ProductFormData>): Promise<boolean> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      // Clean the updates
      const cleanUpdates: any = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
      if (updates.category !== undefined) cleanUpdates.category_id = updates.category; // Save to category_id
      if (updates.main_image !== undefined) cleanUpdates.main_image = updates.main_image;
      if (updates.images !== undefined) cleanUpdates.images = updates.images;
      if (updates.colors !== undefined) cleanUpdates.colors = updates.colors;
      if (updates.sizes !== undefined) cleanUpdates.sizes = updates.sizes;
      if (updates.discount !== undefined) cleanUpdates.discount = Number(updates.discount);
      if (updates.featured !== undefined) cleanUpdates.featured = updates.featured;
      if (updates.stock !== undefined) cleanUpdates.stock = Number(updates.stock);
      if (updates.inventory !== undefined) cleanUpdates.inventory = Number(updates.inventory);
      if ((updates as any).is_best_seller !== undefined) cleanUpdates.is_best_seller = (updates as any).is_best_seller;
      
      cleanUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('products')
        .update(cleanUpdates)
        .eq('id', productId)
        .eq('user_id', user.id); // Ensure vendor owns the product

      if (error) {
        console.error('Error updating product:', error);
        toast.error('فشل في تحديث المنتج');
        return false;
      }

      // Save color variants if they exist
      const pendingVariants = (window as any).__pendingColorVariants;
      if (pendingVariants && pendingVariants.length > 0) {
        const { ProductVariantService } = await import('@/services/productVariantService');
        const variantsSaved = await ProductVariantService.saveProductVariants(productId, pendingVariants);
        if (!variantsSaved) {
          console.warn('Failed to save color variants');
        }
        // Clear pending variants
        delete (window as any).__pendingColorVariants;
      }

      toast.success('تم تحديث المنتج بنجاح');
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error in updateProduct:', error);
      toast.error('حدث خطأ أثناء تحديث المنتج');
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id); // Ensure vendor owns the product

      if (error) {
        console.error('Error deleting product:', error);
        toast.error('فشل في حذف المنتج');
        return false;
      }

      toast.success('تم حذف المنتج بنجاح');
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      toast.error('حدث خطأ أثناء حذف المنتج');
      return false;
    }
  };

  return {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};

// Admin hook for managing all products
export const useAdminProducts = (vendorFilter?: string, statusFilter?: string) => {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_vendor_products', {
        _vendor_id: vendorFilter || null,
        _status_filter: statusFilter || 'all'
      });

      if (error) {
        console.error('Error fetching admin products:', error);
        toast.error('فشل في تحميل المنتجات');
        return;
      }

      const formattedProducts = (data || []).map(formatProductForDisplay);
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast.error('حدث خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, vendorFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateProductStatus = async (productId: string, newStatus: string): Promise<boolean> => {
    if (!user || !isAdmin) {
      toast.error('ليس لديك صلاحية لتغيير حالة المنتج');
      return false;
    }

    try {
      const { error } = await supabase.rpc('update_product_status', {
        _product_id: productId,
        _new_status: newStatus
      });

      if (error) {
        console.error('Error updating product status:', error);
        toast.error('فشل في تحديث حالة المنتج');
        return false;
      }

      toast.success('تم تحديث حالة المنتج بنجاح');
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error in updateProductStatus:', error);
      toast.error('حدث خطأ أثناء تحديث حالة المنتج');
      return false;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    if (!user || !isAdmin) {
      toast.error('ليس لديك صلاحية لحذف المنتج');
      return false;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        toast.error('فشل في حذف المنتج');
        return false;
      }

      toast.success('تم حذف المنتج بنجاح');
      await fetchProducts();
      return true;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      toast.error('حدث خطأ أثناء حذف المنتج');
      return false;
    }
  };

  return {
    products,
    loading,
    updateProductStatus,
    deleteProduct,
    refetch: fetchProducts
  };
};
