import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useVendorContext } from "@/hooks/useVendorContext";
import VendorStoreHeader from "@/components/vendor/VendorStoreHeader";
import { useVendorCategories } from "@/hooks/useVendors";
import Layout from "@/components/Layout";

const loginSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters",
    }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * VendorLogin - Login page for vendor store context
 * Uses vendor branding and redirects back to vendor store after login
 */
const VendorLogin = () => {
    const { login, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Vendor context
    const { vendor, vendorSlug, vendorId } = useVendorContext();
    const { mainCategories, subcategories } = useVendorCategories(vendorId);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

    // Redirect if already logged in
    React.useEffect(() => {
        if (user && !authLoading) {
            const redirectTarget = sessionStorage.getItem('redirectAfterLogin');
            if (redirectTarget) {
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectTarget);
            } else {
                // Default to vendor store home
                navigate(`/store/${vendorSlug}`);
            }
        }
    }, [user, authLoading, navigate, vendorSlug]);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const success = await login(data.email, data.password);
            if (success) {
                const redirectTarget = sessionStorage.getItem('redirectAfterLogin');
                if (redirectTarget) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    navigate(redirectTarget);
                } else {
                    navigate(`/store/${vendorSlug}`);
                }
            }
        } catch (error) {
            console.error('Login submission error:', error);
            toast.error('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading) {
        return (
            <Layout hideGlobalHeader={true} hideFooter={true}>
                {vendorId && (
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
                <div className="flex justify-center items-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideGlobalHeader={true} hideFooter={true}>
            {/* Vendor Header */}
            {vendorId && (
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

            <div className="flex justify-center items-center min-h-[80vh] w-full px-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="bg-primary text-primary-foreground rounded-t-md">
                        <CardTitle className="text-center text-2xl">تسجيل الدخول</CardTitle>
                        <CardDescription className="text-center text-primary-foreground/80">
                            {vendor?.name ? `مرحباً بك في ${vendor.name}` : 'أدخل بياناتك للمتابعة'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>البريد الإلكتروني</FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    {...field}
                                                    autoComplete="username"
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>كلمة المرور</FormLabel>
                                            <FormControl>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    placeholder="••••••••"
                                                    {...field}
                                                    autoComplete="current-password"
                                                    disabled={isSubmitting}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            جاري تسجيل الدخول...
                                        </div>
                                    ) : (
                                        "تسجيل الدخول"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 py-4">
                        <div className="text-center w-full">
                            <span className="text-sm text-muted-foreground">ليس لديك حساب؟ </span>
                            <Link to={`/store/${vendorSlug}/signup`} className="text-primary hover:underline font-medium">
                                إنشاء حساب
                            </Link>
                        </div>
                        <div className="text-center w-full">
                            <Link to={`/store/${vendorSlug}`} className="text-sm text-muted-foreground hover:underline">
                                العودة للمتجر
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </Layout>
    );
};

export default VendorLogin;
