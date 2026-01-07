import React from 'react';
import { Routes, Route } from 'react-router-dom';

import StorePage from '@/pages/StorePage';
import SectionPage from '@/pages/SectionPage';
import CategoryPage from '@/pages/CategoryPage';
import ProductDetails from '@/pages/ProductDetails';
import Cart from '@/pages/Cart';
import Profile from '@/pages/Profile';
import OrderTracking from '@/pages/OrderTracking';
import Favorites from '@/pages/Favorites';

/**
 * VendorLayout - Container for all vendor-scoped routes
 * 
 * This component is rendered INSIDE VendorContextProvider,
 * so all child pages automatically have access to vendor context.
 * 
 * All pages here will receive vendorId from useVendorContext()
 * and will NEVER show global data.
 * 
 * Account routes (profile, orders, favorites) are included here
 * to maintain vendor header/layout when navigating within a vendor store.
 */
const VendorLayout: React.FC = () => {
    return (
        <Routes>
            {/* Store pages */}
            <Route path="" element={<StorePage />} />
            <Route path="section/:id" element={<SectionPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="product/:id" element={<ProductDetails />} />

            {/* Cart & Checkout */}
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Cart />} />

            {/* Account pages (vendor-scoped to maintain layout) */}
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<OrderTracking />} />
            <Route path="favorites" element={<Favorites />} />
        </Routes>
    );
};

export default VendorLayout;
