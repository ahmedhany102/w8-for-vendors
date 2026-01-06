import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Loader2 } from 'lucide-react';

interface VendorApplyFormProps {
  onSubmit: (storeName: string, storeDescription?: string, phone?: string, address?: string) => Promise<boolean>;
}

export const VendorApplyForm = ({ onSubmit }: VendorApplyFormProps) => {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(storeName.trim(), storeDescription.trim() || undefined, phone.trim() || undefined, address.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>انضم كبائع</CardTitle>
        <CardDescription>
          قدم طلبك لتصبح بائعاً معتمداً على منصتنا
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">اسم المتجر *</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="أدخل اسم متجرك"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">وصف المتجر</Label>
            <Textarea
              id="storeDescription"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="اكتب وصفاً مختصراً عن متجرك ومنتجاتك"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="رقم الهاتف للتواصل"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="عنوان المتجر أو المكتب"
              disabled={submitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !storeName.trim()}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري تقديم الطلب...
              </>
            ) : (
              'تقديم الطلب'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
