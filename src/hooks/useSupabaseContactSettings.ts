
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseContactSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching contact settings from Supabase...');
      
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching contact settings:', error);
        toast.error('Failed to load contact settings');
        return;
      }
      
      console.log('Successfully fetched contact settings:', data);
      setSettings(data);
    } catch (error) {
      console.error('Exception while fetching contact settings:', error);
      toast.error('Failed to load contact settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
      console.log('Saving contact settings to database:', updates);
      
      // Validate required fields
      if (!updates.store_name?.trim()) {
        const errorMsg = 'Store name is required';
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Clean data for database operation
      const cleanData = {
        store_name: updates.store_name.trim(),
        address: updates.address?.trim() || '',
        email: updates.email?.trim() || '',
        phone: updates.phone?.trim() || '',
        working_hours: updates.working_hours?.trim() || '',
        website: updates.website?.trim() || '',
        facebook: updates.facebook?.trim() || '',
        instagram: updates.instagram?.trim() || '',
        twitter: updates.twitter?.trim() || '',
        youtube: updates.youtube?.trim() || '',
        map_url: updates.map_url?.trim() || '',
        terms_and_conditions: updates.terms_and_conditions?.trim() || '',
        developer_name: 'Ahmed Hany',
        developer_url: 'https://ahmed-hany-folio-glow.lovable.app/',
        updated_at: new Date().toISOString()
      };
      
      console.log('Cleaned settings data for database:', cleanData);
      
      let result;
      
      if (settings?.id) {
        // Update existing settings
        console.log('Updating existing settings with ID:', settings.id);
        
        const { data, error } = await supabase
          .from('contact_settings')
          .update(cleanData)
          .eq('id', settings.id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase settings update error:', error);
          toast.error('Failed to update settings: ' + error.message);
          throw error;
        }
        
        result = data;
      } else {
        // Create new settings
        console.log('Creating new settings record');
        
        const createData = {
          ...cleanData,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('contact_settings')
          .insert([createData])
          .select()
          .single();
        
        if (error) {
          console.error('Supabase settings insert error:', error);
          toast.error('Failed to create settings: ' + error.message);
          throw error;
        }
        
        result = data;
      }
      
      if (!result) {
        const errorMsg = 'No data returned from settings save operation';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('Settings successfully saved to database:', result);
      setSettings(result);
      toast.success('Settings saved successfully');
      
      return result;
      
    } catch (error) {
      console.error('Exception in updateSettings:', error);
      throw error;
    }
  };

  return { 
    settings, 
    loading, 
    updateSettings, 
    refetch: fetchSettings 
  };
};
