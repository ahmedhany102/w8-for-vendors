
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  discount_kind: 'percentage' | 'fixed';
  discount_value: number;
  expiration_date?: string;
  usage_limit?: number;
  used_count: number;
  minimum_amount: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching coupons...');
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching coupons:', error);
        toast.error('Failed to load coupons: ' + error.message);
        setCoupons([]);
        return;
      }
      
      console.log('✅ Coupons fetched:', data?.length || 0);
      const typedCoupons = (data || []).map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        discount_kind: coupon.discount_kind as 'percentage' | 'fixed',
        discount_value: coupon.discount_value,
        expiration_date: coupon.expiration_date,
        usage_limit: coupon.usage_limit,
        used_count: coupon.used_count || 0,
        minimum_amount: coupon.minimum_amount || 0,
        active: coupon.active || false,
        created_at: coupon.created_at,
        updated_at: coupon.created_at // Fallback since updated_at may not exist
      })) as Coupon[];
      setCoupons(typedCoupons);
      
    } catch (error: any) {
      console.error('💥 Exception while fetching coupons:', error);
      toast.error('Failed to load coupons: ' + error.message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (code: string, orderTotal: number): Promise<Coupon | null> => {
    try {
      console.log('🔍 Validating coupon:', code, 'for order total:', orderTotal);
      
      if (!code || code.trim().length === 0) {
        console.log('❌ Empty coupon code');
        toast.error('Please enter a coupon code');
        return null;
      }

      const trimmedCode = code.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', trimmedCode)
        .eq('active', true)
        .single();

      if (error || !data) {
        console.log('❌ Coupon not found:', error);
        toast.error('Coupon code not found');
        return null;
      }

      const coupon: Coupon = {
        id: data.id,
        code: data.code,
        discount_kind: data.discount_kind as 'percentage' | 'fixed',
        discount_value: data.discount_value,
        expiration_date: data.expiration_date,
        usage_limit: data.usage_limit,
        used_count: data.used_count || 0,
        minimum_amount: data.minimum_amount || 0,
        active: data.active || false,
        created_at: data.created_at,
        updated_at: data.created_at // Fallback since updated_at may not exist
      };

      console.log('✅ Found coupon in DB:', coupon);

      // FIXED: Comprehensive validation with detailed error messages
      
      // 1. Check if coupon is active
      if (!coupon.active) {
        console.log('❌ Coupon is not active');
        toast.error('This coupon is currently inactive');
        return null;
      }

      // 2. Check expiration date
      if (coupon.expiration_date) {
        const expirationDate = new Date(coupon.expiration_date);
        const currentDate = new Date();
        
        console.log('📅 Checking expiration:', {
          expiration: expirationDate.toISOString(),
          current: currentDate.toISOString(),
          expired: expirationDate < currentDate
        });
        
        if (expirationDate < currentDate) {
          console.log('❌ Coupon expired');
          toast.error(`This coupon expired on ${expirationDate.toLocaleDateString()}`);
          return null;
        }
      }

      // 3. Check usage limit
      if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.usage_limit > 0) {
        if (coupon.used_count >= coupon.usage_limit) {
          console.log('❌ Coupon usage limit reached:', {
            used: coupon.used_count,
            limit: coupon.usage_limit
          });
          toast.error('This coupon has reached its usage limit');
          return null;
        }
      }

      // 4. Check minimum order amount
      const minimumAmount = coupon.minimum_amount || 0;
      if (orderTotal < minimumAmount) {
        console.log('❌ Order total below minimum amount:', {
          orderTotal,
          minimumRequired: minimumAmount
        });
        toast.error(`Minimum order amount of ${minimumAmount} EGP required for this coupon`);
        return null;
      }

      // 5. Validate discount value
      if (!coupon.discount_value || coupon.discount_value <= 0) {
        console.log('❌ Invalid discount value');
        toast.error('This coupon has an invalid discount value');
        return null;
      }

      console.log('✅ Coupon validation successful - all checks passed');
      
      // Calculate discount amount for display
      let discountAmount = 0;
      if (coupon.discount_kind === 'percentage') {
        discountAmount = orderTotal * (coupon.discount_value / 100);
      } else if (coupon.discount_kind === 'fixed') {
        discountAmount = Math.min(coupon.discount_value, orderTotal);
      }
      
      toast.success(`Coupon applied! You save ${discountAmount.toFixed(2)} EGP`);
      return coupon;
    } catch (error: any) {
      console.error('💥 Error validating coupon:', error);
      toast.error('Failed to validate coupon: ' + error.message);
      return null;
    }
  };

  const applyCoupon = async (couponId: string): Promise<boolean> => {
    try {
      console.log('🔄 Applying coupon (incrementing usage count):', couponId);
      
      // Get current coupon data first
      const { data: currentCoupon, error: fetchError } = await supabase
        .from('coupons')
        .select('used_count, usage_limit')
        .eq('id', couponId)
        .single();

      if (fetchError || !currentCoupon) {
        console.error('❌ Error fetching current coupon for usage update:', fetchError);
        return false;
      }

      // Check if we can still use this coupon
      if (currentCoupon.usage_limit && currentCoupon.used_count >= currentCoupon.usage_limit) {
        console.error('❌ Cannot apply coupon - usage limit reached');
        toast.error('This coupon has reached its usage limit');
        return false;
      }

      // Increment the usage count
      const newUsedCount = (currentCoupon.used_count || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ 
          used_count: newUsedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (updateError) {
        console.error('❌ Error updating coupon usage count:', updateError);
        toast.error('Failed to apply coupon: ' + updateError.message);
        return false;
      }

      console.log('✅ Coupon usage count updated successfully to:', newUsedCount);
      return true;
    } catch (error: any) {
      console.error('💥 Exception applying coupon:', error);
      toast.error('Failed to apply coupon: ' + error.message);
      return false;
    }
  };

  return { 
    coupons, 
    loading, 
    validateCoupon,
    applyCoupon,
    refetch: fetchCoupons 
  };
};
