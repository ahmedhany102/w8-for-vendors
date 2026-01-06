import { useVendorProfile } from '@/hooks/useVendorProfile';
import { VendorApplyForm } from '@/components/vendor/VendorApplyForm';
import { VendorProfileForm } from '@/components/vendor/VendorProfileForm';
import { VendorStatusBanner } from '@/components/vendor/VendorStatusBanner';
import { Loader2 } from 'lucide-react';

const VendorSettings = () => {
  const { profile, loading, error, applyAsVendor, updateProfile } = useVendorProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">حدث خطأ أثناء تحميل البيانات</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  // No profile yet - show apply form
  if (!profile) {
    return (
      <div className="py-8">
        <VendorApplyForm onSubmit={applyAsVendor} />
      </div>
    );
  }

  // Has profile - show profile form with status
  return (
    <div className="space-y-6">
      <VendorStatusBanner status={profile.status} />
      <VendorProfileForm profile={profile} onUpdate={updateProfile} />
    </div>
  );
};

export default VendorSettings;
