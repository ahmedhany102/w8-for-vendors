import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Search, X, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCartIntegration } from '@/hooks/useCartIntegration';
import { useVendorContext } from '@/hooks/useVendorContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import VendorCategoryMenu from './VendorCategoryMenu';

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

interface VendorStoreHeaderProps {
    vendorId?: string;
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
 * Shopify-style unified header:
 * - Fixed from top of page
 * - Contains: Hamburger (left) | Logo (center) | Search + Cart (right)
 * - No banner, no cover image, no avatar-style logo
 * - Logo is a small brand identifier INSIDE the header
 * - Uses VendorContext for vendor data
 */
const VendorStoreHeader: React.FC<VendorStoreHeaderProps> = ({
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

    // Get vendor data from context
    const { vendor, vendorSlug } = useVendorContext();
    const { t } = useLanguageSafe();

    const handleCategorySelect = (categoryId: string | null, subcategoryId: string | null) => {
        setMenuOpen(false);

        // Always navigate to the appropriate page
        if (!categoryId && !subcategoryId) {
            // "All Products" selected - go to store home
            navigate(`/store/${vendorSlug}`);
        } else if (categoryId) {
            // Category selected - navigate to category page
            // The category page will handle subcategory filtering
            navigate(`/store/${vendorSlug}/category/${categoryId}${subcategoryId ? `?sub=${subcategoryId}` : ''}`);
        }

        // Also update parent state for pages that use filtering
        onCategorySelect(categoryId);
        onSubcategorySelect(subcategoryId);
    };

    // Use vendor data from context
    const vendorName = vendor?.name || 'المتجر';
    const vendorLogo = vendor?.logo_url;

    return (
        <>
            {/* 
        =============================================
        UNIFIED SHOPIFY-STYLE HEADER
        Fixed at top, contains all navigation elements
        =============================================
      */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14">

                        {/* LEFT: Hamburger Menu */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMenuOpen(true)}
                            className="shrink-0"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        {/* CENTER: Store Logo (absolutely centered) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            {searchOpen ? (
                                // Search input replaces logo when active (mobile)
                                <div className="relative w-48 sm:w-64">
                                    <Search className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder={`${t?.common?.search || 'Search'} ${vendorName}...`}
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="h-9 pr-10 rtl:pr-4 rtl:pl-10 text-sm"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                // Logo centered in header
                                <button
                                    onClick={() => navigate(`/store/${vendorSlug}`)}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    {vendorLogo ? (
                                        <img
                                            src={vendorLogo}
                                            alt={vendorName}
                                            className="h-10 w-auto max-w-[120px] object-contain"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Store className="w-6 h-6 text-primary" />
                                            <span className="font-bold text-lg hidden sm:block">{vendorName}</span>
                                        </div>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* RIGHT: Search Toggle + Cart */}
                        <div className="flex items-center gap-1">
                            {/* Search Toggle */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (searchOpen) {
                                        setSearchOpen(false);
                                        onSearchChange('');
                                    } else {
                                        setSearchOpen(true);
                                    }
                                }}
                                className="shrink-0"
                                aria-label={searchOpen ? "Close search" : "Open search"}
                            >
                                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                            </Button>

                            {/* Cart Icon with Badge */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/store/${vendorSlug}/cart`)}
                                className="relative shrink-0"
                                aria-label="View cart"
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

                            {/* Language Switcher */}
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </header>

            {/* Spacer to prevent content from going under fixed header */}
            <div className="h-14" />

            {/* Category Menu Drawer */}
            <VendorCategoryMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                vendorName={vendorName}
                vendorSlug={vendorSlug}
                mainCategories={mainCategories}
                subcategories={subcategories}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onCategorySelect={handleCategorySelect}
            />
        </>
    );
};

export default VendorStoreHeader;
