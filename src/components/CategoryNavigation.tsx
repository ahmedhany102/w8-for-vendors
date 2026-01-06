import React from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';

interface CategoryNavigationProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string | null;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({ 
  onCategorySelect, 
  selectedCategory 
}) => {
  const { mainCategories, loading } = useCategories();
  const navigate = useNavigate();

  const handleCategoryClick = (category: any) => {
    if (onCategorySelect) {
      onCategorySelect(category.id);
    } else {
      navigate(`/category/${category.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="mb-8 min-h-[116px]">
        <h3 className="text-lg font-semibold mb-4">تصفح حسب الفئة</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (mainCategories.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 min-h-[116px]">
      <h3 className="text-lg font-semibold mb-4">تصفح حسب الفئة</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
        {/* All Products Option */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] min-h-[84px] ${
            !selectedCategory ? 'ring-1 ring-primary' : ''
          }`}
          onClick={() => handleCategoryClick({ id: null, slug: 'all', name: 'جميع المنتجات' })}
        >
          <CardContent className="p-2 text-center">
            <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-medium text-xs truncate">جميع المنتجات</h4>
          </CardContent>
        </Card>

        {/* Category Cards */}
        {mainCategories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all hover:shadow-sm hover:scale-[1.02] min-h-[84px] ${
              selectedCategory === category.id ? 'ring-1 ring-primary' : ''
            }`}
            onClick={() => handleCategoryClick(category)}
          >
            <CardContent className="p-2 text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-primary/20 to-primary/10 rounded-md flex items-center justify-center overflow-hidden">
                {category.image_url ? (
                  <img 
                    src={category.image_url} 
                    alt={category.name}
                    width="32"
                    height="32"
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Package className="h-4 w-4 text-primary" />
                )}
              </div>
              <h4 className="font-medium text-xs truncate mb-1">{category.name}</h4>
              {category.product_count > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                  {category.product_count}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryNavigation;