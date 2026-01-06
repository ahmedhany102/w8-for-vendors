import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUploader from '@/components/admin/ImageUploader';
import HierarchicalCategorySelector from '@/components/admin/HierarchicalCategorySelector';
import ProductColorVariantManager from '@/components/admin/ProductColorVariantManager';
import { ProductFormData } from '@/types/product';
import { VendorProduct } from '@/hooks/useVendorProducts';
import { ProductVariantService, ProductVariant } from '@/services/productVariantService';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';

interface VendorProductFormProps {
  initialData?: VendorProduct | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ColorVariant {
  id?: string;
  color: string;
  image: string | null;
  options: Array<{
    id?: string;
    size: string;
    price: number;
    stock: number;
  }>;
}

export const VendorProductForm: React.FC<VendorProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { categories } = useCategories();
  
  // Find parent category for initial data
  const findParentCategoryId = (categoryId: string | null | undefined): string | null => {
    if (!categoryId) return null;
    const category = categories.find(c => c.id === categoryId);
    return category?.parent_id || null;
  };

  const initialCategoryId = initialData?.category_id || initialData?.category || '';
  const initialParentId = findParentCategoryId(initialCategoryId);

  const [parentCategoryId, setParentCategoryId] = useState<string | null>(initialParentId);
  const [childCategoryId, setChildCategoryId] = useState<string | null>(initialCategoryId || null);
  
  const [formData, setFormData] = useState<ProductFormData & { is_best_seller?: boolean }>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    category: initialCategoryId,
    main_image: initialData?.main_image || initialData?.image_url || '',
    images: initialData?.images || [],
    colors: initialData?.colors || [],
    sizes: initialData?.sizes || [],
    discount: initialData?.discount || 0,
    featured: initialData?.featured || false,
    stock: initialData?.stock || initialData?.inventory || 0,
    inventory: initialData?.inventory || initialData?.stock || 0,
    is_best_seller: (initialData as any)?.is_best_seller || false,
  });

  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [savingVariants, setSavingVariants] = useState(false);

  // Load existing variants if editing
  useEffect(() => {
    const loadVariants = async () => {
      if (initialData?.id) {
        const variants = await ProductVariantService.loadProductVariants(initialData.id);
        setColorVariants(variants);
      }
    };
    loadVariants();
  }, [initialData?.id]);

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantsChange = (variants: ColorVariant[]) => {
    setColorVariants(variants);
    
    // Calculate total stock from variants
    const totalStock = variants.reduce((sum, v) => 
      sum + v.options.reduce((optSum, opt) => optSum + (opt.stock || 0), 0), 0
    );
    
    if (variants.length > 0 && totalStock > 0) {
      handleChange('stock', totalStock);
      handleChange('inventory', totalStock);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate variants if they exist
    if (colorVariants.length > 0) {
      const invalidVariants = colorVariants.filter(v => !v.color.trim() || !v.image);
      if (invalidVariants.length > 0) {
        toast.error('يرجى إدخال اسم اللون والصورة لكل لون');
        return;
      }
      
      const variantsWithoutOptions = colorVariants.filter(v => v.options.length === 0);
      if (variantsWithoutOptions.length > 0) {
        toast.error('يرجى إضافة مقاس واحد على الأقل لكل لون');
        return;
      }
    }

    try {
      // Submit the main product data
      await onSubmit(formData);
      
      // Note: Variants will be saved after product creation in the parent component
      // The parent should call saveVariants with the new product ID
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  // Expose variants for parent to save after product creation
  (window as any).__pendingColorVariants = colorVariants;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
          <TabsTrigger value="variants">الألوان والمقاسات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">السعر الأساسي (ج.م) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                يمكنك تحديد سعر مختلف لكل مقاس في قسم الألوان والمقاسات
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف المنتج</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="أدخل وصف المنتج"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <HierarchicalCategorySelector
                parentCategoryId={parentCategoryId}
                childCategoryId={childCategoryId}
                onParentChange={(id) => setParentCategoryId(id)}
                onChildChange={(id) => {
                  setChildCategoryId(id);
                  handleChange('category', id || '');
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">الخصم (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount}
                onChange={(e) => handleChange('discount', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_best_seller"
              checked={formData.is_best_seller}
              onCheckedChange={(checked) => handleChange('is_best_seller' as keyof ProductFormData, checked)}
            />
            <Label htmlFor="is_best_seller">Best Seller</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => handleChange('featured', checked)}
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>

          <div className="space-y-2">
            <Label>صور المنتج الرئيسية</Label>
            <p className="text-xs text-muted-foreground mb-2">
              هذه الصور تظهر في قائمة المنتجات. أضف صور لكل لون في قسم الألوان والمقاسات.
            </p>
            <ImageUploader
              value={[formData.main_image, ...(formData.images || [])].filter(Boolean) as string[]}
              onChange={(urls) => {
                if (urls.length > 0) {
                  handleChange('main_image', urls[0]);
                  handleChange('images', urls.slice(1));
                } else {
                  handleChange('main_image', '');
                  handleChange('images', []);
                }
              }}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="variants" className="mt-4">
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">إدارة المخزون بالألوان والمقاسات</h4>
            <p className="text-sm text-muted-foreground">
              أضف ألوان المنتج مع صورة لكل لون، ثم حدد المقاسات المتاحة مع السعر والكمية لكل مقاس.
              سيتم حساب المخزون الإجمالي تلقائياً.
            </p>
          </div>
          
          <ProductColorVariantManager
            variants={colorVariants}
            onChange={handleVariantsChange}
            productId={initialData?.id}
          />
          
          {colorVariants.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                إجمالي المخزون: {colorVariants.reduce((sum, v) => 
                  sum + v.options.reduce((optSum, opt) => optSum + (opt.stock || 0), 0), 0
                )} قطعة
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading || savingVariants}>
          {loading || savingVariants ? 'جاري الحفظ...' : initialData ? 'تحديث المنتج' : 'إضافة المنتج'}
        </Button>
      </div>
    </form>
  );
};
