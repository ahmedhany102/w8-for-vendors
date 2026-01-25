import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageSafe } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Store, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({
    message: "يرجى إدخال بريد إلكتروني صحيح",
  }),
  password: z.string().min(6, {
    message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const { t, direction } = useLanguageSafe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectParam = searchParams.get('redirect');

  React.useEffect(() => {
    if (user && !authLoading) {
      const redirectTarget = redirectParam || sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectTarget);
    }
  }, [user, authLoading, navigate, redirectParam]);

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
        const destination = redirectParam || sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(destination, { replace: true });
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#fffbf0] to-[#ffdcb0]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-orange-900">{t?.common?.loading || 'جاري التحميل...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Column - Brand Experience */}
      <div className="w-full md:w-1/2 md:h-screen bg-gradient-to-br from-[#fffbf0] to-[#ffdcb0] flex-shrink-0 relative">
        {/* Content */}
        <div className="flex flex-col items-center justify-center py-12 md:py-0 md:h-full px-4 md:p-12 text-center">
          {/* Logo - Smaller on mobile */}
          <Link to="/" className="mb-2 md:mb-6">
            <img
              src="/logo.png"
              alt="Sarraly"
              className="h-10 md:h-20 object-contain"
            />
          </Link>

          {/* Brand Name - Smaller on mobile */}
          <h1 className="text-xl md:text-4xl font-bold text-orange-900 mb-1 md:mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
            سرعلي
          </h1>

          {/* Mobile Slogan - Only visible on mobile */}
          <p className="md:hidden text-sm text-orange-800 font-medium mt-1 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            امتلك متجرك الإلكتروني الخاص بك في ثوانٍ
          </p>

          {/* Tagline - Hidden on mobile */}
          <p className="hidden md:block text-xl text-orange-800/90 max-w-md leading-relaxed font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
            مرحباً بعودتك إلى سرعلي
            <br />
            <span className="text-orange-700/70 text-lg">واصل نمو تجارتك معنا</span>
          </p>

          {/* Feature badges - hidden on mobile */}
          <div className="hidden md:flex flex-wrap justify-center gap-3 mt-6">
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              تسوق آمن
            </span>
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              توصيل سريع
            </span>
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              جودة عالية
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-1/2 md:h-screen flex items-center justify-center p-4 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-4 pt-6">
              <CardTitle className="text-xl lg:text-2xl font-bold text-foreground">
                {t?.auth?.loginTitle || 'تسجيل الدخول'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {t?.auth?.loginDesc || 'أدخل بياناتك للوصول إلى حسابك'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 lg:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={`block text-sm ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>{t?.auth?.email || 'البريد الإلكتروني'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              {...field}
                              autoComplete="username"
                              disabled={isSubmitting}
                              className="pr-9 h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30 text-left"
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-right text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={`block text-sm ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>{t?.auth?.password || 'كلمة المرور'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              autoComplete="current-password"
                              disabled={isSubmitting}
                              className="pr-9 h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30"
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-right text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-bold rounded-xl bg-[#F4A261] hover:bg-[#E76F51] text-white shadow-lg shadow-orange-300/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t?.auth?.loggingIn || 'جاري تسجيل الدخول...'}
                      </div>
                    ) : (
                      t?.auth?.submitLogin || 'دخول'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 px-5 lg:px-6 pb-6 pt-2">
              {/* Sign up link */}
              <div className="text-center w-full text-sm">
                <span className="text-muted-foreground">{t?.auth?.noAccount || 'ليس لديك حساب؟'} </span>
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-semibold"
                >
                  {t?.auth?.createAccount || 'إنشاء حساب جديد'}
                </Link>
              </div>

              {/* Vendor CTA */}
              <div className="w-full pt-3 border-t border-border">
                <Link
                  to="/become-vendor"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-primary font-semibold transition-colors text-sm"
                >
                  <Store className="w-4 h-4" />
                  {t?.auth?.getYourStore || 'احصل على متجرك الخاص الآن'}
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Back to home link */}
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {t?.auth?.backToHome || '← العودة للصفحة الرئيسية'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
