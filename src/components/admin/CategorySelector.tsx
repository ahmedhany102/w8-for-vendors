
import React from "react";
import { useCategories } from "@/hooks/useCategories";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CategorySelectorProps {
  value: string | null;
  onChange: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  const { categories, loading } = useCategories();

  // Show all active categories (both main and subcategories)
  const allActiveCategories = categories.filter(cat => cat.is_active);

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <div className="w-full p-2 border rounded text-sm bg-gray-100">Loading categories...</div>
      </div>
    );
  }

  // Don't render Select until categories are loaded to avoid empty value issues
  if (allActiveCategories.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">الفئة*</label>
        <div className="w-full p-2 border rounded text-sm bg-muted text-muted-foreground">
          لا توجد فئات متاحة
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">الفئة*</label>
      <Select
        value={value || undefined}
        onValueChange={(val) => {
          console.log('🎯 Category selected via CategorySelector:', val);
          if (val) {
            onChange(val);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="اختر فئة" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50 shadow-lg border">
          {allActiveCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.parent_id ? `→ ${category.name}` : category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
