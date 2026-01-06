import { Product } from "./Product";

// الشكل القديم للعربة: لا يوجد مقاس، فقط منتج وسعر وصورة
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  size?: string;
  color?: string;
}

class CartDatabase {
  private static instance: CartDatabase;
  private STORAGE_KEY = 'cart';

  private constructor() {}

  public static getInstance(): CartDatabase {
    if (!CartDatabase.instance) {
      CartDatabase.instance = new CartDatabase();
    }
    return CartDatabase.instance;
  }

  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartItems = localStorage.getItem(this.STORAGE_KEY);
      return cartItems ? JSON.parse(cartItems) : [];
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  async addToCart(product: Product, size: string, color: string, quantity: number = 1, price?: number): Promise<boolean> {
    try {
      const cartItems = await this.getCartItems();
      const imageUrl = product.mainImage || product.main_image || product.image_url || (product.images && product.images[0]) || '';
      // كل منتج بمقاس ولون مختلف يعتبر عنصر منفصل
      const existingItemIndex = cartItems.findIndex(item => item.productId === product.id && item.size === size && item.color === color);
      if (existingItemIndex >= 0) {
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Use provided price, or find from sizes array, or use base product price
        const itemPrice = price || (product.sizes || []).find(s => s.size === size)?.price || product.price || 0;
        const newItem: CartItem = {
          id: `cart-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: itemPrice,
          quantity: quantity,
          imageUrl: imageUrl,
          size: size,
          color: color
        };
        cartItems.push(newItem);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartItems));
      console.log("Product added to cart:", product.name, "size:", size, "color:", color, "price:", price, "qty:", quantity);
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  }

  async updateQuantity(itemId: string, quantity: number): Promise<boolean> {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(itemId);
      }
      const cartItems = await this.getCartItems();
      const itemIndex = cartItems.findIndex(item => item.id === itemId);
      if (itemIndex >= 0) {
        cartItems[itemIndex].quantity = quantity;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartItems));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  }

  async removeFromCart(itemId: string): Promise<boolean> {
    try {
      let cartItems = await this.getCartItems();
      cartItems = cartItems.filter(item => item.id !== itemId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cartItems));
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  }

  async clearCart(): Promise<boolean> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }

  async getCartTotal(): Promise<number> {
    try {
      const cartItems = await this.getCartItems();
      return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    } catch (error) {
      console.error("Error calculating cart total:", error);
      return 0;
    }
  }

  async getItemCount(): Promise<number> {
    try {
      const cartItems = await this.getCartItems();
      return cartItems.reduce((count, item) => count + item.quantity, 0);
    } catch (error) {
      console.error("Error calculating item count:", error);
      return 0;
    }
  }
}

export default CartDatabase;
