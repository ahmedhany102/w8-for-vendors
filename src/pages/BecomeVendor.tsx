import { useAuth } from '@/contexts/AuthContext';
import { useLanguageSafe } from '@/contexts/LanguageContext';
import { Navigate, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useVendorProfile } from '@/hooks/useVendorProfile';
import { VendorApplyForm } from '@/components/vendor/VendorApplyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Store, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/hooks/useVendorProfile';
import { supabase } from '@/integrations/supabase/client';
import { trackLead } from '@/services/facebookPixel';

const BecomeVendor = () => {
  const { user, loading: authLoading, isVendor } = useAuth();
  const { t, direction } = useLanguageSafe();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, applyAsVendor } = useVendorProfile();

  // If already a vendor with approved status, redirect to vendor dashboard
  if (!authLoading && isVendor && profile?.status === 'approved') {
    return <Navigate to="/vendor" replace />;
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Guest user - show info page with signup CTA
  if (!user) {
    return (
      <Layout>
        <div dir={direction} className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <Store className="w-20 h-20 mx-auto mb-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t?.vendor?.heroTitle || "Own Your World-Class Store.. In Moments"}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {t?.vendor?.heroSubtitle || "Don't waste time on coding. Get instant access to a comprehensive dashboard to manage your products and sales."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/signup?redirect=/become-vendor')}>
                {t?.vendor?.startSelling || "Get Your Store Now"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login?redirect=/become-vendor')}>
                {t?.vendor?.login || "Login"}
              </Button>
            </div>
          </div>

          {/* Benefits section for guests */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {t?.vendor?.whySarraly || "Why Sarraly?"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Feature 1 */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <CheckCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="text-start">
                    <h3 className="font-bold text-lg mb-1">
                      {t?.vendor?.features?.controlTitle || "Comprehensive Control"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t?.vendor?.features?.controlDesc || "Manage your inventory, set your prices, and track your profits accurately from one place."}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Clock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="text-start">
                    <h3 className="font-bold text-lg mb-1">
                      {t?.vendor?.features?.launchTitle || "Launch in 30 Seconds"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t?.vendor?.features?.launchDesc || "Register your account and start selling immediately, no technical complications."}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <Store className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="text-start">
                    <h3 className="font-bold text-lg mb-1">
                      {t?.vendor?.features?.growthTitle || "Unlimited Growth"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t?.vendor?.features?.growthDesc || "Your products appear instantly in Sarraly Mall, ensuring faster reach to customers."}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <AlertCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="text-start">
                    <h3 className="font-bold text-lg mb-1">
                      {t?.vendor?.features?.marketingTitle || "Smart Marketing Tools"}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t?.vendor?.features?.marketingDesc || "Create offers and discounts to attract buyers to your store with ease."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Loading vendor profile for logged-in users
  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleApply = async (
    storeName: string,
    storeDescription?: string,
    phone?: string,
    address?: string,
    salesChannelLink?: string,
    hasPhysicalStore?: boolean,
    registrationNotes?: string,
    logoUrl?: string
  ) => {
    const success = await applyAsVendor(
      storeName,
      storeDescription,
      phone,
      address,
      salesChannelLink,
      hasPhysicalStore,
      registrationNotes,
      logoUrl
    );
    
    if (success) {
      // ===========================================
      // FACEBOOK PIXEL: TRACK LEAD EVENT
      // ===========================================
      trackLead({
        content_name: storeName,
        content_category: 'Vendor Application',
      });
      
      // Set flag for CompleteRegistration tracking when approved
      sessionStorage.setItem('newVendorRegistration', 'true');
    }
    
    return success;
  };

  // Already has a profile - show status
  if (profile) {
    const statusConfig = {
      pending: {
        icon: Clock,
        iconColor: 'text-yellow-500',
        title: t?.vendor?.status?.pending || 'Your Application is Under Review',
        description: t?.vendor?.status?.pendingDesc || 'Your application has been received and is now under review by the management team.'
      },
      approved: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        title: t?.vendor?.status?.approved || 'Approved!',
        description: t?.vendor?.status?.approvedDesc || 'Congratulations! Your application has been approved.'
      },
      rejected: {
        icon: XCircle,
        iconColor: 'text-red-500',
        title: t?.vendor?.status?.rejected || 'Application Rejected',
        description: t?.vendor?.status?.rejectedDesc || 'Unfortunately, your application has been rejected.'
      },
      suspended: {
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        title: t?.vendor?.status?.suspended || 'Account Suspended',
        description: t?.vendor?.status?.suspendedDesc || 'Your vendor account has been temporarily suspended.'
      }
    };

    const config = statusConfig[profile.status];
    const Icon = config.icon;

    return (
      <Layout>
        <div dir={direction} className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${profile.status === 'approved' ? 'bg-green-100' :
                profile.status === 'pending' ? 'bg-yellow-100' :
                  profile.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                <Icon className={`w-8 h-8 ${config.iconColor}`} />
              </div>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription className="mt-2">{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-start">
                  <p className="font-medium">{profile.store_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {t?.vendor?.form?.storeName || "Store Name"}
                  </p>
                </div>
                <Badge className={getStatusColor(profile.status)}>
                  {getStatusLabel(profile.status)}
                </Badge>
              </div>

              {profile.status === 'approved' && (
                <Button
                  className="w-full"
                  onClick={async () => {
                    // Force refresh auth session to get new 'vendor_admin' role
                    console.log('🔄 Refreshing session before dashboard access...');
                    try {
                      // Trigger a profile refetch by refreshing the session
                      const { data, error } = await supabase.auth.refreshSession();
                      if (error) {
                        console.error('Session refresh error:', error);
                      } else {
                        console.log('✅ Session refreshed, navigating to dashboard...');
                      }
                    } catch (e) {
                      console.error('Session refresh failed:', e);
                    }
                    // Navigate even if refresh fails - let the dashboard handle auth
                    window.location.href = '/vendor';
                  }}
                >
                  <Store className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  {t?.vendor?.status?.goToDashboard || "Go to Dashboard"}
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                {t?.vendor?.status?.backToHome || "Back to Home"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // No profile - show apply form
  return (
    <Layout>
      <div dir={direction} className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {t?.vendor?.form?.mainTitle || "Register to Get Your Own Online Store"}
          </h1>
          <p className="text-muted-foreground">
            {t?.vendor?.form?.subTitle || "Start your journey with us and sell your products to thousands of customers."}
          </p>
        </div>

        <VendorApplyForm onSubmit={handleApply} />
      </div>
    </Layout>
  );
};

export default BecomeVendor;
