import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import CartDatabase, { CartItem } from '@/models/CartDatabase';
import OrderDatabase from '@/models/OrderDatabase';
import OrderForm from '@/components/OrderForm';
import { Trash2, ShoppingCart, CircleDollarSign, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ApplyCouponService } from '@/services/applyCouponService';

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cart');
  const [orderNotes, setOrderNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; couponId?: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast.error('Please login to view your cart');
      navigate('/login');
      return;
    }
    
    loadCartItems();
  }, [user, navigate]);
  
  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const cartDb = CartDatabase.getInstance();
      const items = await cartDb.getCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Failed to load your cart items');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await handleRemoveItem(itemId);
        return;
      }
      
      const cartDb = CartDatabase.getInstance();
      const success = await cartDb.updateQuantity(itemId, newQuantity);
      
      if (success) {
        const updatedItems = cartItems.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      const cartDb = CartDatabase.getInstance();
      const success = await cartDb.removeFromCart(itemId);
      
      if (success) {
        const updatedItems = cartItems.filter(item => item.id !== itemId);
        setCartItems(updatedItems);
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item from cart');
    }
  };
  
  const handleClearCart = async () => {
    try {
      const cartDb = CartDatabase.getInstance();
      const success = await cartDb.clearCart();
      
      if (success) {
        setCartItems([]);
        toast.success('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };
  
  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setActiveTab('checkout');
  };
  
  const handleContinueShopping = () => {
    navigate('/');
  };
  
  const handleOrderComplete = async () => {
    try {
      // Clear cart after successful order
      const cartDb = CartDatabase.getInstance();
      await cartDb.clearCart();
      setCartItems([]);
      
      // Show success message and redirect
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('الرجاء إدخال كود الخصم');
      return;
    }

    try {
      // Convert cart items to the expected format
      const formattedCartItems = cartItems.map(item => ({
        product_id: item.productId,
        variant_id: null, // CartItem doesn't have variant_id
        quantity: item.quantity,
        unit_price: item.price
      }));

      const result = await ApplyCouponService.applyCoupon(
        couponCode.trim(),
        formattedCartItems,
        subtotal
      );
      
      if (result.ok && result.coupon && result.discount !== undefined) {
        setAppliedCoupon({ 
          code: result.coupon.code, 
          discount: result.discount,
          couponId: result.coupon.id
        });
        setCouponError('');
        toast.success('تم تطبيق كود الخصم بنجاح');
      } else {
        setCouponError(result.message || 'كود الخصم غير صالح');
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError('حدث خطأ أثناء التحقق من كود الخصم');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };
  
  // Calculate cart totals with coupon discount
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 0 ? 25 : 0;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal + shippingFee - discountAmount;
  
  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-gradient-to-r from-green-900 to-black">
            <TabsTrigger 
              value="cart" 
              className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800 py-3"
              disabled={activeTab === 'checkout'}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shopping Cart
            </TabsTrigger>
            <TabsTrigger 
              value="checkout" 
              className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800 py-3"
              disabled={cartItems.length === 0}
            >
              <CircleDollarSign className="h-4 w-4 mr-2" />
              Checkout
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cart" className="space-y-4">
            <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-6">Add items to your cart to proceed with checkout.</p>
                <Button 
                  onClick={handleContinueShopping}
                  className="bg-green-800 hover:bg-green-900"
                >
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white py-3">
                      <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div className="flex items-center">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-md mr-4"
                                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64' }}
                                />
                              )}
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                {item.size && <p className="text-gray-500 text-sm">المقاس: {item.size}</p>}
                                {item.color && <p className="text-gray-500 text-sm">اللون: {item.color}</p>}
                                <p className="text-gray-500 text-sm">{item.price.toFixed(2)} EGP</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center mt-3 sm:mt-0">
                              <div className="flex items-center border rounded-md">
                                <button 
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-md"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                >
                                  -
                                </button>
                                <span className="px-4 py-1">{item.quantity}</span>
                                <button 
                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-md"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                >
                                  +
                                </button>
                              </div>
                              <div className="ml-4 font-medium text-right min-w-[80px]">{(item.price * item.quantity).toFixed(2)} EGP</div>
                              <button 
                                className="ml-3 text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center mt-6">
                        <Button 
                          className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={handleClearCart}
                        >
                          <Trash2 size={16} className="mr-2" /> Clear Cart
                        </Button>
                        <Button 
                          onClick={handleContinueShopping}
                        >
                          <ArrowLeft size={16} className="mr-2" /> Continue Shopping
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white py-3">
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between py-2">
                        <span>Subtotal</span>
                        <span className="font-medium">{subtotal.toFixed(2)} EGP</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>Shipping Fee</span>
                        <span className="font-medium">{shippingFee.toFixed(2)} EGP</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-2">
                        <span className="font-bold">Total</span>
                        <span className="font-bold">{total.toFixed(2)} EGP</span>
                      </div>
                      
                      <Button 
                        className="w-full bg-green-800 hover:bg-green-900 mt-4"
                        onClick={handleProceedToCheckout}
                      >
                        Proceed to Checkout
                      </Button>
                      
                      <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
                        <ShieldCheck size={14} className="mr-2" />
                        <span>Secure Checkout</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="checkout" className="space-y-6">
            <div className="flex items-center mb-6">
              <Button 
                className="mr-4"
                onClick={() => setActiveTab('cart')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Cart
              </Button>
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white py-3">
                    <CardTitle>Complete Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <OrderForm 
                      cartItems={cartItems.map(item => ({
                        ...item,
                        color: item.color || '-',
                        size: item.size || '-'
                      }))}
                      total={total}
                      onOrderComplete={handleOrderComplete}
                      appliedCoupon={appliedCoupon}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white py-3">
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="max-h-80 overflow-y-auto mb-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex items-center">
                            <span className="font-medium">{item.quantity}x</span>
                            <span className="ml-2 text-sm line-clamp-1">{item.name}</span>
                          </div>
                          <span className="font-medium text-sm">
                            {(item.price * item.quantity).toFixed(2)} EGP
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{subtotal.toFixed(2)} EGP</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{shippingFee.toFixed(2)} EGP</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-{discountAmount.toFixed(2)} EGP</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>{total.toFixed(2)} EGP</span>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-4 space-y-2">
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleApplyCoupon}
                            className="bg-green-800 hover:bg-green-900"
                          >
                            Apply
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <span className="text-sm text-green-800">
                            Coupon applied: {appliedCoupon.code} ({appliedCoupon.discount}% off)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                      {couponError && (
                        <p className="text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Cart;
