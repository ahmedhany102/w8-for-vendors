import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface VendorAd {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  redirect_url: string | null;
  position: number;
  is_active: boolean;
  vendor_id: string;
}

interface VendorAdsManagementProps {
  vendorId: string;
}

const VendorAdsManagement: React.FC<VendorAdsManagementProps> = ({ vendorId }) => {
  const [ads, setAds] = useState<VendorAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<VendorAd | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [position, setPosition] = useState<'top' | 'mid'>('top');
  const [isActive, setIsActive] = useState(true);

  const fetchAds = useCallback(async () => {
    if (!vendorId) {
      setAds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching vendor ads for:', vendorId);

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Error fetching vendor ads:', error);
        toast.error('فشل في تحميل الإعلانات');
        return;
      }

      console.log('✅ Vendor ads loaded:', data?.length || 0);
      setAds((data || []) as VendorAd[]);
    } catch (error: any) {
      console.error('💥 Exception fetching vendor ads:', error);
      toast.error('فشل في تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setRedirectUrl('');
    setPosition('top');
    setIsActive(true);
    setEditingAd(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddAd = async () => {
    if (!imageUrl) {
      toast.error('يرجى إضافة صورة');
      return;
    }

    try {
      setSaving(true);
      const positionValue = position === 'top' ? 0 : 10;

      console.log('🆕 Adding vendor ad:', { vendorId, title });

      const { error } = await supabase
        .from('ads')
        .insert({
          vendor_id: vendorId,
          title: title || null,
          description: description || null,
          image_url: imageUrl,
          redirect_url: redirectUrl || null,
          position: positionValue,
          is_active: isActive
        });

      if (error) {
        console.error('❌ Error adding ad:', error);
        toast.error('فشل في إضافة الإعلان: ' + error.message);
        return;
      }

      console.log('✅ Ad added successfully');
      toast.success('تم إضافة الإعلان بنجاح');
      setShowAddDialog(false);
      resetForm();
      await fetchAds();
    } catch (error: any) {
      console.error('💥 Exception adding ad:', error);
      toast.error('فشل في إضافة الإعلان');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAd = async () => {
    if (!editingAd || !imageUrl) {
      toast.error('يرجى إضافة صورة');
      return;
    }

    try {
      setSaving(true);
      const positionValue = position === 'top' ? 0 : 10;

      console.log('✏️ Updating vendor ad:', editingAd.id);

      // Direct update with vendor_id check for security
      const { error } = await supabase
        .from('ads')
        .update({
          title: title || null,
          description: description || null,
          image_url: imageUrl,
          redirect_url: redirectUrl || null,
          position: positionValue,
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAd.id)
        .eq('vendor_id', vendorId);

      if (error) {
        console.error('❌ Error updating ad:', error);
        toast.error('فشل في تحديث الإعلان: ' + error.message);
        return;
      }

      console.log('✅ Ad updated successfully');
      toast.success('تم تحديث الإعلان بنجاح');
      setShowEditDialog(false);
      resetForm();
      await fetchAds();
    } catch (error: any) {
      console.error('💥 Exception updating ad:', error);
      toast.error('فشل في تحديث الإعلان');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;

    try {
      setDeleting(adId);
      console.log('🗑️ Deleting vendor ad:', adId);

      // Use the secure RPC function for vendor ad deletion
      const { data, error } = await supabase.rpc('delete_vendor_ad', {
        p_ad_id: adId,
        p_vendor_id: vendorId
      });

      if (error) {
        console.error('❌ Error deleting ad:', error);
        toast.error('فشل في حذف الإعلان: ' + error.message);
        return;
      }

      if (!data) {
        toast.error('لم يتم العثور على الإعلان أو ليس لديك صلاحية حذفه');
        return;
      }

      console.log('✅ Ad deleted successfully');
      toast.success('تم حذف الإعلان بنجاح');
      await fetchAds();
    } catch (error: any) {
      console.error('💥 Exception deleting ad:', error);
      toast.error('فشل في حذف الإعلان');
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (ad: VendorAd) => {
    setEditingAd(ad);
    setTitle(ad.title || '');
    setDescription(ad.description || '');
    setImageUrl(ad.image_url);
    setRedirectUrl(ad.redirect_url || '');
    setPosition(ad.position < 10 ? 'top' : 'mid');
    setIsActive(ad.is_active);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AdFormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>العنوان (اختياري)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان الإعلان"
        />
      </div>
      <div>
        <Label>الوصف (اختياري)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف الإعلان"
        />
      </div>
      <div>
        <Label>الصورة *</Label>
        <div className="mt-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id={`ad-image-${isEdit ? 'edit' : 'add'}`}
          />
          <label
            htmlFor={`ad-image-${isEdit ? 'edit' : 'add'}`}
            className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:border-primary transition-colors"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="معاينة" className="h-full w-full object-cover rounded-lg" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <span className="text-sm text-muted-foreground">اضغط للرفع</span>
              </div>
            )}
          </label>
        </div>
      </div>
      <div>
        <Label>رابط التوجيه (اختياري)</Label>
        <Input
          value={redirectUrl}
          onChange={(e) => setRedirectUrl(e.target.value)}
          placeholder="https://..."
          dir="ltr"
        />
      </div>
      <div>
        <Label>الموضع</Label>
        <Select value={position} onValueChange={(v) => setPosition(v as 'top' | 'mid')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">أعلى الصفحة</SelectItem>
            <SelectItem value="mid">وسط الصفحة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label>نشط</Label>
      </div>
      <Button
        onClick={isEdit ? handleEditAd : handleAddAd}
        className="w-full"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            جاري الحفظ...
          </>
        ) : isEdit ? 'تحديث الإعلان' : 'إضافة الإعلان'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">إعلانات المتجر</h2>
          <p className="text-sm text-muted-foreground">
            إدارة البانرات الترويجية لمتجرك
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة إعلان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة إعلان جديد</DialogTitle>
            </DialogHeader>
            <AdFormContent isEdit={false} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Ads List */}
      {ads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">لا توجد إعلانات</h3>
            <p className="text-sm text-muted-foreground">
              أضف بانرات ترويجية لجذب العملاء
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={ad.image_url}
                    alt={ad.title || 'إعلان'}
                    className="w-24 h-16 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{ad.title || 'إعلان بدون عنوان'}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded text-xs ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {ad.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                      <span>•</span>
                      <span>{ad.position < 10 ? 'أعلى الصفحة' : 'وسط الصفحة'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(ad)}
                      disabled={deleting === ad.id}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteAd(ad.id)}
                      disabled={deleting === ad.id}
                    >
                      {deleting === ad.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الإعلان</DialogTitle>
          </DialogHeader>
          <AdFormContent isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorAdsManagement;