import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploaderProps {
  value?: string[];
  onChange: (imgs: string[]) => void;
  label?: string;
  bucket?: string;  // Default: 'products', can be 'promos' for categories/ads
  folder?: string;  // Default: '' (root), can be 'categories/' or 'images/'
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = [],
  onChange,
  label,
  bucket = 'products',
  folder = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // تحديد الحد الأقصى 5 صور
    if (value.length + files.length > 5) {
      toast.error('الحد الأقصى 5 صور فقط');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    const currentImages = Array.isArray(value) ? value : [];

    try {
      for (const file of files) {
        // 1. إنشاء اسم فريد للملف
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = folder ? `${folder}${fileName}` : fileName;

        // 2. الرفع المباشر لـ Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: false,
            contentType: file.type // مهم عشان المتصفح يعرف نوع الملف
          });

        if (uploadError) throw uploadError;

        // 3. الحصول على الرابط العلني (Public URL)
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      // 4. حفظ الروابط فقط في الداتابيز
      onChange([...currentImages, ...uploadedUrls]);
      toast.success("تم رفع الصور للمخزن بنجاح");

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('فشل رفع الصور: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (idx: number) => {
    // ملحوظة: مسح الصورة من الواجهة بس، مش بنمسحها من المخزن عشان منعقدش الأمور دلوقتي
    const updated = value.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="flex flex-col gap-4">
        {/* منطقة رفع الصور */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
            ${uploading ? 'bg-gray-50 border-gray-300 cursor-not-allowed' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            disabled={uploading}
          />

          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">جاري رفع الصور للسيرفر...</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">اضغط لرفع الصور</p>
                <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 5 صور</p>
              </div>
            </>
          )}
        </div>

        {/* عرض الصور المرفوعة */}
        {value.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {value.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-gray-100">
                <img
                  src={img}
                  alt={`Product ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx);
                    }}
                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                    title="حذف الصورة"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;