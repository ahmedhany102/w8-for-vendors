
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Advertisement {
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

export class AdvertisementService {
  static async getAllAdvertisements(): Promise<Advertisement[]> {
    try {
      console.log('🔄 Fetching advertisements from database...');

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Error fetching advertisements:', error);
        toast.error('Failed to load advertisements: ' + error.message);
        return [];
      }

      console.log('✅ Advertisements loaded:', data?.length || 0);
      return data || [];
    } catch (error: any) {
      console.error('💥 Exception while fetching advertisements:', error);
      toast.error('Failed to load advertisements: ' + error.message);
      return [];
    }
  }

  static async createAdvertisement(adData: Omit<Advertisement, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('🆕 Adding new advertisement:', adData);

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
        console.error('❌ Error adding advertisement:', error);
        toast.error('Failed to add advertisement: ' + error.message);
        return false;
      }

      console.log('✅ Advertisement added successfully:', data);
      toast.success('Advertisement added successfully!');
      return true;
    } catch (error: any) {
      console.error('💥 Exception while adding advertisement:', error);
      toast.error('Failed to add advertisement: ' + error.message);
      return false;
    }
  }

  static async updateAdvertisement(id: string, updates: Partial<Omit<Advertisement, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      console.log('✏️ Updating advertisement:', id, updates);

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
        console.error('❌ Error updating advertisement:', error);
        toast.error('Failed to update advertisement: ' + error.message);
        return false;
      }

      console.log('✅ Advertisement updated successfully:', data);
      toast.success('Advertisement updated successfully!');
      return true;
    } catch (error: any) {
      console.error('💥 Exception while updating advertisement:', error);
      toast.error('Failed to update advertisement: ' + error.message);
      return false;
    }
  }

  static async deleteAdvertisement(id: string) {
    try {
      console.log('🗑️ Deleting advertisement:', id);

      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting advertisement:', error);
        toast.error('Failed to delete advertisement: ' + error.message);
        return false;
      }

      console.log('✅ Advertisement deleted successfully');
      toast.success('Advertisement deleted successfully!');
      return true;
    } catch (error: any) {
      console.error('💥 Exception while deleting advertisement:', error);
      toast.error('Failed to delete advertisement: ' + error.message);
      return false;
    }
  }
}
