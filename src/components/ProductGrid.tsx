
import React from 'react';
import ProductCard from './ProductCard';
import { Button } from './ui/button';
import { ProductVariant } from '@/hooks/useProductVariants';

interface ProductGridProps {
  products: any[];
  loading: boolean;
  searchQuery: string;
  onAddToCart: (product: any, size: string, quantity?: number) => Promise<void>;
  onClearSearch: () => void;
  variantsByProduct?: Record<string, ProductVariant[]>;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  loading, 
  searchQuery, 
  onAddToCart, 
  onClearSearch,
  variantsByProduct = {}
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-muted animate-pulse" style={{ minHeight: '380px' }}>
            <div className="aspect-square bg-muted-foreground/10 rounded-t-lg mb-3" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-6 bg-muted-foreground/20 rounded w-1/2" />
              <div className="h-10 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-xl text-gray-500 mb-4">No products found</p>
        <Button 
          onClick={onClearSearch}
          className="bg-green-800 hover:bg-green-900 interactive-button"
        >
          Clear Search
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {products.filter(product => product).map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAddToCart={onAddToCart}
          variants={variantsByProduct[product.id] || []}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
