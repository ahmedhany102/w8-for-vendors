import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { StarRating } from './StarRating';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Find user's review
      if (user) {
        const myReview = data?.find((r) => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('فشل تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId, user]);

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;

      toast.success('تم حذف التقييم بنجاح');
      fetchReviews();
      setShowForm(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('فشل حذف التقييم');
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleSuccess = () => {
    fetchReviews();
    setShowForm(false);
    setEditingReview(null);
  };

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Average Rating */}
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} readonly size={20} />
          <div className="text-sm text-muted-foreground mt-1">
            {reviews.length} {reviews.length === 1 ? 'تقييم' : 'تقييمات'}
          </div>
        </div>
      </div>

      {/* User Review Form */}
      {user && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              variant={userReview ? 'outline' : 'default'}
              className="w-full"
            >
              {userReview ? 'تعديل تقييمك' : 'اكتب تقييماً'}
            </Button>
          ) : (
            <div className="space-y-4">
              <ReviewForm
                productId={productId}
                existingReview={editingReview || userReview}
                onSuccess={handleSuccess}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingReview(null);
                }}
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="p-4 border rounded-lg bg-muted/50 text-center">
          <p className="text-sm">يجب تسجيل الدخول لكتابة تقييم</p>
        </div>
      )}

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">التقييمات</h3>
        <ReviewList
          reviews={reviews}
          currentUserId={user?.id}
          onEdit={handleEditReview}
          onDelete={handleDeleteReview}
        />
      </div>
    </div>
  );
};