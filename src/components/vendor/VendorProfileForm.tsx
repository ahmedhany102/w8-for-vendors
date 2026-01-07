import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Store, Upload, X, Link as LinkIcon } from 'lucide-react';
import { VendorProfile, getStatusLabel, getStatusColor } from '@/hooks/useVendorProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorProfileFormProps {
  profile: VendorProfile;
  onUpdate: (updates: Partial<Pick<VendorProfile, 'store_name' | 'store_description' | 'phone' | 'address' | 'logo_url'>>) => Promise<boolean>;
}

export const VendorProfileForm = ({ profile, onUpdate }: VendorProfileFormProps) => {
  const [storeName, setStoreName] = useState(profile.store_name);
  const [storeDescription, setStoreDescription] = useState(profile.store_description || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [logoUrl, setLogoUrl] = useState(profile.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const changed =
      storeName !== profile.store_name ||
      storeDescription !== (profile.store_description || '') ||
      phone !== (profile.phone || '') ||
      address !== (profile.address || '') ||
      logoUrl !== (profile.logo_url || '');
    setHasChanges(changed);
  }, [storeName, storeDescription, phone, address, logoUrl, profile]);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_logo_${Date.now()}.${fileExt}`;
      const filePath = `vendor-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        toast.error('فشل في رفع الشعار');
        return null;
      }

      const { data } = supabase.storage
        .from('vendor-assets')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن لا يتجاوز 2MB');
      return;
    }

    setUploadingLogo(true);
    const url = await uploadImage(file);
    if (url) {
      setLogoUrl(url);
      toast.success('تم رفع الشعار بنجاح');
    }
    setUploadingLogo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      return;
    }

    setSaving(true);
    try {
      const success = await onUpdate({
        store_name: storeName.trim(),
        store_description: storeDescription.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        logo_url: logoUrl.trim() || null
      });
      if (success) {
        setHasChanges(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const isRestricted = profile.status !== 'approved';
  const storeUrl = profile.slug ? `/store/${profile.slug}` : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>معلومات المتجر</CardTitle>
              <CardDescription>تعديل معلومات متجرك الأساسية</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(profile.status)}>
            {getStatusLabel(profile.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isRestricted && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {profile.status === 'pending' && 'طلبك قيد المراجعة. سيتم إخطارك عند الموافقة.'}
              {profile.status === 'rejected' && 'تم رفض طلبك. يرجى التواصل مع الإدارة لمعرفة السبب.'}
              {profile.status === 'suspended' && 'تم إيقاف متجرك مؤقتاً. يرجى التواصل مع الإدارة.'}
            </p>
          </div>
        )}

        {storeUrl && profile.status === 'approved' && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <LinkIcon className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">رابط متجرك:</span>
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                {window.location.origin}{storeUrl}
              </a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section - This is the ONLY branding image */}
          <div className="space-y-2">
            <Label>شعار المتجر</Label>
            <p className="text-xs text-muted-foreground mb-2">
              سيظهر الشعار في رأس صفحة متجرك (الهيدر)
            </p>
            <div className="flex items-center gap-4">
              <div
                className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUrl ? (
                  <>
                    <img
                      src={logoUrl}
                      alt="Store logo"
                      className="w-full h-full object-contain p-2"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 w-6 h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogoUrl('');
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {uploadingLogo ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Store className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="رابط شعار المتجر"
                />
                <p className="text-xs text-muted-foreground">صورة مربعة 200x200 موصى بها</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">اسم المتجر *</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="اسم متجرك"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">وصف المتجر</Label>
            <Textarea
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="وصف مختصر عن متجرك ومنتجاتك"
              rows={3}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="رقم الهاتف"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="عنوان المتجر"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving || !hasChanges || !storeName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
