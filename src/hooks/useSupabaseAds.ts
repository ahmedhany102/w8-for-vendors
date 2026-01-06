
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Ad {
  id: string;
  title?: string;
  description?: string;
  image_url: string;
  redirect_url?: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching Super Admin ads (global) from database...');

      // CRITICAL: Only fetch ads where vendor_id IS NULL (Super Admin ads)
      // Vendor ads are strictly scoped to their store pages only
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .is('vendor_id', null)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Error fetching ads:', error);
        toast.error('Failed to load ads: ' + error.message);
        return;
      }

      console.log('✅ Ads loaded:', data?.length || 0);
      setAds(data || []);
    } catch (error: any) {
      console.error('💥 Exception while fetching ads:', error);
      toast.error('Failed to load ads: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addAd = async (adData: Omit<Ad, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('🆕 Adding new ad:', adData);

      const { data, error } = await supabase
        .from('ads')
        .insert([{
          title: adData.title,
          description: adData.description,
          image_url: adData.image_url,
          redirect_url: adData.redirect_url,
          position: adData.position,
          is_active: adData.is_active
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding ad:', error);
        toast.error('Failed to add ad: ' + error.message);
        return false;
      }

      console.log('✅ Ad added successfully:', data);
      toast.success('Ad added successfully!');
      await fetchAds(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('💥 Exception while adding ad:', error);
      toast.error('Failed to add ad: ' + error.message);
      return false;
    }
  };

  const updateAd = async (id: string, updates: Partial<Omit<Ad, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('✏️ Updating ad:', id, updates);

      const { data, error } = await supabase
        .from('ads')
        .update({
          title: updates.title,
          description: updates.description,
          image_url: updates.image_url,
          redirect_url: updates.redirect_url,
          position: updates.position,
          is_active: updates.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating ad:', error);
        toast.error('Failed to update ad: ' + error.message);
        return false;
      }

      console.log('✅ Ad updated successfully:', data);
      toast.success('Ad updated successfully!');
      await fetchAds(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('💥 Exception while updating ad:', error);
      toast.error('Failed to update ad: ' + error.message);
      return false;
    }
  };

  const deleteAd = async (id: string) => {
    try {
      console.log('🗑️ Deleting promotional banner via secure function:', id);

      // Use RPC function to avoid AdBlock issues
      const { data, error } = await supabase.rpc('delete_promotional_banner', { banner_id: id });

      if (error) {
        console.error('❌ Error deleting promotional banner:', error);
        toast.error('Failed to delete promotional banner: ' + error.message);
        return false;
      }

      if (!data) {
        console.error('❌ Promotional banner not found or could not be deleted');
        toast.error('Promotional banner not found or could not be deleted');
        return false;
      }

      console.log('✅ Promotional banner deleted successfully');
      toast.success('Promotional banner deleted successfully!');
      await fetchAds(); // Refresh the list
      return true;
    } catch (error: any) {
      console.error('💥 Exception while deleting promotional banner:', error);
      toast.error('Failed to delete promotional banner: ' + error.message);
      return false;
    }
  };

  const refetch = fetchAds;

  return {
    ads,
    loading,
    addAd,
    updateAd,
    deleteAd,
    refetch
  };
};
