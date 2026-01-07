import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import VendorCategoryMenu from './VendorCategoryMenu';

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

interface VendorStoreNavProps {
    vendorName: string;
    vendorId: string;
    mainCategories: Category[];
    subcategories: (parentId: string) => Category[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategory: string | null;
    onCategorySelect: (categoryId: string | null) => void;
    selectedSubcategory: string | null;
    onSubcategorySelect: (subcategoryId: string | null) => void;
}

/**
 * Shopify-style vendor store navigation bar with:
 * - Hamburger menu (left/RTL: right) → opens category drawer
 * - Search input (center, collapsible on mobile)
 * - Cart icon with badge (right/RTL: left)
 */
const VendorStoreNav: React.FC<VendorStoreNavProps> = ({
    vendorName,
    vendorId,
    mainCategories,
    subcategories,
    searchQuery,
    onSearchChange,
    selectedCategory,
    onCategorySelect,
    selectedSubcategory,
    onSubcategorySelect,
}) => {
    const navigate = useNavigate();
    const { cartCount } = useCartIntegration();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    const handleCategorySelect = (categoryId: string | null, subcategoryId: string | null) => {
        onCategorySelect(categoryId);
        onSubcategorySelect(subcategoryId);
        setMenuOpen(false);
    };

    return (
        <>
            {/* Navigation Bar */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        {/* Left: Hamburger Menu */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMenuOpen(true)}
                            className="shrink-0"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* Center: Search (Desktop) or Store Name (Mobile when search closed) */}
                        <div className="flex-1 mx-4">
                            {searchOpen ? (
                                <div className="relative max-w-md mx-auto">
                                    <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder={`ابحث داخل متجر ${vendorName}...`}
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="pr-10 rtl:pr-4 rtl:pl-10"
                                        autoFocus
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-1 rtl:left-auto rtl:right-1 top-1/2 -translate-y-1/2 h-7 w-7 md:hidden"
                                        onClick={() => {
                                            setSearchOpen(false);
                                            onSearchChange('');
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop: Always show search */}
                                    <div className="hidden md:block">
                                        <div className="relative max-w-md mx-auto">
                                            <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                type="text"
                                                placeholder={`ابحث داخل متجر ${vendorName}...`}
                                                value={searchQuery}
                                                onChange={(e) => onSearchChange(e.target.value)}
                                                className="pr-10 rtl:pr-4 rtl:pl-10"
                                            />
                                        </div>
                                    </div>
                                    {/* Mobile: Show store name, tap to search */}
                                    <div className="md:hidden text-center">
                                        <span className="font-medium text-sm truncate">{vendorName}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right: Search (mobile toggle) + Cart */}
                        <div className="flex items-center gap-1">
                            {/* Mobile search toggle */}
                            {!searchOpen && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden shrink-0"
                                    onClick={() => setSearchOpen(true)}
                                >
                                    <Search className="w-5 h-5" />
                                </Button>
                            )}

                            {/* Cart Icon */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/cart')}
                                className="relative shrink-0"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 rtl:-right-auto rtl:-left-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                    >
                                        {cartCount > 9 ? '9+' : cartCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Menu Drawer */}
            <VendorCategoryMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                vendorName={vendorName}
                mainCategories={mainCategories}
                subcategories={subcategories}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onCategorySelect={handleCategorySelect}
            />
        </>
    );
};

export default VendorStoreNav;
