
import { supabase } from '@/integrations/supabase/client';

export class CouponService {
  static async validateCoupon(code: string, orderTotal: number) {
    try {
      console.log('🎟️ Validating coupon:', code, 'for order total:', orderTotal);

      // Normalize the code for comparison
      const normalizedCode = code.toUpperCase().trim();

      // Query the coupon with case-insensitive matching
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', normalizedCode)
        .eq('active', true)
        .single();

      if (error || !coupon) {
        console.log('❌ Coupon not found or inactive:', code);
        return {
          valid: false,
          error: 'كوبون الخصم غير صحيح أو غير نشط'
        };
      }

      // Check expiration date
      if (coupon.expiration_date) {
        const expirationDate = new Date(coupon.expiration_date);
        const now = new Date();
        if (expirationDate < now) {
          console.log('❌ Coupon expired:', code, 'expired on:', expirationDate);
          return {
            valid: false,
            error: 'انتهت صلاحية كوبون الخصم'
          };
        }
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        console.log('❌ Coupon usage limit exceeded:', code, 'used:', coupon.used_count, 'limit:', coupon.usage_limit);
        return {
          valid: false,
          error: 'تم استخدام كوبون الخصم بالكامل'
        };
      }

      // Check minimum amount (handle null values properly)
      const minimumAmount = coupon.minimum_amount || 0;
      if (minimumAmount > 0 && orderTotal < minimumAmount) {
        console.log('❌ Order total below minimum:', orderTotal, 'required:', minimumAmount);
        return {
          valid: false,
          error: `الحد الأدنى للطلب ${minimumAmount} جنيه`
        };
      }

      // Calculate discount (support both 'percent'/'percentage')
      let discountAmount = 0;
      const kind = String(coupon.discount_kind || '').toLowerCase();
      if (kind === 'percent' || kind === 'percentage') {
        discountAmount = (orderTotal * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed order total
      discountAmount = Math.min(discountAmount, orderTotal);

      console.log('✅ Coupon valid, discount amount:', discountAmount);

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_kind: coupon.discount_kind,
          discount_value: coupon.discount_value,
          discount_amount: discountAmount
        }
      };

    } catch (error: any) {
      console.error('💥 Error validating coupon:', error);
      return {
        valid: false,
        error: 'حدث خطأ أثناء التحقق من كوبون الخصم'
      };
    }
  }

  static async applyCoupon(couponId: string) {
    try {
      // First get the current used_count
      const { data: currentCoupon, error: fetchError } = await supabase
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (fetchError || !currentCoupon) {
        console.error('❌ Error fetching coupon for update:', fetchError);
        return false;
      }

      // Increment usage count
      const { error } = await supabase
        .from('coupons')
        .update({ 
          used_count: currentCoupon.used_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) {
        console.error('❌ Error applying coupon:', error);
        return false;
      }

      console.log('✅ Coupon applied successfully:', couponId);
      return true;
    } catch (error) {
      console.error('💥 Error in applyCoupon:', error);
      return false;
    }
  }
}
