import { useState, useEffect, useCallback } from 'react';
import { reviewService, Review } from '@/services/reviewService';
import { toast } from 'sonner';

export const useReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await reviewService.getReviews(productId);

      if (error) {
        console.error('Error fetching reviews:', error);
        setError('فشل تحميل التقييمات');
        toast.error('فشل تحميل التقييمات');
        return;
      }

      setReviews(data || []);
    } catch (err) {
      console.error('Exception fetching reviews:', err);
      setError('فشل تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (rating: number, comment: string) => {
    const { data, error } = await reviewService.addReview(productId, rating, comment);

    if (error) {
      if (error.code === 'NOT_AUTHENTICATED') {
        toast.error('يجب تسجيل الدخول لإضافة تقييم');
      } else if (error.code === 'DUPLICATE_REVIEW') {
        toast.error('لقد قمت بتقييم هذا المنتج من قبل');
      } else {
        toast.error('فشل إضافة التقييم');
      }
      return { success: false };
    }

    toast.success('تم إضافة التقييم بنجاح');
    await fetchReviews(); // Refresh reviews
    return { success: true };
  };

  const updateReview = async (reviewId: string, rating: number, comment: string) => {
    const { data, error } = await reviewService.updateReview(reviewId, rating, comment);

    if (error) {
      toast.error('فشل تحديث التقييم');
      return { success: false };
    }

    toast.success('تم تحديث التقييم بنجاح');
    await fetchReviews(); // Refresh reviews
    return { success: true };
  };

  const deleteReview = async (reviewId: string) => {
    const { error } = await reviewService.deleteReview(reviewId);

    if (error) {
      toast.error('فشل حذف التقييم');
      return { success: false };
    }

    toast.success('تم حذف التقييم بنجاح');
    await fetchReviews(); // Refresh reviews
    return { success: true };
  };

  return {
    reviews,
    loading,
    error,
    addReview,
    updateReview,
    deleteReview,
    refetch: fetchReviews
  };
};
