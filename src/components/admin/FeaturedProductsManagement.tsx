
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from '@/models/Product';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { toast } from "sonner";

const FeaturedProductsManagement: React.FC = () => {
  const [featured, setFeatured] = useState<string[]>([]); // array of product ids
  
  // Use Supabase products hook instead of ProductDatabase
  const { products } = useSupabaseProducts();

  useEffect(() => {
    const stored = localStorage.getItem('featuredProducts');
    setFeatured(stored ? JSON.parse(stored) : []);
  }, []);

  const addFeatured = (id: string) => {
    if (featured.includes(id)) return;
    const updated = [...featured, id];
    setFeatured(updated);
    localStorage.setItem('featuredProducts', JSON.stringify(updated));
    toast.success('Product added to featured!');
  };

  const removeFeatured = (id: string) => {
    const updated = featured.filter(fid => fid !== id);
    setFeatured(updated);
    localStorage.setItem('featuredProducts', JSON.stringify(updated));
    toast.success('Product removed from featured.');
  };

  return (
    <CardContent className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-green-800">Manage Featured Products (Home Offers)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Card key={product.id} className={featured.includes(product.id) ? 'border-green-600 border-2' : ''}>
            <CardHeader className="flex flex-row items-center gap-4">
              <img 
                src={product.main_image || product.image_url || product.images?.[0] || '/placeholder.svg'} 
                alt={product.name} 
                className="w-16 h-16 object-cover rounded" 
              />
              <div>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <div className="text-sm text-gray-500">{product.price} EGP</div>
              </div>
            </CardHeader>
            <CardContent>
              {featured.includes(product.id) ? (
                <Button className="bg-red-600 hover:bg-red-700 text-white w-full" onClick={() => removeFeatured(product.id)}>
                  Remove from Featured
                </Button>
              ) : (
                <Button className="bg-green-700 hover:bg-green-800 text-white w-full" onClick={() => addFeatured(product.id)}>
                  Add to Featured
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </CardContent>
  );
};

export default FeaturedProductsManagement;
