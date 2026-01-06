import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/reviews/StarRating';
import { Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ReviewsManagement = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (
            name,
            email
          ),
          product:product_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('فشل تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (reviewId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    setDeleting(reviewId);
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;

      toast.success('تم حذف التقييم بنجاح');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('فشل حذف التقييم');
    } finally {
      setDeleting(null);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      review.comment?.toLowerCase().includes(searchLower) ||
      review.user?.name?.toLowerCase().includes(searchLower) ||
      review.user?.email?.toLowerCase().includes(searchLower) ||
      review.product?.name?.toLowerCase().includes(searchLower) ||
      review.rating.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة التقييمات</h2>
        <div className="text-sm text-muted-foreground">
          إجمالي التقييمات: {reviews.length}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="ابحث عن تقييم، منتج، أو مستخدم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reviews Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>المستخدم</TableHead>
              <TableHead>التقييم</TableHead>
              <TableHead>التعليق</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد تقييمات'}
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.product?.name || 'منتج محذوف'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {review.user?.name || 'مستخدم'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {review.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} readonly size={16} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {review.comment}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      disabled={deleting === review.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deleting === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
