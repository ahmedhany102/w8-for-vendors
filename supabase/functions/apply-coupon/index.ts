import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
}

interface ApplyCouponRequest {
  code: string;
  cart_items: CartItem[];
  subtotal: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id || null;
    }

    const body: ApplyCouponRequest = await req.json();
    const { code, cart_items, subtotal } = body;

    console.log('🎟️ Applying coupon:', code, 'for user:', userId, 'subtotal:', subtotal);

    // Validate input
    if (!code || !cart_items || !subtotal) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch coupon with case-insensitive matching
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .ilike('code', code.trim())
      .eq('active', true)
      .maybeSingle();

    if (couponError || !coupon) {
      console.log('❌ Coupon not found:', code);
      return new Response(
        JSON.stringify({ ok: false, message: 'كوبون الخصم غير صحيح أو غير نشط' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const now = new Date();
    
    // Check if coupon has started
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      console.log('❌ Coupon not started yet:', code);
      return new Response(
        JSON.stringify({ ok: false, message: 'كوبون الخصم لم يبدأ بعد' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if coupon has expired using either ends_at or expiration_date
    if ((coupon.ends_at && new Date(coupon.ends_at) < now) || (coupon.expiration_date && new Date(coupon.expiration_date) < now)) {
      console.log('❌ Coupon expired:', code);
      return new Response(
        JSON.stringify({ ok: false, message: 'انتهت صلاحية كوبون الخصم' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check minimum order value
    if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
      console.log('❌ Order below minimum:', subtotal, 'required:', coupon.minimum_amount);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          message: `الحد الأدنى للطلب ${coupon.minimum_amount} جنيه` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check global usage limit
    if (coupon.usage_limit_global) {
      const { count: globalUsage } = await supabaseClient
        .from('coupon_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);

      if (globalUsage !== null && globalUsage >= coupon.usage_limit_global) {
        console.log('❌ Global usage limit exceeded:', globalUsage, 'limit:', coupon.usage_limit_global);
        return new Response(
          JSON.stringify({ ok: false, message: 'تم استخدام كوبون الخصم بالكامل' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Check per-user usage limit (if user is authenticated)
    if (userId && coupon.usage_limit_per_user) {
      const { count: userUsage } = await supabaseClient
        .from('coupon_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);

      if (userUsage !== null && userUsage >= coupon.usage_limit_per_user) {
        console.log('❌ User usage limit exceeded:', userUsage, 'limit:', coupon.usage_limit_per_user);
        return new Response(
          JSON.stringify({ ok: false, message: 'لقد استخدمت هذا الكوبون بالفعل' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Calculate eligible subtotal (for now, assume all items are eligible)
    const eligibleSubtotal = subtotal;

    // ✅ Calculate discount correctly (support 'percent' and 'percentage')
    let discount = 0;
    const kind = String(coupon.discount_kind || '').toLowerCase();
    const value = Number(coupon.discount_value || 0);
    if (kind === 'percent' || kind === 'percentage') {
      discount = (eligibleSubtotal * value) / 100;
      // Apply max_discount cap if set
      if (coupon.max_discount && discount > Number(coupon.max_discount)) {
        discount = Number(coupon.max_discount);
      }
    } else if (kind === 'fixed' || kind === 'amount') {
      discount = value;
    }

    // Ensure discount doesn't exceed subtotal and is not negative
    discount = Math.min(discount, subtotal);
    discount = Math.max(0, discount);

    const finalTotal = subtotal - discount;

    console.log('✅ Coupon applied successfully:', {
      code,
      discount,
      finalTotal,
      couponId: coupon.id
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'تم تطبيق كوبون الخصم بنجاح',
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_kind: coupon.discount_kind,
          discount_value: coupon.discount_value
        },
        discount,
        finalTotal
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('💥 Error applying coupon:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        message: 'حدث خطأ أثناء التحقق من كوبون الخصم' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
