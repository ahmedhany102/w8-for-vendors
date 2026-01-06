import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import { useBestSellers } from '@/hooks/useSections';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Package } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const BestSellers = () => {
  const navigate = useNavigate();
  const { products, loading } = useBestSellers(undefined, 50);

  const handleAddToCart = (product: any) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="p-0 h-auto font-normal text-primary hover:text-primary/80"
              >
                Home
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Best Sellers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Star className="w-6 h-6 text-primary" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold">Best Sellers</h1>
          </div>
          <p className="text-muted-foreground">
            Our most popular products loved by customers
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} products
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Best Sellers Yet</h2>
            <p className="text-muted-foreground mb-6">
              Check back later for our top products
            </p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  discount: product.discount,
                  main_image: product.image_url,
                  image_url: product.image_url,
                  rating: product.rating,
                  stock: (product as any).stock,
                  inventory: (product as any).inventory,
                }}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BestSellers;
