
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageSafe } from "@/contexts/LanguageContext";
import ProductManagement from "@/components/admin/ProductManagement";
import AdminProductsManagement from "@/components/admin/AdminProductsManagement";
import AdminOrdersManagement from "@/components/admin/AdminOrdersManagement";
import OrdersPanel from "@/components/admin/OrdersPanel";
import CouponManagement from "@/components/admin/CouponManagement";
import AdminContactSettings from "@/components/admin/AdminContactSettings";
import AdManagement from "@/components/admin/AdManagement";
import UsersPanel from "@/components/admin/UsersPanel";
import CategoryManagement from "@/components/admin/CategoryManagement";
import AdminDashboardStats from "@/components/AdminDashboardStats";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";
import SectionsManager from "@/components/admin/SectionsManager";
import RevenueAnalytics from "@/components/admin/RevenueAnalytics";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Home, LogOut, Package, Settings, Ticket, Users, FolderTree, Star, Store, ShoppingCart, LayoutGrid, BarChart3 } from "lucide-react";
import { useSupabaseProducts, useSupabaseUsers, useSupabaseOrders } from "@/hooks/useSupabaseData";
import AdminVendors from "@/pages/admin/AdminVendors";

const Admin = ({ activeTab = "dashboard" }) => {
  const { user, logout } = useAuth();
  const { direction } = useLanguageSafe();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(activeTab);

  const { products, loading: productsLoading } = useSupabaseProducts();
  const { users, loading: usersLoading } = useSupabaseUsers();
  const { orders, loading: ordersLoading } = useSupabaseOrders();

  // Check if user exists and is admin (ADMIN or SUPER_ADMIN)
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    return <Navigate to="/admin-login" />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const statsLoading = productsLoading || usersLoading || ordersLoading;

  console.log('Admin Dashboard Data:', {
    products: products?.length || 0,
    users: users?.length || 0,
    orders: orders?.length || 0,
    statsLoading
  });

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      <div className="flex h-screen overflow-hidden">
        
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden lg:block flex-shrink-0">
          <AdminSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header with mobile menu */}
          <AdminHeader 
            showMenuButton={true}
            sidebarContent={<AdminSidebar onNavigate={() => {}} />}
            onLogout={handleLogout}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-4 px-4 md:px-6">

              {/* Stats Dashboard */}
              <AdminDashboardStats
                totalProducts={products?.length || 0}
                totalUsers={users?.length || 0}
                totalOrders={orders?.length || 0}
                loading={statsLoading}
              />

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full mt-6"
        >
          <div className="w-full overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <TabsList className="inline-flex flex-nowrap min-w-max gap-1 pr-8">
              <TabsTrigger value="dashboard" onClick={() => navigate("/admin")} className="shrink-0">
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الرئيسية</span>
              </TabsTrigger>
              <TabsTrigger value="categories" onClick={() => setCurrentTab("categories")} className="shrink-0">
                <FolderTree className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الأقسام</span>
              </TabsTrigger>
              <TabsTrigger value="sections" onClick={() => setCurrentTab("sections")} className="shrink-0">
                <LayoutGrid className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">السيكشنز</span>
              </TabsTrigger>
              <TabsTrigger value="products" onClick={() => navigate("/admin/products")} className="shrink-0">
                <Package className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">المنتجات</span>
              </TabsTrigger>
              <TabsTrigger value="vendor-products" onClick={() => setCurrentTab("vendor-products")} className="shrink-0">
                <Store className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">منتجات البائعين</span>
              </TabsTrigger>
              <TabsTrigger value="orders" onClick={() => navigate("/admin/orders")} className="shrink-0">
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الطلبات</span>
              </TabsTrigger>
              <TabsTrigger value="vendor-orders" onClick={() => setCurrentTab("vendor-orders")} className="shrink-0">
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">طلبات البائعين</span>
              </TabsTrigger>
              <TabsTrigger value="coupons" onClick={() => navigate("/admin/coupons")} className="shrink-0">
                <Ticket className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الكوبونات</span>
              </TabsTrigger>
              <TabsTrigger value="contact" onClick={() => navigate("/admin/contact")} className="shrink-0">
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">بيانات التواصل</span>
              </TabsTrigger>
              <TabsTrigger value="ads" onClick={() => navigate("/admin/ads")} className="shrink-0">
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الإعلانات</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" onClick={() => setCurrentTab("reviews")} className="shrink-0">
                <Star className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">التقييمات</span>
              </TabsTrigger>
              <TabsTrigger value="vendors" onClick={() => navigate("/admin/vendors")} className="shrink-0">
                <Store className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">البائعين</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" onClick={() => setCurrentTab("analytics")} className="shrink-0">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">الإيرادات</span>
              </TabsTrigger>
              <TabsTrigger value="users" onClick={() => navigate("/admin/users")} className="shrink-0">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">المستخدمين</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-xl font-bold">إدارة المتجر</h3>
                <p className="mt-2 text-gray-600">
                  مرحباً بك في لوحة التحكم. يمكنك إدارة المنتجات والطلبات والمزيد من هنا.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>المنتجات: {products?.length || 0}</p>
                  <p>المستخدمين: {users?.length || 0}</p>
                  <p>الطلبات: {orders?.length || 0}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="sections">
            <SectionsManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="vendor-products">
            <AdminProductsManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="vendor-orders">
            <AdminOrdersManagement />
          </TabsContent>

          <TabsContent value="coupons">
            <CouponManagement />
          </TabsContent>

          <TabsContent value="contact">
            <AdminContactSettings />
          </TabsContent>

          <TabsContent value="ads">
            <AdManagement />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsManagement />
          </TabsContent>

          <TabsContent value="vendors">
            <AdminVendors />
          </TabsContent>

          <TabsContent value="analytics">
            <RevenueAnalytics />
          </TabsContent>

          <TabsContent value="users">
            <UsersPanel />
          </TabsContent>
        </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
