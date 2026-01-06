import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeCategories = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          console.log('Categories realtime update:', payload);
          
          // Invalidate categories queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          
          // Show notifications for category changes
          if (payload.eventType === 'INSERT') {
            toast.success('تم إضافة فئة جديدة');
          } else if (payload.eventType === 'UPDATE') {
            toast.info('تم تحديث الفئة');
          } else if (payload.eventType === 'DELETE') {
            toast.info('تم حذف الفئة');
          }
        }
      )
      .subscribe((status, err) => {
        // Silently handle connection errors to prevent console warnings
        if (err) {
          console.debug('Realtime connection issue (non-critical):', err.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};