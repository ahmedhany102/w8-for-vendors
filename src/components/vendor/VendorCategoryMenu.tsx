import React, { useState } from 'react';
import { X, ChevronDown, ChevronLeft, Package, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

interface VendorCategoryMenuProps {
    isOpen: boolean;
    onClose: () => void;
    vendorName: string;
    mainCategories: Category[];
    subcategories: (parentId: string) => Category[];
    selectedCategory: string | null;
    selectedSubcategory: string | null;
    onCategorySelect: (categoryId: string | null, subcategoryId: string | null) => void;
}

/**
 * Slide-in category menu drawer with:
 * - RTL support (slides from right in RTL)
 * - Hierarchical category tree
 * - Expandable parent categories
 */
const VendorCategoryMenu: React.FC<VendorCategoryMenuProps> = ({
    isOpen,
    onClose,
    vendorName,
    mainCategories,
    subcategories,
    selectedCategory,
    selectedSubcategory,
    onCategorySelect,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        onCategorySelect(null, null);
    };

    const handleSelectCategory = (categoryId: string) => {
        const children = subcategories(categoryId);
        if (children.length > 0) {
            // Has subcategories - expand/collapse
            toggleExpand(categoryId);
        } else {
            // No subcategories - select directly
            onCategorySelect(categoryId, null);
        }
    };

    const handleSelectSubcategory = (parentId: string, subcategoryId: string) => {
        onCategorySelect(parentId, subcategoryId);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer - RTL: slides from right, LTR: slides from left */}
            <div
                className={cn(
                    "fixed top-0 bottom-0 w-80 max-w-[85vw] bg-background z-50 shadow-xl transition-transform duration-300 ease-out",
                    // RTL: right side, LTR: left side
                    "right-0 rtl:right-0 ltr:left-0 ltr:right-auto",
                    isOpen
                        ? "translate-x-0"
                        : "translate-x-full rtl:translate-x-full ltr:-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="font-bold text-lg">{vendorName}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Category List */}
                <div className="overflow-y-auto h-[calc(100vh-65px)]">
                    {/* All Products */}
                    <button
                        onClick={handleSelectAll}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-right rtl:text-right ltr:text-left hover:bg-muted transition-colors",
                            !selectedCategory && !selectedSubcategory && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        <Layers className="w-5 h-5 shrink-0" />
                        <span>جميع المنتجات</span>
                    </button>

                    {/* Main Categories */}
                    {mainCategories.map((category) => {
                        const children = subcategories(category.id);
                        const hasChildren = children.length > 0;
                        const isExpanded = expandedCategories.has(category.id);
                        const isSelected = selectedCategory === category.id && !selectedSubcategory;

                        return (
                            <div key={category.id}>
                                {/* Parent Category */}
                                <button
                                    onClick={() => handleSelectCategory(category.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 text-right rtl:text-right ltr:text-left hover:bg-muted transition-colors",
                                        isSelected && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 shrink-0" />
                                        <span>{category.name}</span>
                                    </div>
                                    {hasChildren && (
                                        <ChevronDown
                                            className={cn(
                                                "w-4 h-4 transition-transform",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    )}
                                </button>

                                {/* Subcategories */}
                                {hasChildren && isExpanded && (
                                    <div className="bg-muted/50">
                                        {children.map((sub) => {
                                            const isSubSelected = selectedSubcategory === sub.id;
                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => handleSelectSubcategory(category.id, sub.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-2.5 pr-12 rtl:pr-12 ltr:pl-12 ltr:pr-4 text-sm text-right rtl:text-right ltr:text-left hover:bg-muted transition-colors",
                                                        isSubSelected && "bg-primary/10 text-primary font-medium"
                                                    )}
                                                >
                                                    <ChevronLeft className="w-4 h-4 shrink-0 rtl:rotate-180" />
                                                    <span>{sub.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {mainCategories.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد فئات متاحة</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default VendorCategoryMenu;
