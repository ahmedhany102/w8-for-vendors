
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useProductCatalogLogic = (products: any[]) => {
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setFilteredProducts(products);
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage', error);
      }
    }
    
    const handleCartUpdate = () => {
      const updatedCartJSON = localStorage.getItem('cart');
      if (updatedCartJSON) {
        try {
          const updatedCart = JSON.parse(updatedCartJSON);
          setCart(updatedCart);
        } catch (error) {
          console.error("Error parsing updated cart data:", error);
        }
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [products]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      filterProductsByCategory(activeTab);
    } else {
      const lowercaseQuery = query.toLowerCase();
      
      const searchResults = products.filter(product => {
        if (!product) return false;
        
        const matchesSearch = 
          (product.name?.toLowerCase().includes(lowercaseQuery) || false) || 
          (product.description?.toLowerCase().includes(lowercaseQuery) || false);
        
        const matchesCategory = activeTab === 'ALL' || 
                                (activeTab === 'T-Shirts' && product.type === 'T-Shirts') ||
                                (activeTab === 'Trousers' && product.type === 'Trousers') ||
                                (activeTab === 'Shoes' && product.type === 'Shoes') ||
                                (activeTab === 'Jackets' && product.type === 'Jackets');
        
        return matchesSearch && matchesCategory;
      });
      
      setFilteredProducts(searchResults);
    }
  };

  const filterProductsByCategory = (category: string) => {
    if (category === 'ALL') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product && product.type === category);
      setFilteredProducts(filtered);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    filterProductsByCategory(value);
    
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleAddToCart = async (product: any, size: string, quantity: number = 1) => {
    if (!user) {
      localStorage.setItem('pendingProduct', JSON.stringify(product));
      toast.info('Please login to add items to your cart');
      navigate('/login');
      return;
    }
    if (isAdmin) {
      toast.error("Admin accounts cannot make purchases");
      return;
    }
    
    if (product.sizes) {
      const sizeObj = product.sizes.find(s => s && s.size === size);
      if (sizeObj && sizeObj.stock <= 0) {
        toast.error('This product is out of stock');
        return;
      }
    }
    
    const cartDb = (await import('@/models/CartDatabase')).default.getInstance();
    const success = await cartDb.addToCart(product, size.toString(), product.colors?.[0] || "", quantity);
    if (success) {
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`${product.name} added to cart`);
    } else {
      toast.error('Failed to add product to cart');
    }
  };

  const handleUpdateCartItem = (productId: string, quantity: number) => {
    if (!productId) {
      console.error("Invalid productId provided to handleUpdateCartItem");
      return;
    }
    
    if (quantity <= 0) {
      const updatedCart = cart.filter(item => item && item.product && item.product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } else {
      const updatedCart = cart.map(item => 
        item.product && item.product.id === productId 
          ? { 
              ...item, 
              quantity,
            } 
          : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
    
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    setShowCartDialog(false);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      toast.error('Please log in to checkout');
      navigate('/login');
      return;
    }
    
    if (isAdmin) {
      toast.error("Admin accounts cannot make purchases");
      return;
    }
    
    navigate('/cart');
    setShowCartDialog(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    handleSearch('');
  };

  return {
    filteredProducts,
    activeTab,
    cart,
    showCartDialog,
    searchQuery,
    setShowCartDialog,
    handleSearch,
    handleTabChange,
    handleAddToCart,
    handleUpdateCartItem,
    handleClearCart,
    handleProceedToCheckout,
    handleClearSearch
  };
};
