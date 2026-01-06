import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  productId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
  onSuccess: () => void;
}

export const ReviewForm = ({ productId, existingReview, onSuccess }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('يجب تسجيل الدخول لكتابة تقييم');
      return;
    }

    if (rating === 0) {
      toast.error('الرجاء اختيار تقييم');
      return;
    }

    if (!comment.trim()) {
      toast.error('الرجاء كتابة تعليق');
      return;
    }

    if (comment.length > 500) {
      toast.error('التعليق يجب أن يكون أقل من 500 حرف');
      return;
    }

    setSubmitting(true);

    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast.success('تم تحديث تقييمك بنجاح');
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment.trim(),
          });

        if (error) throw error;
        toast.success('تم إضافة تقييمك بنجاح');
      }

      onSuccess();
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error.code === '23505') {
        toast.error('لقد قمت بالفعل بتقييم هذا المنتج');
      } else {
        toast.error('حدث خطأ أثناء إرسال التقييم');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <label className="block text-sm font-medium mb-2">تقييمك:</label>
        <StarRating rating={rating} onRatingChange={setRating} size={28} />
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          تعليقك ({comment.length}/500):
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شاركنا رأيك في المنتج..."
          maxLength={500}
          rows={4}
          className="resize-none"
        />
      </div>

      <Button type="submit" disabled={submitting || rating === 0} className="w-full">
        {submitting ? 'جاري الإرسال...' : existingReview ? 'تحديث التقييم' : 'إرسال التقييم'}
      </Button>
    </form>
  );
};