export type Coupon = {
  id?: string;
  code: string;
  discount_kind: 'percent' | 'fixed';
  discount_value: number;
  minimum_amount?: number | null;
  active: boolean;
  expiration_date?: string | null;
  usage_limit?: number | null;
  used_count?: number | null;
  max_discount?: number | null;
};

export interface ApplyCouponResult {
  valid: boolean;
  reason: 'inactive' | 'expired' | 'below_minimum' | 'exhausted' | null;
  discount: number;
  total: number;
}

export function applyCoupon({
  subtotal,
  coupon
}: {
  subtotal: number;
  coupon: Coupon;
}): ApplyCouponResult {
  // Validate coupon is active
  if (!coupon.active) {
    return { valid: false, reason: 'inactive', discount: 0, total: subtotal };
  }

  // Validate expiration
  const now = new Date();
  if (coupon.expiration_date && new Date(coupon.expiration_date) < now) {
    return { valid: false, reason: 'expired', discount: 0, total: subtotal };
  }

  // Validate minimum amount
  if (coupon.minimum_amount && subtotal < coupon.minimum_amount) {
    return { valid: false, reason: 'below_minimum', discount: 0, total: subtotal };
  }

  // Validate usage limit
  if (coupon.usage_limit && coupon.used_count !== undefined && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, reason: 'exhausted', discount: 0, total: subtotal };
  }

  let discount = 0;

  if (coupon.discount_kind === 'percent') {
    // Clamp percentage to 0-100 defensively
    const pct = Math.max(0, Math.min(100, coupon.discount_value));
    discount = subtotal * (pct / 100);
    
    // Apply max_discount cap if set
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
    
    // Round to 2 decimal places
    discount = +discount.toFixed(2);
  } else {
    // Fixed amount: ensure it doesn't exceed subtotal
    discount = Math.max(0, Math.min(subtotal, coupon.discount_value));
  }

  const total = +(subtotal - discount).toFixed(2);

  return { valid: true, reason: null, discount, total };
}
