import React, { useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface HierarchicalCategorySelectorProps {
  parentCategoryId: string | null;
  childCategoryId: string | null;
  onParentChange: (parentId: string | null) => void;
  onChildChange: (childId: string | null) => void;
}

/**
 * A two-level category selector: Parent → Child
 * Products must be assigned to a child category (not parent).
 */
const HierarchicalCategorySelector: React.FC<HierarchicalCategorySelectorProps> = ({
  parentCategoryId,
  childCategoryId,
  onParentChange,
  onChildChange,
}) => {
  const { categories, mainCategories, subcategories, loading } = useCategories();

  // Get children of selected parent
  const childCategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return subcategories(parentCategoryId);
  }, [parentCategoryId, subcategories]);

  const handleParentChange = (value: string) => {
    const newParentId = value === "none" ? null : value;
    onParentChange(newParentId);
    // Reset child when parent changes
    onChildChange(null);
  };

  const handleChildChange = (value: string) => {
    onChildChange(value || null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="block text-sm font-medium mb-1">الفئة الرئيسية</Label>
          <div className="w-full p-2 border rounded text-sm bg-muted animate-pulse h-10" />
        </div>
        <div>
          <Label className="block text-sm font-medium mb-1">الفئة الفرعية</Label>
          <div className="w-full p-2 border rounded text-sm bg-muted animate-pulse h-10" />
        </div>
      </div>
    );
  }

  if (mainCategories.length === 0) {
    return (
      <div className="space-y-3">
        <Label className="block text-sm font-medium">الفئة *</Label>
        <div className="w-full p-2 border rounded text-sm bg-muted text-muted-foreground">
          لا توجد فئات متاحة - يرجى إضافة فئات من لوحة التحكم
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Parent Category */}
      <div>
        <Label className="block text-sm font-medium mb-1">الفئة الرئيسية *</Label>
        <Select
          value={parentCategoryId || "none"}
          onValueChange={handleParentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="اختر الفئة الرئيسية" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50 shadow-lg border">
            <SelectItem value="none">-- اختر الفئة الرئيسية --</SelectItem>
            {mainCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Child Category */}
      <div>
        <Label className="block text-sm font-medium mb-1">الفئة الفرعية *</Label>
        <Select
          value={childCategoryId || ""}
          onValueChange={handleChildChange}
          disabled={!parentCategoryId || childCategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                !parentCategoryId 
                  ? "اختر الفئة الرئيسية أولاً" 
                  : childCategories.length === 0 
                    ? "لا توجد فئات فرعية" 
                    : "اختر الفئة الفرعية"
              } 
            />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50 shadow-lg border">
            {childCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {parentCategoryId && childCategories.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            لا توجد فئات فرعية لهذه الفئة - يرجى إضافة فئات فرعية من لوحة التحكم
          </p>
        )}
      </div>
    </div>
  );
};

export default HierarchicalCategorySelector;
