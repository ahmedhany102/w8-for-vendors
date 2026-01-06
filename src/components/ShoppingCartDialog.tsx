
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from './ui/button';

interface ShoppingCartDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  cart: {product: any, quantity: number}[];
  onUpdateCartItem: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

const ShoppingCartDialog: React.FC<ShoppingCartDialogProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateCartItem,
  onClearCart,
  onProceedToCheckout
}) => {
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-green-900 to-black text-white" aria-describedby="cart-contents">
        <div className="space-y-4" id="cart-contents">
          <h2 className="text-xl font-bold text-white border-b border-green-800 pb-2">Shopping Cart</h2>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {cart.filter(item => item && item.product && item.product.id).map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center p-2 border-b border-green-800">
                    <div>
                      <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-300">{item.product?.price?.toFixed(2) || '0.00'} EGP × {item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => onUpdateCartItem(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-green-800 hover:bg-green-700 interactive-button"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateCartItem(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-green-800 hover:bg-green-700 interactive-button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-green-800 pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{calculateTotal().toFixed(2)} EGP</span>
                </div>
                <p className="text-sm text-green-300 mt-2">Payment Method: Cash on Delivery</p>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={onClearCart}
                  className="border-red-700 text-red-400 hover:bg-red-900/30"
                >
                  Clear Cart
                </Button>
                <Button 
                  onClick={onProceedToCheckout}
                  className="bg-green-800 hover:bg-green-700 interactive-button"
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShoppingCartDialog;
