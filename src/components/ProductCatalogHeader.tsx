
import React from 'react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCatalogHeaderProps {
  cart: {product: any, quantity: number}[];
  onCartClick: () => void;
}

const ProductCatalogHeader: React.FC<ProductCatalogHeaderProps> = ({ cart, onCartClick }) => {
  const { user, isAdmin } = useAuth();

  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);

  return (
    <div className="flex justify-between items-center mb-6 min-h-[48px]">
      <h2 className="text-3xl font-bold text-green-500">Our Products</h2>
      {user && !isAdmin && (
        <div className="relative">
          <Button
            onClick={onCartClick}
            className="bg-green-800 hover:bg-green-900 interactive-button"
          >
            Cart ({cartItemCount})
          </Button>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCatalogHeader;
