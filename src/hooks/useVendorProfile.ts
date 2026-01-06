import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface VendorProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  slug: string | null;
  status: VendorStatus;
  created_at: string;
  updated_at: string;
}

export interface VendorProfileWithUser extends VendorProfile {
  user_email: string;
  user_name: string;
}

export const useVendorProfile = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching vendor profile:', fetchError);
        setError(fetchError.message);
        return;
      }

      setProfile(data as VendorProfile | null);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError('Failed to fetch vendor profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const applyAsVendor = async (storeName: string, storeDescription?: string, phone?: string, address?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      // Check if already has a pending/approved profile
      const { data: existingProfile } = await supabase
        .from('vendor_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        if (existingProfile.status === 'pending') {
          toast.error('لديك طلب قيد المراجعة بالفعل');
          return false;
        }
        if (existingProfile.status === 'approved') {
          toast.error('أنت بائع معتمد بالفعل');
          return false;
        }
      }

      // Generate slug from store name using the database function
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_vendor_slug', { p_store_name: storeName });

      if (slugError) {
        console.error('Error generating slug:', slugError);
        // Fallback to a simple slug generation
      }

      const slug = slugData || storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const { data, error } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: user.id,
          store_name: storeName,
          store_description: storeDescription || null,
          phone: phone || null,
          address: address || null,
          slug: slug,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error applying as vendor:', error);
        toast.error('فشل في تقديم الطلب: ' + error.message);
        return false;
      }

      setProfile(data as VendorProfile);
      toast.success('تم تقديم طلبك بنجاح! سيتم مراجعته قريباً');
      return true;
    } catch (err) {
      console.error('Error in applyAsVendor:', err);
      toast.error('حدث خطأ أثناء تقديم الطلب');
      return false;
    }
  };

  const updateProfile = async (updates: Partial<Pick<VendorProfile, 'store_name' | 'store_description' | 'phone' | 'address' | 'logo_url' | 'cover_url'>>) => {
    try {
      if (!profile) {
        toast.error('لا يوجد ملف تعريف للتحديث');
        return false;
      }

      // Update vendor_profiles table
      const { data, error } = await supabase
        .from('vendor_profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating vendor profile:', error);
        toast.error('فشل في تحديث الملف: ' + error.message);
        return false;
      }

      // Also update vendors table to keep in sync
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const vendorUpdates: Record<string, any> = {};
        if (updates.store_name !== undefined) vendorUpdates.name = updates.store_name;
        if (updates.store_description !== undefined) vendorUpdates.description = updates.store_description;
        if (updates.phone !== undefined) vendorUpdates.phone = updates.phone;
        if (updates.address !== undefined) vendorUpdates.address = updates.address;
        if (updates.logo_url !== undefined) vendorUpdates.logo_url = updates.logo_url;
        if (updates.cover_url !== undefined) vendorUpdates.cover_url = updates.cover_url;

        if (Object.keys(vendorUpdates).length > 0) {
          const { error: vendorError } = await supabase
            .from('vendors')
            .update(vendorUpdates)
            .eq('owner_id', user.id);

          if (vendorError) {
            console.error('Error syncing vendors table:', vendorError);
            // Don't fail the whole operation, just log the error
          }
        }
      }

      setProfile(data as VendorProfile);
      toast.success('تم تحديث معلومات المتجر بنجاح');
      return true;
    } catch (err) {
      console.error('Error in updateProfile:', err);
      toast.error('حدث خطأ أثناء التحديث');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    applyAsVendor,
    updateProfile
  };
};

// Admin hook for managing all vendor profiles
export const useAdminVendorProfiles = () => {
  const [vendors, setVendors] = useState<VendorProfileWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async (statusFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_vendor_profiles_with_users', { 
          status_filter: statusFilter || null 
        });

      if (fetchError) {
        console.error('Error fetching vendors:', fetchError);
        setError(fetchError.message);
        return;
      }

      setVendors((data || []) as VendorProfileWithUser[]);
    } catch (err) {
      console.error('Error in fetchVendors:', err);
      setError('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVendorStatus = async (vendorProfileId: string, newStatus: VendorStatus) => {
    try {
      const { data, error } = await supabase
        .rpc('update_vendor_status', {
          target_vendor_profile_id: vendorProfileId,
          new_status: newStatus
        });

      if (error) {
        console.error('Error updating vendor status:', error);
        toast.error('فشل في تحديث حالة البائع: ' + error.message);
        return false;
      }

      toast.success(`تم تحديث حالة البائع إلى: ${getStatusLabel(newStatus)}`);
      return true;
    } catch (err) {
      console.error('Error in updateVendorStatus:', err);
      toast.error('حدث خطأ أثناء تحديث الحالة');
      return false;
    }
  };

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    updateVendorStatus
  };
};

export const getStatusLabel = (status: VendorStatus): string => {
  const labels: Record<VendorStatus, string> = {
    pending: 'قيد المراجعة',
    approved: 'معتمد',
    rejected: 'مرفوض',
    suspended: 'موقوف'
  };
  return labels[status] || status;
};

export const getStatusColor = (status: VendorStatus): string => {
  const colors: Record<VendorStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    approved: 'bg-green-500/20 text-green-700 dark:text-green-400',
    rejected: 'bg-red-500/20 text-red-700 dark:text-red-400',
    suspended: 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
  };
  return colors[status] || 'bg-muted text-muted-foreground';
};
