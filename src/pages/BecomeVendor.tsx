import { useAuth } from '@/contexts/AuthContext';
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

const BecomeVendor = () => {
  const { user, loading: authLoading, isVendor } = useAuth();
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
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <Store className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-4">انضم كبائع</h1>
            <p className="text-muted-foreground mb-6">
              ابدأ رحلتك معنا وقم ببيع منتجاتك لآلاف العملاء. سجل حساب جديد أو قم بتسجيل الدخول للتقديم كبائع.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup?redirect=/become-vendor')}>
                إنشاء حساب جديد
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login?redirect=/become-vendor')}>
                تسجيل الدخول
              </Button>
            </div>
          </div>

          {/* Benefits section for guests */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">لماذا تنضم إلينا؟</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-right">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>الوصول إلى آلاف العملاء المحتملين</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>لوحة تحكم سهلة لإدارة منتجاتك</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>دعم فني متواصل</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>عمولات تنافسية</span>
                </li>
              </ul>
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

  const handleApply = async (storeName: string, storeDescription?: string, phone?: string, address?: string) => {
    const success = await applyAsVendor(storeName, storeDescription, phone, address);
    return success;
  };

  // Already has a profile - show status
  if (profile) {
    const statusConfig = {
      pending: {
        icon: Clock,
        iconColor: 'text-yellow-500',
        title: 'طلبك قيد المراجعة',
        description: 'تم استلام طلبك وهو الآن قيد المراجعة من قبل فريق الإدارة. سيتم إخطارك عند الموافقة.'
      },
      approved: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        title: 'تمت الموافقة!',
        description: 'تهانينا! تمت الموافقة على طلبك. يمكنك الآن الوصول إلى لوحة تحكم البائع.'
      },
      rejected: {
        icon: XCircle,
        iconColor: 'text-red-500',
        title: 'تم رفض الطلب',
        description: 'للأسف تم رفض طلبك. يرجى التواصل مع الإدارة لمعرفة السبب وإمكانية إعادة التقديم.'
      },
      suspended: {
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        title: 'حساب موقوف',
        description: 'تم إيقاف حساب البائع الخاص بك مؤقتاً. يرجى التواصل مع الإدارة.'
      }
    };

    const config = statusConfig[profile.status];
    const Icon = config.icon;

    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
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
                <div>
                  <p className="font-medium">{profile.store_name}</p>
                  <p className="text-sm text-muted-foreground">اسم المتجر</p>
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
                  <Store className="w-4 h-4 mr-2" />
                  الذهاب إلى لوحة التحكم
                </Button>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                العودة للرئيسية
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
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">انضم كبائع</h1>
          <p className="text-muted-foreground">
            ابدأ رحلتك معنا وقم ببيع منتجاتك لآلاف العملاء. تقدم بطلبك الآن وسيتم مراجعته من قبل فريقنا.
          </p>
        </div>

        <VendorApplyForm onSubmit={handleApply} />
      </div>
    </Layout>
  );
};

export default BecomeVendor;
