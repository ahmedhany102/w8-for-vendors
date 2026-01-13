
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { RequireVendorAuth } from './components/RequireVendorAuth';

import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import NotFound from './pages/NotFound';
import OrderTracking from './pages/OrderTracking';
import ProductDetails from './pages/ProductDetails';
import CategoryPage from './pages/CategoryPage';
import Terms from './pages/Terms';
import Favorites from './pages/Favorites';
import VendorDashboard from './pages/vendor/VendorDashboard';
import BecomeVendor from './pages/BecomeVendor';
import Vendors from './pages/Vendors';
import SectionPage from './pages/SectionPage';
import SimilarProductsPage from './pages/SimilarProductsPage';

// Vendor context and layout
import { VendorContextProvider } from './contexts/VendorContext';
import VendorLayout from './components/layouts/VendorLayout';

import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import './autoScroll.css';
import BottomNavigation from './components/BottomNavigation';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="flex flex-col min-h-screen w-full">
            <Routes>
              {/* Global (W8 Mall) Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/section/:id" element={<SectionPage />} />
              <Route path="/recommendations/similar" element={<SimilarProductsPage />} />

              {/* Vendor Storefront Routes - Wrapped in VendorContextProvider */}
              <Route
                path="/store/:vendorSlug/*"
                element={
                  <VendorContextProvider>
                    <VendorLayout />
                  </VendorContextProvider>
                }
              />

              {/* Protected routes */}
              <Route element={<RequireAuth adminOnly={false} />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/orders" element={<OrderTracking />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/checkout" element={<Cart />} />
              </Route>

              {/* Become Vendor is PUBLIC - auth handled inside if needed */}
              <Route path="/become-vendor" element={<BecomeVendor />} />

              {/* Cart is PUBLIC - checkout auth is handled inside Cart.tsx */}
              <Route path="/cart" element={<Cart />} />

              {/* Vendor routes */}
              <Route element={<RequireVendorAuth />}>
                <Route path="/vendor" element={<VendorDashboard />} />
                <Route path="/vendor/products" element={<VendorDashboard />} />
                <Route path="/vendor/orders" element={<VendorDashboard />} />
                <Route path="/vendor/analytics" element={<VendorDashboard />} />
                <Route path="/vendor/settings" element={<VendorDashboard />} />
              </Route>

              {/* Admin routes */}
              <Route element={<RequireAuth adminOnly={true} />}>
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/products" element={<Admin activeTab="products" />} />
                <Route path="/admin/orders" element={<Admin activeTab="orders" />} />
                <Route path="/admin/users" element={<Admin activeTab="users" />} />
                <Route path="/admin/coupons" element={<Admin activeTab="coupons" />} />
                <Route path="/admin/contact" element={<Admin activeTab="contact" />} />
                <Route path="/admin/ads" element={<Admin activeTab="ads" />} />
                <Route path="/admin/vendors" element={<Admin activeTab="vendors" />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <BottomNavigation />
          <SonnerToaster position="top-right" richColors closeButton />
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
