import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setFavoriteIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data || []);
      setFavoriteIds(new Set((data || []).map(f => f.product_id)));
    } catch (error: any) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favoriteIds.has(productId);
  };

  const toggleFavorite = async (productId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to save favorites');
      return false;
    }

    const isCurrentlyFavorite = isFavorite(productId);

    try {
      if (isCurrentlyFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        // Optimistic update
        setFavorites(prev => prev.filter(f => f.product_id !== productId));
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });

        toast.success('Removed from favorites');
        return false;
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          })
          .select()
          .single();

        if (error) throw error;

        // Optimistic update
        if (data) {
          setFavorites(prev => [...prev, data]);
          setFavoriteIds(prev => new Set([...prev, productId]));
        }

        toast.success('Added to favorites');
        return true;
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
      return isCurrentlyFavorite;
    }
  };

  return {
    favorites,
    favoriteIds,
    loading,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
};
