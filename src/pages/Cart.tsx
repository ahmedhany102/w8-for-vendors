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
import { Trash2, ShoppingCart, CircleDollarSign, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { ApplyCouponService } from '@/services/applyCouponService';
import { useVendorContext } from '@/hooks/useVendorContext';
import { useVendorCategories } from '@/hooks/useVendors';
import VendorStoreHeader from '@/components/vendor/VendorStoreHeader';

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

  // Vendor context for vendor-scoped behavior
  const { isVendorContext, vendorSlug, vendorId: contextVendorId } = useVendorContext();
  const { mainCategories, subcategories } = useVendorCategories(contextVendorId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  useEffect(() => {
    // NO login guard for viewing cart
    // Login is only required for checkout
    loadCartItems();
  }, []);

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
        toast.success('تم حذف المنتج من السلة');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('فشل في حذف المنتج');
    }
  };

  const handleClearCart = async () => {
    try {
      const cartDb = CartDatabase.getInstance();
      const success = await cartDb.clearCart();

      if (success) {
        setCartItems([]);
        toast.success('تم إفراغ السلة');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('فشل في إفراغ السلة');
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('السلة فارغة');
      return;
    }

    // LOGIN GUARD - Only checkout requires login
    if (!user) {
      // Save redirect target before navigating to login
      const checkoutPath = isVendorContext && vendorSlug
        ? `/store/${vendorSlug}/checkout`
        : '/checkout';
      sessionStorage.setItem('redirectAfterLogin', checkoutPath);
      toast.info('الرجاء تسجيل الدخول لإكمال الطلب');

      // Redirect to vendor login when inside vendor store
      if (isVendorContext && vendorSlug) {
        navigate(`/store/${vendorSlug}/login`);
      } else {
        navigate('/login');
      }
      return;
    }

    setActiveTab('checkout');
  };

  const handleContinueShopping = () => {
    // Stay in vendor context if applicable
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}`);
    } else {
      navigate('/');
    }
  };

  const handleOrderComplete = async () => {
    try {
      // Clear cart after successful order
      const cartDb = CartDatabase.getInstance();
      await cartDb.clearCart();
      setCartItems([]);

      // Show success message and redirect based on context
      toast.success('تم إرسال الطلب بنجاح!');

      // Stay in vendor context if applicable
      if (isVendorContext && vendorSlug) {
        navigate(`/store/${vendorSlug}/orders`);
      } else {
        navigate('/orders');
      }
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

  // Calculate cart subtotal only (shipping calculated in OrderForm)
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;

  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      {/* Vendor Header when in vendor context */}
      {isVendorContext && contextVendorId && (
        <VendorStoreHeader
          vendorId={contextVendorId}
          mainCategories={mainCategories}
          subcategories={subcategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
        />
      )}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-primary">
            <TabsTrigger
              value="cart"
              className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary py-3"
              disabled={activeTab === 'checkout'}
            >
              <ShoppingCart className="h-4 w-4 ml-2" />
              سلة التسوق
            </TabsTrigger>
            <TabsTrigger
              value="checkout"
              className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary py-3"
              disabled={cartItems.length === 0}
            >
              <CircleDollarSign className="h-4 w-4 ml-2" />
              إتمام الشراء
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cart" className="space-y-4">
            <h1 className="text-2xl font-bold mb-6">سلتك</h1>

            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">سلة التسوق فارغة</h2>
                <p className="text-gray-500 mb-6">أضف منتجات للسلة لإتمام الشراء</p>
                <Button
                  onClick={handleContinueShopping}
                >
                  تصفح المنتجات
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="bg-primary text-primary-foreground py-3">
                      <CardTitle>المنتجات ({cartItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row-reverse justify-between items-start sm:items-center py-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                            <div className="flex flex-row-reverse items-center">
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
                          <Trash2 size={16} className="ml-2" /> إفراغ السلة
                        </Button>
                        <Button
                          onClick={handleContinueShopping}
                        >
                          <ArrowLeft size={16} className="ml-2" /> متابعة التسوق
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader className="bg-primary text-primary-foreground py-3">
                      <CardTitle>ملخص الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between py-2">
                        <span>المجموع الفرعي</span>
                        <span className="font-medium">{subtotal.toFixed(2)} ج.م</span>
                      </div>

                      <div className="flex justify-between py-2 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          الشحن
                        </span>
                        <span className="text-sm">يحسب عند الدفع</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between py-2">
                        <span className="font-bold">المجموع الفرعي</span>
                        <span className="font-bold">{subtotal.toFixed(2)} ج.م</span>
                      </div>

                      <Button
                        className="w-full mt-4"
                        onClick={handleProceedToCheckout}
                      >
                        إتمام الشراء
                      </Button>

                      <div className="flex items-center justify-center text-xs text-gray-500 mt-4">
                        <ShieldCheck size={14} className="mr-2" />
                        <span>دفع آمن</span>
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
                <ArrowLeft size={16} className="ml-2" />
                العودة للسلة
              </Button>
              <h1 className="text-2xl font-bold">إتمام الشراء</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-primary to-amber-700 text-white py-3">
                    <CardTitle>أكمل طلبك</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <OrderForm
                      cartItems={cartItems.map(item => ({
                        ...item,
                        color: item.color || '-',
                        size: item.size || '-'
                      }))}
                      subtotal={subtotal}
                      onOrderComplete={handleOrderComplete}
                      appliedCoupon={appliedCoupon}
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader className="bg-gradient-to-r from-primary to-amber-700 text-white py-3">
                    <CardTitle>ملخص الطلب</CardTitle>
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
                        <span>المجموع الفرعي</span>
                        <span>{subtotal.toFixed(2)} ج.م</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          Shipping
                        </span>
                        <span className="text-xs">See form below</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-{discountAmount.toFixed(2)} EGP</span>
                        </div>
                      )}
                    </div>

                    {/* Coupon Section */}
                    <div className="mt-4 space-y-2">
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="أدخل كود الخصم"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleApplyCoupon}
                          >
                            تطبيق
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-primary/10 p-2 rounded">
                          <span className="text-sm text-primary">
                            تم تطبيق الكوبون: {appliedCoupon.code} (خصم {appliedCoupon.discount}%)
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            إزالة
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
