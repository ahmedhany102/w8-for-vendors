import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguageSafe } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Store, Mail, Lock, User, CheckCircle, Eye, EyeOff } from "lucide-react";

const signupSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters",
    }),
    email: z.string().email({
      message: "Please enter a valid email",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string().min(8, {
      message: "Confirm password must be at least 8 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const { signup, user, loading: authLoading } = useAuth();
  const { t, direction } = useLanguageSafe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const redirectParam = searchParams.get('redirect');

  React.useEffect(() => {
    if (user && !authLoading && !isSubmitting) {
      const redirectTarget = redirectParam || sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectTarget);
    }
  }, [user, authLoading, navigate, redirectParam, isSubmitting]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await signup(data.email, data.password, data.name);

      if (!success) {
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const destination = redirectParam || '/';
        navigate(destination, { replace: true });
      } else {
        toast.info(t?.auth?.checkEmail || 'Please check your email to verify your account.');
        setSignupSuccess(true);
      }
    } catch (error) {
      console.error('Signup submission error:', error);
      toast.error(t?.auth?.loginFailed || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#fffbf0] to-[#ffdcb0]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-orange-900">{t?.common?.loading || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#fffbf0] to-[#ffdcb0] p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl">
          <CardHeader className="text-center pt-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">{t?.auth?.accountCreated || 'Account created successfully!'}</CardTitle>
          </CardHeader>
          <CardContent className="text-center px-6">
            <p className="text-muted-foreground mb-6 text-sm">
              {t?.auth?.checkEmail || 'Please check your email to verify your account.'}
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-11 text-base font-bold rounded-xl bg-primary hover:bg-primary/90"
            >
              {t?.auth?.goToLogin || 'Go to Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Column - Brand Experience */}
      <div className="w-full md:w-1/2 md:h-screen bg-gradient-to-br from-[#fffbf0] to-[#ffdcb0] flex-shrink-0 relative">
        {/* Content */}
        <div className="flex flex-col items-center justify-center py-12 md:py-0 md:h-full px-4 md:p-12 text-center">
          {/* Logo */}
          <Link to="/" className="mb-2 md:mb-6">
            <img
              src="/logo.png"
              alt="Sarraly"
              className="h-10 md:h-20 object-contain"
            />
          </Link>

          {/* Brand Name */}
          <h1 className="text-xl md:text-4xl font-bold text-orange-900 mb-1 md:mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {direction === 'rtl' ? 'سرعلي' : 'Sarraly'}
          </h1>

          {/* Mobile Slogan */}
          <p className="md:hidden text-sm text-orange-800 font-medium mt-1 mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {t?.hero?.cta || 'Get Your Online Store Now'}
          </p>

          {/* Tagline - Hidden on mobile */}
          <p className="hidden md:block text-xl text-orange-800/90 max-w-md leading-relaxed font-medium" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {t?.hero?.title || 'Launch and Sell'}
            <br />
            <span className="text-orange-700/70 text-lg">{t?.hero?.subtitle || 'in just 30 seconds'}</span>
          </p>

          {/* Feature badges - hidden on mobile */}
          <div className="hidden md:flex flex-wrap justify-center gap-3 mt-6">
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              {t?.auth?.freeRegistration || 'Free Registration'}
            </span>
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              {t?.auth?.secureData || 'Secure Data'}
            </span>
            <span className="bg-white/50 text-orange-900 px-4 py-1.5 rounded-full text-sm font-medium">
              {t?.auth?.launchInSeconds || 'Launch in Seconds'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full md:w-1/2 md:h-screen flex items-center justify-center p-4 pb-8 md:p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-2 pt-5">
              <CardTitle className="text-xl lg:text-2xl font-bold text-foreground">
                {t?.auth?.signupTitle || 'Create New Account'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {t?.auth?.signupDesc || 'Enter your details to join us'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-5 lg:px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start block text-sm">{t?.auth?.fullName || 'Full Name'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input
                              placeholder={t?.auth?.namePlaceholder || 'John Doe'}
                              {...field}
                              disabled={isSubmitting}
                              className={`${direction === 'rtl' ? 'pr-9' : 'pl-9'} h-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-start text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start block text-sm">{t?.auth?.email || 'Email'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              {...field}
                              autoComplete="email"
                              disabled={isSubmitting}
                              className={`${direction === 'rtl' ? 'pr-9' : 'pl-9'} h-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30`}
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-start text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start block text-sm">{t?.auth?.password || 'Password'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              autoComplete="new-password"
                              disabled={isSubmitting}
                              className={`${direction === 'rtl' ? 'pr-9 pl-9' : 'pl-9 pr-9'} h-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30`}
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`absolute ${direction === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-start text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-start block text-sm">{t?.auth?.confirmPassword || 'Confirm Password'}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={`absolute ${direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              autoComplete="new-password"
                              disabled={isSubmitting}
                              className={`${direction === 'rtl' ? 'pr-9' : 'pl-9'} h-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary/30`}
                              dir="ltr"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-start text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-bold rounded-xl bg-[#F4A261] hover:bg-[#E76F51] text-white shadow-lg shadow-orange-300/30 mt-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t?.auth?.creatingAccount || 'Creating account...'}
                      </div>
                    ) : (
                      t?.auth?.createAccountBtn || 'Create Account'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 px-5 lg:px-6 pb-5 pt-2">
              {/* Login link */}
              <div className="text-center w-full text-sm">
                <span className="text-muted-foreground">{t?.auth?.hasAccount || 'Already have an account?'} </span>
                <Link
                  to="/login"
                  className="text-primary hover:underline font-semibold"
                >
                  {t?.auth?.login || 'Login'}
                </Link>
              </div>

              {/* Vendor CTA */}
              <div className="w-full pt-2 border-t border-border">
                <Link
                  to="/become-vendor"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-primary font-semibold transition-colors text-sm"
                >
                  <Store className="w-4 h-4" />
                  {t?.auth?.wantToSell || 'Want to sell with us? Sign up and get your own store'}
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Back to home link */}
          <div className="text-center mt-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {t?.auth?.backToHome || '← Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;