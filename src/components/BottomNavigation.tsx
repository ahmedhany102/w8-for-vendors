
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Package, Truck, Heart, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import CartDatabase from "@/models/CartDatabase";

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { user, isVendor } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Check if we're on admin or vendor pages
  const isOnAdminPages = location.pathname.startsWith('/admin');
  const isOnVendorPages = location.pathname.startsWith('/vendor');

  // Update cart count
  useEffect(() => {
    console.log("BottomNavigation mounted");
    
    const updateCartCount = async () => {
      try {
        const cartDb = await CartDatabase.getInstance();
        const cartItems = await cartDb.getCartItems();
        setCartItemCount(cartItems.length);
        console.log("Cart items updated:", cartItems.length);
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

  // Don't show bottom navigation on admin or vendor pages
  if (isOnAdminPages || isOnVendorPages) {
    console.log("On admin/vendor page - hiding bottom navigation");
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-50">
      <div className="flex justify-between items-center">
        <Link 
          to="/" 
          className={`flex flex-1 flex-col items-center py-3 ${
            location.pathname === '/' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">الرئيسية</span>
        </Link>
        
        <Link 
          to="/cart" 
          className={`flex flex-1 flex-col items-center py-3 relative ${
            location.pathname === '/cart' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute top-0 right-[30%] bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs">العربة</span>
        </Link>
        
        {user && (
          <Link 
            to="/favorites" 
            className={`flex flex-1 flex-col items-center py-3 ${
              location.pathname === '/favorites' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">المفضلة</span>
          </Link>
        )}
        
        {/* Show vendor link for vendor users */}
        {isVendor && (
          <Link 
            to="/vendor" 
            className={`flex flex-1 flex-col items-center py-3 ${
              location.pathname.startsWith('/vendor') ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-xs">متجري</span>
          </Link>
        )}
        
        <Link 
          to="/profile"
          className={`flex flex-1 flex-col items-center py-3 ${
            location.pathname === '/profile' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">حسابي</span>
        </Link>
        
        <Link 
          to="/orders" 
          className={`flex flex-1 flex-col items-center py-3 ${
            location.pathname.includes('/orders') ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">طلباتي</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNavigation;
