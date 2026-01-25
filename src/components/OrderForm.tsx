
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { claimCoupon } from '@/services/claimCouponService';
import { ApplyCouponService } from '@/services/applyCouponService';
import { EGYPTIAN_GOVERNORATES, getGovernorateLabel } from '@/constants/governorates';
import { supabase } from '@/integrations/supabase/client';
import { Truck, MapPin, Loader2 } from 'lucide-react';

interface OrderFormProps {
  cartItems: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    color?: string;
    size?: string;
    vendor_id?: string | null;
    is_free_shipping?: boolean;
  }[];
  subtotal: number;
  onOrderComplete?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    couponId?: string;
  } | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ cartItems, subtotal, onOrderComplete, appliedCoupon }) => {
  const { user, session } = useAuth();
  const { addOrder } = useSupabaseOrders();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    governorate: 'cairo',
    zipCode: '',
    notes: '',
    paymentMethod: 'CASH',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(25);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Calculate shipping when governorate or cart changes
  const calculateShipping = useCallback(async () => {
    console.log('='.repeat(60));
    console.log('🚀 SHIPPING CALCULATION STARTED');
    console.log('='.repeat(60));
    console.log('📋 Cart Items:', cartItems.length);

    // Log each cart item details
    cartItems.forEach((item, idx) => {
      console.log(`  [${idx}] ${item.name}:`);
      console.log(`      - vendor_id: ${item.vendor_id || 'NULL/MISSING'}`);
      console.log(`      - is_free_shipping: ${item.is_free_shipping}`);
      console.log(`      - price: ${item.price}`);
    });
    console.log('📍 Selected Governorate:', formData.governorate);
    console.log('-'.repeat(60));

    if (cartItems.length === 0) {
      console.log('⚠️ No cart items, setting shipping to 0');
      setShippingCost(0);
      return;
    }

    setIsCalculatingShipping(true);

    try {
      // Group items by vendor_id (which is actually user_id from products)
      const vendorGroups = new Map<string | null, typeof cartItems>();
      for (const item of cartItems) {
        const vendorId = item.vendor_id || null;
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, []);
        }
        vendorGroups.get(vendorId)!.push(item);
      }

      console.log('👥 Vendor Groups:', vendorGroups.size);
      vendorGroups.forEach((items, vendorId) => {
        console.log(`  - Vendor ${vendorId || 'NULL'}: ${items.length} items`);
      });

      let totalShipping = 0;

      for (const [userIdFromProduct, items] of vendorGroups) {
        console.log(`\n🔄 Processing vendor group: user_id=${userIdFromProduct || 'NULL'}`);

        // Priority 1: Check if any item has free shipping
        const freeShippingItem = items.find(item => item.is_free_shipping === true);
        const hasFreeShipping = !!freeShippingItem;

        if (hasFreeShipping) {
          console.log(`✅ PRIORITY 1: Free shipping found!`);
          console.log(`   Item with free shipping: ${freeShippingItem?.name}`);
          console.log(`   Cost for this vendor: 0 EGP`);
          continue; // 0 for this vendor
        }
        console.log(`❌ PRIORITY 1: No free shipping items`);

        // No vendor = platform products, use standard fallback
        if (!userIdFromProduct) {
          totalShipping += 25;
          console.log(`⚠️ NO VENDOR_ID: Using platform default 25 EGP`);
          console.log(`   (Cart item missing vendor_id - check CartDatabase.addToCart)`);
          continue;
        }

        // Try multiple resolution paths for vendor_profiles.id
        let vendorProfileId: string | null = null;
        let vendorDefaultCost: number | null = null;

        // PATH 1: Try as user_id (auth UID) → vendor_profiles.user_id
        console.log(`🔍 PATH 1: Trying vendor_profiles.user_id = ${userIdFromProduct}`);
        const { data: profileByUserId } = await supabase
          .from('vendor_profiles')
          .select('id, default_shipping_cost')
          .eq('user_id', userIdFromProduct)
          .maybeSingle();

        if (profileByUserId) {
          vendorProfileId = profileByUserId.id;
          vendorDefaultCost = (profileByUserId as any).default_shipping_cost;
          console.log(`   ✅ Found via user_id: vendor_profiles.id = ${vendorProfileId}`);
        }

        // PATH 2: If not found, try as vendors.id → vendors.owner_id → vendor_profiles.user_id
        if (!vendorProfileId) {
          console.log(`🔍 PATH 2: Trying vendors.id = ${userIdFromProduct}`);
          const { data: vendor } = await supabase
            .from('vendors')
            .select('owner_id')
            .eq('id', userIdFromProduct)
            .maybeSingle();

          if (vendor?.owner_id) {
            console.log(`   Found vendor.owner_id = ${vendor.owner_id}`);
            const { data: profileByOwner } = await supabase
              .from('vendor_profiles')
              .select('id, default_shipping_cost')
              .eq('user_id', vendor.owner_id)
              .maybeSingle();

            if (profileByOwner) {
              vendorProfileId = profileByOwner.id;
              vendorDefaultCost = (profileByOwner as any).default_shipping_cost;
              console.log(`   ✅ Found via owner_id: vendor_profiles.id = ${vendorProfileId}`);
            }
          }
        }

        // PATH 3: If still not found, try direct lookup as vendor_profiles.id
        if (!vendorProfileId) {
          console.log(`🔍 PATH 3: Trying vendor_profiles.id = ${userIdFromProduct}`);
          const { data: profileDirect } = await supabase
            .from('vendor_profiles')
            .select('id, default_shipping_cost')
            .eq('id', userIdFromProduct)
            .maybeSingle();

          if (profileDirect) {
            vendorProfileId = profileDirect.id;
            vendorDefaultCost = (profileDirect as any).default_shipping_cost;
            console.log(`   ✅ Found as direct vendor_profiles.id`);
          }
        }

        // If no profile found by any path, use fallback
        if (!vendorProfileId) {
          totalShipping += 25;
          console.log(`⚠️ VENDOR PROFILE NOT FOUND by any path for ID: ${userIdFromProduct}`);
          console.log(`   Using fallback: 25 EGP`);
          continue;
        }

        console.log(`📍 Resolved vendor_profiles.id: ${vendorProfileId}`);
        console.log(`   Vendor's default_shipping_cost: ${vendorDefaultCost ?? 'NULL'}`);

        // Priority 2: Try zone-specific rate using vendor_profiles.id
        console.log(`🔍 Fetching zone rate for governorate: ${formData.governorate}`);
        const { data: zoneRate, error: rateError } = await supabase
          .from('vendor_shipping_rates' as any)
          .select('cost')
          .eq('vendor_id', vendorProfileId)
          .eq('governorate', formData.governorate)
          .maybeSingle();

        console.log(`   Response:`, { zoneRate, error: rateError?.message });

        if (zoneRate?.cost !== undefined) {
          totalShipping += Number(zoneRate.cost);
          console.log(`✅ PRIORITY 2: Found zone rate!`);
          console.log(`   Cost for ${formData.governorate}: ${zoneRate.cost} EGP`);
          continue;
        }
        console.log(`❌ PRIORITY 2: No zone rate found for ${formData.governorate}`);

        // Priority 3: Fallback to vendor's default shipping cost
        const defaultCost = vendorDefaultCost ?? 25;
        totalShipping += defaultCost;
        console.log(`✅ PRIORITY 3: Using vendor default`);
        console.log(`   Cost: ${defaultCost} EGP ${vendorDefaultCost === null ? '(fallback to 25)' : ''}`);
      }

      setShippingCost(totalShipping);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 FINAL SHIPPING COST: ${totalShipping} EGP`);
      console.log(`${'='.repeat(60)}\n`);


    } catch (error) {
      console.error('Error calculating shipping:', error);
      setShippingCost(25); // Safety fallback to 25
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [cartItems, formData.governorate]);

  // Recalculate when governorate changes
  useEffect(() => {
    calculateShipping();
  }, [calculateShipping]);

  // Calculate totals
  const discountAmount = appliedCoupon?.discount || 0;
  const total = subtotal + shippingCost - discountAmount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGovernorateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      governorate: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.name?.trim()) {
        toast.error('Full name is required');
        return;
      }

      if (!formData.email?.trim()) {
        toast.error('Email is required');
        return;
      }

      if (!formData.phone?.trim()) {
        toast.error('Phone number is required');
        return;
      }

      if (!formData.street?.trim()) {
        toast.error('العنوان بالتفصيل مطلوب');
        return;
      }

      if (!formData.city?.trim()) {
        toast.error('المدينة مطلوبة');
        return;
      }

      if (!formData.governorate) {
        toast.error('المحافظة مطلوبة');
        return;
      }

      // Validate cart items
      if (!cartItems || cartItems.length === 0) {
        toast.error('Cart is empty - cannot place order');
        return;
      }

      // Check authentication
      if (!user?.id || !session) {
        toast.error('You must be logged in to place an order');
        return;
      }

      console.log('Creating order for authenticated user:', {
        userId: user.id,
        email: user.email,
        cartItems: cartItems.length,
        shippingCost,
        governorate: formData.governorate
      });

      // Convert cart items to order items format
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        imageUrl: item.imageUrl || '',
        color: item.color || '-',
        size: item.size || '-',
      }));

      // Claim coupon atomically if one was applied
      let claimedCouponId: string | null = null;
      if (appliedCoupon) {
        console.log('🎟️ Attempting to claim coupon:', appliedCoupon.code);
        const claimedCoupon = await claimCoupon(appliedCoupon.code);

        if (!claimedCoupon) {
          toast.error('كود الخصم غير صالح أو انتهت صلاحيته. الرجاء إزالته والمحاولة مرة أخرى.');
          setIsSubmitting(false);
          return;
        }

        claimedCouponId = claimedCoupon.id;
        console.log('✅ Coupon claimed successfully:', claimedCouponId);
      }

      // Prepare order data with shipping cost
      const orderData = {
        order_number: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_info: {
          user_id: user.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: {
            street: formData.street.trim(),
            city: formData.city.trim(), // User-entered city
            governorate: formData.governorate, // Governorate key
            governorate_label: getGovernorateLabel(formData.governorate), // Arabic governorate name
            zipCode: formData.zipCode.trim(),
          }
        },
        items: orderItems,
        subtotal: subtotal,
        shipping_cost: shippingCost, // SAVE shipping cost
        total_amount: total,
        status: 'PENDING',
        payment_status: formData.paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
        payment_info: {
          method: formData.paymentMethod,
        },
        notes: formData.notes?.trim() || '',
        ...(appliedCoupon && claimedCouponId && {
          coupon_info: {
            coupon_id: claimedCouponId,
            code: appliedCoupon.code,
            discountAmount: discountAmount
          }
        })
      };

      console.log('Submitting order with shipping:', orderData);

      // Save order to database
      const createdOrder = await addOrder(orderData);

      // Record coupon redemption if applicable
      if (appliedCoupon && claimedCouponId) {
        await ApplyCouponService.recordRedemption(claimedCouponId, createdOrder.id);
      }

      console.log('Order successfully created and saved:', createdOrder);

      // Show success message
      toast.success(`تم إرسال الطلب بنجاح! رقم الطلب: ${orderData.order_number}`);

      // Clear cart and complete order process
      if (onOrderComplete) {
        onOrderComplete();
      }

    } catch (error: any) {
      console.error('Order creation failed:', error);
      toast.error('فشل في إرسال الطلب: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">الاسم بالكامل *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="اسمك الكامل"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">البريد الإلكتروني *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="البريد الإلكتروني"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">رقم الهاتف *</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="رقم هاتفك"
          required
        />
      </div>

      <div>
        <Label htmlFor="street">العنوان بالتفصيل (المبنى، الشقة، الشارع) *</Label>
        <Input
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="مثال: عمارة 5، شقة 12، شارع النصر"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">المدينة *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="مثال: مدينة نصر، المعادي"
            required
          />
        </div>
        <div>
          <Label className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            المحافظة *
          </Label>
          <Select value={formData.governorate} onValueChange={handleGovernorateChange}>
            <SelectTrigger>
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent>
              {EGYPTIAN_GOVERNORATES.map((gov) => (
                <SelectItem key={gov.value} value={gov.value}>
                  {gov.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zipCode">الرمز البريدي</Label>
          <Input
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="الرمز البريدي (اختياري)"
          />
        </div>
      </div>

      {/* Shipping Cost Display */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>المجموع الفرعي</span>
          <span>{subtotal.toFixed(2)} ج.م</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Shipping ({getGovernorateLabel(formData.governorate)})
          </span>
          <span>
            {isCalculatingShipping ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                جاري الحساب...
              </span>
            ) : shippingCost === 0 ? (
              <span className="text-green-600 font-semibold">مجانًا</span>
            ) : (
              `${shippingCost.toFixed(2)} EGP`
            )}
          </span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm text-primary">
            <span>الخصم ({appliedCoupon.code})</span>
            <span>-{discountAmount.toFixed(2)} ج.م</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>الإجمالي</span>
          <span>{total.toFixed(2)} ج.م</span>
        </div>
      </div>

      <div>
        <Label htmlFor="paymentMethod">طريقة الدفع</Label>
        <div className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800">
          الدفع عند الاستلام
        </div>
        <input
          type="hidden"
          name="paymentMethod"
          value="CASH"
        />
      </div>

      <div>
        <Label htmlFor="notes">ملاحظات الطلب (اختياري)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="أي تعليمات خاصة للتوصيل؟"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={isSubmitting || isCalculatingShipping}
      >
        {isSubmitting ? 'جاري معالجة الطلب...' : `تأكيد الطلب - ${total.toFixed(2)} ج.م`}
      </Button>
    </form>
  );
};

export default OrderForm;
