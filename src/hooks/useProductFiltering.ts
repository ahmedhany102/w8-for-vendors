import { useState, useMemo } from 'react';

interface Category {
  id: string;
  parent_id: string | null;
}

interface FilteringOptions {
  categories?: Category[];
  childCategoryIds?: string[];
}

export const useProductFiltering = (products: any[], options?: FilteringOptions) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category hierarchy
    if (selectedSubcategoryId) {
      // Specific subcategory selected
      filtered = filtered.filter(product => product.category_id === selectedSubcategoryId);
    } else if (selectedCategoryId) {
      // Check if this is a parent category with children
      if (options?.childCategoryIds && options.childCategoryIds.length > 0) {
        // Parent category - include all products from child categories
        filtered = filtered.filter(product =>
          options.childCategoryIds!.includes(product.category_id)
        );
      } else {
        // Regular category or child category - exact match
        filtered = filtered.filter(product => product.category_id === selectedCategoryId);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, searchQuery, selectedCategoryId, selectedSubcategoryId, options?.childCategoryIds]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    // Reset subcategory when main category changes
    setSelectedSubcategoryId(null);
  };

  const handleSubcategoryFilter = (subcategoryId: string | null) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
  };

  return {
    filteredProducts,
    searchQuery,
    selectedCategoryId,
    selectedSubcategoryId,
    handleSearch,
    handleCategoryFilter,
    handleSubcategoryFilter,
    clearFilters
  };
};
