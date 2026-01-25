
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
  const isOnAdminPages = location.pathname.startsWith('/admin');
  const isOnVendorDashboard = location.pathname.startsWith('/vendor');

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
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className={`flex ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
        {/* Home - vendor-scoped when in vendor context */}
        <Link
          to={homeLink}
          className={`flex flex-1 flex-col items-center py-3 ${isHomeActive ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">{isVendorContext ? (t?.vendor?.myStore || 'المتجر') : (t?.nav?.home || 'الرئيسية')}</span>
        </Link>

        {/* Cart - vendor-scoped when in vendor context */}
        <Link
          to={cartLink}
          className={`flex flex-1 flex-col items-center py-3 relative ${isCartActive ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-[30%] bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs">{t?.nav?.cart || 'العربة'}</span>
        </Link>

        {/* Favorites - vendor-scoped when in vendor context */}
        {user && (
          <Link
            to={favoritesLink}
            className={`flex flex-1 flex-col items-center py-3 ${isFavoritesActive ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">{t?.nav?.favorites || 'المفضلة'}</span>
          </Link>
        )}

        {/* Show vendor dashboard link for vendor users */}
        {isVendor && (
          <Link
            to="/vendor"
            className={`flex flex-1 flex-col items-center py-3 ${location.pathname.startsWith('/vendor') ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-xs">{t?.vendor?.myStore || 'متجري'}</span>
          </Link>
        )}

        {/* Account - vendor-scoped when in vendor context */}
        <Link
          to={profileLink}
          className={`flex flex-1 flex-col items-center py-3 ${isProfileActive ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">{t?.nav?.profile || 'حسابي'}</span>
        </Link>

        {/* Orders - vendor-scoped when in vendor context */}
        <Link
          to={ordersLink}
          className={`flex flex-1 flex-col items-center py-3 ${isOrdersActive ? 'text-primary' : 'text-muted-foreground'
            }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">{t?.nav?.orders || 'طلباتي'}</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;
