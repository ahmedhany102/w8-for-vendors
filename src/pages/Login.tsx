
import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get redirect URL from query params or sessionStorage
  const redirectParam = searchParams.get('redirect');

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !authLoading) {
      console.log('User already logged in, checking for redirect target');
      // Priority: query param > sessionStorage > home
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
      console.log("Attempting login for:", data.email);

      const success = await login(data.email, data.password);
      if (success) {
        // Priority: query param > sessionStorage > home
        const destination = redirectParam || sessionStorage.getItem('redirectAfterLogin') || '/';
        sessionStorage.removeItem('redirectAfterLogin');
        console.log("Login successful, hard navigating to:", destination);

        // FORCE hard reload to ensure Auth State is 100% synced
        window.location.assign(destination);
      }
    } catch (error) {
      console.error('Login submission error:', error);
      toast.error('Login failed. Please try again.');
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

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] w-full">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-md">
            <CardTitle className="text-center text-2xl">User Login</CardTitle>
            <CardDescription className="text-center text-primary-foreground/80">
              Enter your credentials to access your account
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
                      <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          autoComplete="username"
                          disabled={isSubmitting}
                          className="transition-all bg-white/80 dark:bg-gray-800"
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
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          className="transition-all bg-white/80 dark:bg-gray-800"
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
                      Logging in...
                    </div>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 py-4">
            <div className="text-center w-full">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            {/* Vendor CTA */}
            <div className="text-center w-full pt-2 border-t border-border">
              <Link
                to="/become-vendor"
                className="text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1"
              >
                احصل علي متجرك الخاص بك الان
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
