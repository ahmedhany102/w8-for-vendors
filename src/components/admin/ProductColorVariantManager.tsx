
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ColorVariantOption {
  id?: string;
  size: string;
  price: number;
  stock: number;
}

interface ColorVariant {
  id?: string;
  color: string;
  image: string | null;
  options: ColorVariantOption[];
}

interface ProductColorVariantManagerProps {
  variants: ColorVariant[];
  onChange: (variants: ColorVariant[]) => void;
  productId?: string;
}

const ProductColorVariantManager: React.FC<ProductColorVariantManagerProps> = ({
  variants,
  onChange,
  productId
}) => {
  const [localVariants, setLocalVariants] = useState<ColorVariant[]>(variants);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalVariants(variants);
  }, [variants]);

  const handleVariantChange = (index: number, field: keyof ColorVariant, value: any) => {
    const updatedVariants = [...localVariants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const handleOptionChange = (variantIndex: number, optionIndex: number, field: keyof ColorVariantOption, value: any) => {
    const updatedVariants = [...localVariants];
    const updatedOptions = [...updatedVariants[variantIndex].options];
    
    // Handle type conversion for numeric fields
    let convertedValue = value;
    if (field === 'price') {
      convertedValue = parseFloat(value) || 0;
    } else if (field === 'stock') {
      convertedValue = parseInt(value) || 0;
    }
    
    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: convertedValue };
    updatedVariants[variantIndex] = { ...updatedVariants[variantIndex], options: updatedOptions };
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const addVariant = () => {
    const newVariant: ColorVariant = {
      color: '',
      image: null,
      options: []
    };
    const updatedVariants = [...localVariants, newVariant];
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const removeVariant = (index: number) => {
    const updatedVariants = localVariants.filter((_, i) => i !== index);
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const addOption = (variantIndex: number) => {
    const newOption: ColorVariantOption = {
      size: '',
      price: 0,
      stock: 0
    };
    const updatedVariants = [...localVariants];
    updatedVariants[variantIndex].options.push(newOption);
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    const updatedVariants = [...localVariants];
    updatedVariants[variantIndex].options = updatedVariants[variantIndex].options.filter((_, i) => i !== optionIndex);
    setLocalVariants(updatedVariants);
    onChange(updatedVariants);
  };

  const handleImageUpload = async (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploadingIndex(variantIndex);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `variant_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `variants/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('فشل في رفع الصورة');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('products_images')
        .getPublicUrl(filePath);

      handleVariantChange(variantIndex, 'image', urlData.publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">إدارة ألوان المنتج</h3>
        <Button type="button" onClick={addVariant} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          إضافة لون جديد
        </Button>
      </div>

      {localVariants.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>لا توجد ألوان محددة. أضف لون جديد للبدء.</p>
          </CardContent>
        </Card>
      ) : (
        localVariants.map((variant, variantIndex) => (
          <Card key={variantIndex} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">لون #{variantIndex + 1}</CardTitle>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariant(variantIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم اللون *</Label>
                  <Input
                    value={variant.color}
                    onChange={(e) => handleVariantChange(variantIndex, 'color', e.target.value)}
                    placeholder="مثال: أحمر، أزرق، أسود"
                    required
                  />
                </div>
                <div>
                  <Label>صورة اللون *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(variantIndex, e)}
                      disabled={uploadingIndex === variantIndex}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700"
                    />
                    {uploadingIndex === variantIndex && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {variant.image && (
                    <div className="mt-2">
                      <img src={variant.image} alt={variant.color} className="h-16 w-16 object-cover rounded border" />
                    </div>
                  )}
                </div>
              </div>

              {/* Size Options */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">المقاسات والأسعار</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addOption(variantIndex)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    إضافة مقاس
                  </Button>
                </div>

                {variant.options.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed rounded">
                    لا توجد مقاسات. أضف مقاس للبدء.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 bg-gray-50 p-2 rounded">
                      <div>المقاس</div>
                      <div>السعر</div>
                      <div>الكمية</div>
                      <div>الحالة</div>
                      <div>إجراء</div>
                    </div>
                    {variant.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="grid grid-cols-5 gap-2 items-center p-2 border rounded">
                        <Input
                          value={option.size}
                          onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'size', e.target.value)}
                          placeholder="S, M, L"
                          className="text-sm"
                          required
                        />
                        <Input
                          type="number"
                          value={option.price.toString()}
                          onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="السعر"
                          min="0"
                          step="0.01"
                          className="text-sm"
                          required
                        />
                        <Input
                          type="number"
                          value={option.stock.toString()}
                          onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'stock', parseInt(e.target.value) || 0)}
                          placeholder="الكمية"
                          min="0"
                          className="text-sm"
                          required
                        />
                        <Badge className={option.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {option.stock > 0 ? "متوفر" : "نفذ"}
                        </Badge>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeOption(variantIndex, optionIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default ProductColorVariantManager;
