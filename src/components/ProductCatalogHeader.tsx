
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';

interface ProductCatalogHeaderProps {
  cart: { product: any, quantity: number }[];
  onCartClick: () => void;
}

const ProductCatalogHeader: React.FC<ProductCatalogHeaderProps> = ({ cart, onCartClick }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useLanguageSafe();

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);

  // Hide cart button on vendor store pages - they have their own cart in bottom nav
  const isVendorStorePage = location.pathname.startsWith('/store/') || location.pathname.startsWith('/store');
  const showCartButton = user && !isAdmin && !isVendorStorePage;

  return (
    <div className="flex justify-between items-center mb-6 min-h-[48px]">
      <h2 className="text-3xl font-bold text-primary text-start">{t?.products?.title || 'Our Products'}</h2>
      {showCartButton && (
        <div className="relative">
          <Button
            onClick={onCartClick}
            className="bg-primary hover:bg-primary/90 interactive-button"
          >
            {t?.common?.cart || 'Cart'} ({cartItemCount})
          </Button>
          {cart.length > 0 && (
            <span className="absolute -top-2 -end-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCatalogHeader;
