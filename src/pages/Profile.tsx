import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useOptionalVendorContext } from "@/contexts/VendorContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import VendorStoreHeader from "@/components/vendor/VendorStoreHeader";
import { useVendorCategories } from "@/hooks/useVendors";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
      message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
    }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Profile = () => {
  // ===========================================
  // ALL HOOKS MUST BE DECLARED AT THE TOP
  // No conditional returns before these hooks
  // ===========================================

  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State hooks
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Use optional vendor context - returns null when outside /store/:vendorSlug/*
  const vendorCtx = useOptionalVendorContext();
  const isVendorContext = !!vendorCtx;
  const vendorId = vendorCtx?.vendorId;
  const vendorSlug = vendorCtx?.vendorSlug;

  // Get vendor categories for header
  const { mainCategories, subcategories } = useVendorCategories(vendorId);

  // Form hook
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Redirect to login if not authenticated - THIS MUST BE AFTER ALL OTHER HOOKS
  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
      // Redirect to vendor login when in vendor context
      if (isVendorContext && vendorSlug) {
        navigate(`/store/${vendorSlug}/login`);
      } else {
        navigate('/login');
      }
    }
  }, [user, loading, location.pathname, location.search, navigate, isVendorContext, vendorSlug]);

  // ===========================================
  // NOW WE CAN HAVE CONDITIONAL RETURNS
  // All hooks are already declared above
  // ===========================================

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user || !user.email) {
      toast.error('You must be logged in to change your password');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsUpdatingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        toast.error("Password update failed: " + error.message);
      } else {
        toast.success("تم تحديث كلمة المرور بنجاح");
        setIsPasswordModalOpen(false);
        form.reset();
      }
    } catch (error: any) {
      toast.error("Password update failed: " + (error?.message || 'Unknown error'));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      // Redirect based on context
      if (isVendorContext && vendorSlug) {
        navigate(`/store/${vendorSlug}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('فشل تسجيل الخروج');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle View Orders navigation (vendor-aware)
  const handleViewOrders = () => {
    if (isVendorContext && vendorSlug) {
      navigate(`/store/${vendorSlug}/orders`);
    } else {
      navigate('/orders');
    }
  };

  // Loading state - AFTER all hooks
  if (loading) {
    return (
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        {isVendorContext && vendorId && (
          <VendorStoreHeader
            vendorId={vendorId}
            mainCategories={mainCategories}
            subcategories={subcategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            onSubcategorySelect={setSelectedSubcategory}
          />
        )}
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800"></div>
        </div>
      </Layout>
    );
  }

  // Not authenticated - wait for redirect effect
  if (!user) {
    return (
      <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
        <div className="flex justify-center items-center h-64">
          <p>Redirecting to login...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideGlobalHeader={isVendorContext} hideFooter={isVendorContext}>
      {/* Vendor Header when in vendor context */}
      {isVendorContext && vendorId && (
        <VendorStoreHeader
          vendorId={vendorId}
          mainCategories={mainCategories}
          subcategories={subcategories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSubcategorySelect={setSelectedSubcategory}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">الملف الشخصي</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>معلومات الحساب</CardTitle>
            <CardDescription>تفاصيل حسابك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">البريد الإلكتروني</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">نوع الحساب</p>
                <p className="capitalize">{user.role.replace('ROLE_', '')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">رقم الحساب</p>
                <p>{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
            <CardDescription>إدارة حسابك وطلباتك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
                className="hover:bg-green-100"
              >
                تغيير كلمة المرور
              </Button>
              <Button
                variant="outline"
                onClick={handleViewOrders}
                className="hover:bg-green-100"
              >
                عرض طلباتي
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الجلسة</CardTitle>
            <CardDescription>إدارة جلسة الدخول</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full md:w-auto"
            >
              <LogOut className="w-4 h-4 ml-2" />
              {isLoggingOut ? 'جاري تسجيل الخروج...' : 'تسجيل خروج'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
            <DialogDescription>
              أدخل كلمة المرور الحالية واختر كلمة مرور جديدة لحسابك.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الحالية</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور الحالية"
                        {...field}
                        disabled={isUpdatingPassword}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أنشئ كلمة مرور جديدة"
                        {...field}
                        disabled={isUpdatingPassword}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="أكد كلمة المرور الجديدة"
                        {...field}
                        disabled={isUpdatingPassword}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isUpdatingPassword}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-green-800 hover:bg-green-900"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري التحديث...
                    </div>
                  ) : (
                    "تحديث كلمة المرور"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
