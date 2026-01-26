
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Package, Heart, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import CartDatabase from "@/models/CartDatabase";

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user, isVendor } = useAuth();
  const { t, direction } = useLanguageSafe();
  const [cartItemCount, setCartItemCount] = useState(0);

  // ===========================================
  // VENDOR CONTEXT DETECTION FROM URL PATH
  // ===========================================
  // BottomNavigation is rendered OUTSIDE VendorContextProvider in App.tsx
  // So we detect vendor context by parsing the URL path directly
  const vendorContext = useMemo(() => {
    const match = location.pathname.match(/^\/store\/([^/]+)/);
    if (match) {
      return {
        isVendorContext: true,
        vendorSlug: match[1]
      };
    }
    return {
      isVendorContext: false,
      vendorSlug: null
    };
  }, [location.pathname]);

  const { isVendorContext, vendorSlug } = vendorContext;

  // Check if we're on admin or vendor dashboard pages
  const isOnAdminPages = location.pathname.includes('/admin');
  const isOnVendorDashboard = location.pathname.includes('/vendor');

  // ===========================================
  // DYNAMIC NAVIGATION TARGETS
  // ===========================================
  // When in vendor context, ALL navigation stays vendor-scoped
  const homeLink = isVendorContext && vendorSlug
    ? `/store/${vendorSlug}`
    : '/';

  const cartLink = isVendorContext && vendorSlug
    ? `/store/${vendorSlug}/cart`
    : '/cart';

  const profileLink = isVendorContext && vendorSlug
    ? `/store/${vendorSlug}/profile`
    : '/profile';

  const ordersLink = isVendorContext && vendorSlug
    ? `/store/${vendorSlug}/orders`
    : '/orders';

  const favoritesLink = isVendorContext && vendorSlug
    ? `/store/${vendorSlug}/favorites`
    : '/favorites';

  // Check active states
  const isHomeActive = isVendorContext && vendorSlug
    ? location.pathname === `/store/${vendorSlug}` || location.pathname === `/store/${vendorSlug}/`
    : location.pathname === '/';

  const isCartActive = isVendorContext && vendorSlug
    ? location.pathname === `/store/${vendorSlug}/cart`
    : location.pathname === '/cart';

  const isProfileActive = isVendorContext && vendorSlug
    ? location.pathname === `/store/${vendorSlug}/profile`
    : location.pathname === '/profile';

  const isOrdersActive = isVendorContext && vendorSlug
    ? location.pathname === `/store/${vendorSlug}/orders`
    : location.pathname.includes('/orders');

  const isFavoritesActive = isVendorContext && vendorSlug
    ? location.pathname === `/store/${vendorSlug}/favorites`
    : location.pathname === '/favorites';

  // Update cart count
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const cartDb = await CartDatabase.getInstance();
        const cartItems = await cartDb.getCartItems();
        setCartItemCount(cartItems.length);
      } catch (error) {
        console.error("Error updating cart count:", error);
      }
    };

    updateCartCount();

    // Listen for cart updates
    window.addEventListener("cartUpdated", updateCartCount);
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  // Don't show bottom navigation on admin or vendor dashboard pages
  if (isOnAdminPages || isOnVendorDashboard) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-[9999]"
      dir={direction}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-14">
        {/* Home - vendor-scoped when in vendor context */}
        <Link
          to={homeLink}
          className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
            isHomeActive ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isHomeActive ? 'font-medium' : ''}`}>
            {isVendorContext ? (t?.vendor?.myStore || 'Store') : (t?.nav?.home || 'Home')}
          </span>
        </Link>

        {/* Cart - vendor-scoped when in vendor context */}
        <Link
          to={cartLink}
          className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors relative ${
            isCartActive ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${isCartActive ? 'stroke-[2.5]' : ''}`} />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 ${direction === 'rtl' ? '-start-2' : '-end-2'} bg-primary text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${isCartActive ? 'font-medium' : ''}`}>
            {t?.nav?.cart || 'Cart'}
          </span>
        </Link>

        {/* Favorites - vendor-scoped when in vendor context */}
        {user && (
          <Link
            to={favoritesLink}
            className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
              isFavoritesActive ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavoritesActive ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] mt-0.5 ${isFavoritesActive ? 'font-medium' : ''}`}>
              {t?.nav?.favorites || 'Favorites'}
            </span>
          </Link>
        )}

        {/* Show vendor dashboard link for vendor users */}
        {isVendor && (
          <Link
            to="/vendor"
            className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
              location.pathname.startsWith('/vendor') ? 'text-primary' : 'text-gray-500'
            }`}
          >
            <Store className={`w-5 h-5 ${location.pathname.startsWith('/vendor') ? 'stroke-[2.5]' : ''}`} />
            <span className={`text-[10px] mt-0.5 ${location.pathname.startsWith('/vendor') ? 'font-medium' : ''}`}>
              {t?.vendor?.myStore || 'My Store'}
            </span>
          </Link>
        )}

        {/* Account - vendor-scoped when in vendor context */}
        <Link
          to={profileLink}
          className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
            isProfileActive ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <User className={`w-5 h-5 ${isProfileActive ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isProfileActive ? 'font-medium' : ''}`}>
            {t?.nav?.profile || 'Account'}
          </span>
        </Link>

        {/* Orders - vendor-scoped when in vendor context */}
        <Link
          to={ordersLink}
          className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
            isOrdersActive ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <Package className={`w-5 h-5 ${isOrdersActive ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isOrdersActive ? 'font-medium' : ''}`}>
            {t?.nav?.orders || 'Orders'}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;
