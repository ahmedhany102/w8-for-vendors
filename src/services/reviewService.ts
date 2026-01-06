import { supabase } from '@/integrations/supabase/client';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    name: string;
    email: string;
  };
}

export const reviewService = {
  /**
   * Get all reviews for a product with user profile info
   */
  async getReviews(productId: string): Promise<{ data: any[] | null; error: any }> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (
          id,
          name,
          email
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Add a new review for a product
   */
  async addReview(productId: string, rating: number, comment: string): Promise<{ data: any | null; error: any }> {
    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { 
          data: null, 
          error: { message: 'يجب تسجيل الدخول لإضافة تقييم', code: 'NOT_AUTHENTICATED' }
        };
      }

      // Insert review
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            product_id: productId,
            user_id: user.id,
            rating,
            comment
          }
        ])
        .select(`
          *,
          profiles (
            id,
            name,
            email
          )
        `)
        .single();

      // Handle unique constraint violation (user already reviewed)
      if (error && error.code === '23505') {
        return {
          data: null,
          error: { message: 'لقد قمت بتقييم هذا المنتج من قبل', code: 'DUPLICATE_REVIEW' }
        };
      }

      return { data, error };
    } catch (error: any) {
      console.error('Error adding review:', error);
      return { data: null, error };
    }
  },

  /**
   * Update an existing review
   */
  async updateReview(reviewId: string, rating: number, comment: string): Promise<{ data: any | null; error: any }> {
    const { data, error } = await supabase
      .from('reviews')
      .update({ rating, comment, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select(`
        *,
        profiles (
          id,
          name,
          email
        )
      `)
      .single();

    return { data, error };
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    return { error };
  },

  /**
   * Calculate average rating for a product
   */
  async getAverageRating(productId: string): Promise<{ average: number; count: number }> {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (error || !data || data.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = data.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / data.length;

    return { average, count: data.length };
  }
};
