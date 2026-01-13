
import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signupSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters",
    }),
    email: z.string().email({
      message: "Please enter a valid email address",
    }),
    password: z.string().min(8, {
      message: "Password must be at least 8 characters",
    }),
    confirmPassword: z.string().min(8, {
      message: "Confirm Password must be at least 8 characters",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const { signup, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Get redirect URL from query params
  const redirectParam = searchParams.get('redirect');

  React.useEffect(() => {
    if (user && !authLoading && !isSubmitting) {
      // Priority: query param > sessionStorage > home
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
      console.log('📝 Attempting signup for:', data.email);

      // Call supabase directly to get session
      const { data: signupData, error } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: { name: data.name.trim() }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        toast.error(error.message || 'Signup failed');
        return;
      }

      // Check if session exists (email confirmation is disabled)
      if (signupData.session) {
        console.log('✅ Signup successful with session, auto-login active');
        toast.success('Account created successfully!');

        // CRITICAL FIX: Wait 500ms for AuthContext to update global state
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to destination
        const destination = redirectParam || '/';
        console.log('🚀 Navigating to:', destination);
        navigate(destination, { replace: true });
      } else if (signupData.user && !signupData.session) {
        // Email confirmation is enabled - show message
        console.log('📧 Signup successful but email confirmation required');
        toast.info('Please check your email to confirm your account.');
        setSignupSuccess(true);
      }
    } catch (error) {
      console.error('Signup submission error:', error);
      toast.error('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (signupSuccess) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[80vh]">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-md">
              <CardTitle className="text-center text-2xl">Account Created!</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Successfully Registered!</h3>
                <p className="text-muted-foreground mt-2">
                  Your account has been created. You will be redirected to the login page shortly.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  If email confirmation is enabled, please check your email before logging in.
                </p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-md">
            <CardTitle className="text-center text-2xl">Create Account</CardTitle>
            <CardDescription className="text-center text-primary-foreground/80">
              Enter your information to sign up for an account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          {...field}
                          autoComplete="name"
                          disabled={isSubmitting}
                          className="transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          {...field}
                          autoComplete="email"
                          disabled={isSubmitting}
                          className="transition-all"
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            className="pr-10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-2 top-2 text-sm text-gray-600 dark:text-gray-300"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          autoComplete="new-password"
                          disabled={isSubmitting}
                          className="transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 py-4">
            <div className="text-center w-full">
              <span className="text-sm text-muted-foreground">Already have an account? </span>
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Signup;
