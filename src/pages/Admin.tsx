
import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
import { Home, LogOut, Package, Settings, Ticket, Users, FolderTree, Star, Store, ShoppingCart, LayoutGrid, BarChart3 } from "lucide-react";
import { useSupabaseProducts, useSupabaseUsers, useSupabaseOrders } from "@/hooks/useSupabaseData";
import AdminVendors from "@/pages/admin/AdminVendors";

const Admin = ({ activeTab = "dashboard" }) => {
  const { user, logout } = useAuth();
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
    <Layout hideFooter>
      <div className="container mx-auto py-4 px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row-reverse justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">
              مرحباً {user.displayName || user.name || user.email}، يمكنك إدارة المتجر من هنا.
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 mt-4 md:mt-0"
          >
            <LogOut className="w-4 h-4 mr-2" />
            تسجيل الخروج
          </Button>
        </div>

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
          className="w-full"
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
    </Layout>
  );
};

export default Admin;
