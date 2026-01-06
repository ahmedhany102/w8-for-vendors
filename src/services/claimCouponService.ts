import { supabase } from '@/integrations/supabase/client';

/**
 * Atomically claim a coupon by code
 * Returns the coupon if valid and available, null otherwise
 */
export async function claimCoupon(code: string) {
  try {
    const { data, error } = await supabase.rpc('claim_coupon', {
      p_code: code.trim()
    });

    if (error) {
      console.error('❌ Error claiming coupon:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('💥 Exception claiming coupon:', error);
    return null;
  }
}
