
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { claimCoupon } from '@/services/claimCouponService';
import { ApplyCouponService } from '@/services/applyCouponService';

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
  }[];
  total: number;
  onOrderComplete?: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    couponId?: string;
  } | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ cartItems, total, onOrderComplete, appliedCoupon }) => {
  const { user, session } = useAuth();
  const { addOrder } = useSupabaseOrders();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    zipCode: '',
    notes: '',
    paymentMethod: 'CASH',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        toast.error('Street address is required');
        return;
      }
      
      if (!formData.city?.trim()) {
        toast.error('City is required');
        return;
      }
      
      if (!formData.zipCode?.trim()) {
        toast.error('Zip code is required');
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
        cartItems: cartItems.length
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

      // Calculate discount (appliedCoupon.discount is already the amount in EGP)
      const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;

      // Prepare order data with explicit user linking
      const orderData = {
        order_number: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_info: {
          user_id: user.id, // CRITICAL: Store user ID for proper linking
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: {
            street: formData.street.trim(),
            city: formData.city.trim(),
            zipCode: formData.zipCode.trim(),
          }
        },
        items: orderItems,
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

      console.log('Submitting order with proper user linking:', orderData);

      // Save order to database
      const createdOrder = await addOrder(orderData);
      
      // Record coupon redemption if applicable
      if (appliedCoupon && claimedCouponId) {
        await ApplyCouponService.recordRedemption(claimedCouponId, createdOrder.id);
      }
      
      console.log('Order successfully created and saved:', createdOrder);

      // Show success message
      toast.success(`Order placed successfully! Order #${orderData.order_number}`);

      // Clear cart and complete order process
      if (onOrderComplete) {
        onOrderComplete();
      }

    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Failed to place order: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Your phone number"
          required
        />
      </div>

      <div>
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="Street name and number"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            required
          />
        </div>
        <div>
          <Label htmlFor="zipCode">Zip Code *</Label>
          <Input
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Zip Code"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <div className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800">
          Cash on Delivery
        </div>
        <input
          type="hidden"
          name="paymentMethod"
          value="CASH"
        />
      </div>

      <div>
        <Label htmlFor="notes">Order Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any special instructions for delivery?"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-green-800 hover:bg-green-900"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Processing Order...' : 'Complete Order'}
      </Button>
    </form>
  );
};

export default OrderForm;
