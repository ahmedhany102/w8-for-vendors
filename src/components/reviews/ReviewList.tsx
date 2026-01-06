import React from 'react';
import { StarRating } from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    name: string;
    email: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewList = ({ reviews, currentUserId, onEdit, onDelete }: ReviewListProps) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد تقييمات حتى الآن. كن أول من يقيم هذا المنتج!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isOwner = currentUserId === review.user_id;
        const reviewerName = review.profiles?.name || review.profiles?.email?.split('@')[0] || 'مستخدم';

        return (
          <div key={review.id} className="p-4 border rounded-lg bg-card space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{reviewerName}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </span>
                </div>
                <StarRating rating={review.rating} readonly size={16} />
              </div>

              {isOwner && (
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(review)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(review.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <p className="text-sm">{review.comment}</p>
          </div>
        );
      })}
    </div>
  );
};