import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorAd {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  redirect_url: string | null;
  position: number;
  is_active: boolean;
}

export const useVendorAds = (vendorId: string | undefined) => {
  const [ads, setAds] = useState<VendorAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      if (!vendorId) {
        setAds([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('ads')
          .select('id, title, description, image_url, redirect_url, position, is_active')
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .order('position', { ascending: true });

        if (error) {
          console.error('Error fetching vendor ads:', error);
          setAds([]);
          return;
        }

        setAds(data || []);
      } catch (err) {
        console.error('Error in fetchVendorAds:', err);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [vendorId]);

  return { ads, loading };
};
