import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';

interface CategoryGridProps {
  title?: string;
  limit?: number;
  onCategorySelect?: (categoryId: string | null) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  title = 'تصفح الفئات',
  limit = 12,
  onCategorySelect
}) => {
  const { mainCategories, loading } = useCategories();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCategoryClick = (category: { id: string | null; slug: string }) => {
    if (onCategorySelect) {
      onCategorySelect(category.id);
    } else if (category.slug && category.slug !== 'all') {
      navigate(`/category/${category.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold mb-4">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayCategories = mainCategories.slice(0, limit);

  if (displayCategories.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        <div className="hidden md:flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Categories Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {displayCategories.map((category) => (
          <div
            key={category.id}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            style={{ scrollSnapAlign: 'start' }}
            onClick={() => handleCategoryClick({ id: category.id, slug: category.slug })}
          >
            {/* Category Image Circle */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-transparent group-hover:border-primary transition-all overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Package className="w-8 h-8 text-primary/60" />
              )}
            </div>
            
            {/* Category Name */}
            <span className="text-xs md:text-sm font-medium text-center max-w-[80px] md:max-w-[96px] truncate group-hover:text-primary transition-colors">
              {category.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
