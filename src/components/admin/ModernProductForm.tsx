import React, { useState, useEffect } from "react";
import { Product } from "@/models/Product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import CategorySelector from "./CategorySelector";
import { ProductVariantService, ProductVariant } from "@/services/productVariantService";
import { Plus, Trash2, Upload } from "lucide-react";

export const ModernProductForm: React.FC<{ 
  initialData?: Partial<Product>; 
  onSubmit: (product: Omit<Product, "id">, productIdHandler?: (productId: string) => Promise<boolean>) => void; 
  submitLabel?: string; 
  onCancel?: () => void; 
}> = ({
  initialData = {},
  onSubmit,
  submitLabel = "حفظ المنتج",
  onCancel
}) => {
  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [basePrice, setBasePrice] = useState(initialData.price || 0);
  const [category, setCategory] = useState(initialData.category_id || "");
  const [mainImage, setMainImage] = useState(initialData.main_image || "");
  const [discount, setDiscount] = useState(initialData.discount || 0);
  const [hasDiscount, setHasDiscount] = useState(!!initialData.discount);
  const [isBestSeller, setIsBestSeller] = useState((initialData as any).is_best_seller || false);
  const [isHotDeal, setIsHotDeal] = useState((initialData as any).is_hot_deal || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Product variants state
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      color: "Default",
      image: mainImage,
      options: [{
        size: "Default",
        price: basePrice,
        stock: 0
      }]
    }
  ]);

  // Load existing variants if editing a product
  useEffect(() => {
    if (initialData.id) {
      loadExistingVariants(initialData.id);
    }
  }, [initialData.id]);

  // Update main image in default variant when changed
  useEffect(() => {
    if (mainImage && variants.length > 0 && variants[0].color === "Default") {
      const updatedVariants = [...variants];
      updatedVariants[0].image = mainImage;
      setVariants(updatedVariants);
    }
  }, [mainImage]);

  // Update base price in default variant when changed
  useEffect(() => {
    if (basePrice && variants.length > 0 && variants[0].color === "Default") {
      const updatedVariants = [...variants];
      if (updatedVariants[0].options.length > 0) {
        updatedVariants[0].options[0].price = basePrice;
      }
      setVariants(updatedVariants);
    }
  }, [basePrice]);

  const loadExistingVariants = async (productId: string) => {
    try {
      const loadedVariants = await ProductVariantService.loadProductVariants(productId);
      if (loadedVariants.length > 0) {
        setVariants(loadedVariants);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    }
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMainImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVariantImageUpload = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedVariants = [...variants];
        updatedVariants[variantIndex].image = reader.result as string;
        setVariants(updatedVariants);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariant = () => {
    setVariants([...variants, {
      color: "",
      image: null,
      options: [{
        size: "",
        price: basePrice,
        stock: 0
      }]
    }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      const updatedVariants = variants.filter((_, i) => i !== index);
      setVariants(updatedVariants);
    } else {
      toast.error("يجب أن يكون هناك متغير واحد على الأقل");
    }
  };

  const updateVariantColor = (variantIndex: number, color: string) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].color = color;
    setVariants(updatedVariants);
  };

  const addVariantOption = (variantIndex: number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].options.push({
      size: "",
      price: basePrice,
      stock: 0
    });
    setVariants(updatedVariants);
  };

  const removeVariantOption = (variantIndex: number, optionIndex: number) => {
    const updatedVariants = [...variants];
    if (updatedVariants[variantIndex].options.length > 1) {
      updatedVariants[variantIndex].options = updatedVariants[variantIndex].options.filter((_, i) => i !== optionIndex);
      setVariants(updatedVariants);
    } else {
      toast.error("يجب أن يكون هناك خيار واحد على الأقل لكل متغير");
    }
  };

  const updateVariantOption = (variantIndex: number, optionIndex: number, field: 'size' | 'price' | 'stock', value: string | number) => {
    const updatedVariants = [...variants];
    updatedVariants[variantIndex].options[optionIndex][field] = value as never;
    setVariants(updatedVariants);
  };

  const saveVariantsToDatabase = async (productId: string): Promise<boolean> => {
    try {
      console.log('💾 Saving variants for product:', productId, variants);
      return await ProductVariantService.saveProductVariants(productId, variants);
    } catch (error) {
      console.error('Error saving variants:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Validate basic fields
      if (!name.trim() || !description.trim() || basePrice <= 0 || !category.trim() || !mainImage) {
        setError("يرجى تعبئة جميع الحقول الأساسية!");
        setLoading(false);
        return;
      }

      // Validate variants
      for (const variant of variants) {
        if (!variant.color.trim()) {
          setError("يرجى تحديد لون لجميع المتغيرات");
          setLoading(false);
          return;
        }
        if (!variant.image) {
          setError("يرجى إضافة صورة لجميع المتغيرات");
          setLoading(false);
          return;
        }
        for (const option of variant.options) {
          if (!option.size.trim()) {
            setError("يرجى تحديد مقاس لجميع الخيارات");
            setLoading(false);
            return;
          }
          if (option.price <= 0) {
            setError("يرجى تحديد سعر صحيح لجميع الخيارات");
            setLoading(false);
            return;
          }
          if (option.stock < 0) {
            setError("يرجى تحديد مخزون صحيح لجميع الخيارات");
            setLoading(false);
            return;
          }
        }
      }

      const productData: any = {
        name: name.trim(),
        description: description.trim(),
        price: basePrice,
        category_id: category,
        discount: hasDiscount ? discount : 0,
        main_image: mainImage,
        image_url: mainImage,
        stock: variants.reduce((sum, v) => sum + v.options.reduce((s, o) => s + o.stock, 0), 0),
        inventory: variants.reduce((sum, v) => sum + v.options.reduce((s, o) => s + o.stock, 0), 0),
        featured: false,
        is_best_seller: isBestSeller,
        is_hot_deal: isHotDeal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📦 Submitting product with variants:', productData);
      onSubmit(productData, saveVariantsToDatabase);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError("حدث خطأ أثناء حفظ المنتج");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إدارة المنتج</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* اسم المنتج */}
          <div>
            <Label htmlFor="name">اسم المنتج *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          
          {/* وصف المنتج */}
          <div>
            <Label htmlFor="description">وصف المنتج *</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required />
          </div>
          
          {/* السعر الأساسي */}
          <div>
            <Label htmlFor="basePrice">السعر الأساسي *</Label>
            <Input id="basePrice" type="number" value={basePrice} onChange={e => setBasePrice(Number(e.target.value))} required />
          </div>
          
          {/* الفئة */}
          <CategorySelector value={category} onChange={setCategory} />
          
          {/* صورة المنتج الرئيسية */}
          <div>
            <Label>الصورة الرئيسية *</Label>
            <div>
              <input type="file" accept="image/*" onChange={handleMainImageUpload} id="main-image-upload" className="hidden" />
              <label htmlFor="main-image-upload" className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                {mainImage ? <img src={mainImage} alt="Main product" className="h-full w-full object-cover rounded-lg" />
                 : <div className="text-center flex flex-col items-center gap-2">
                     <Upload className="w-8 h-8 text-gray-400" />
                     <span>اضغط لتحميل الصورة الرئيسية</span>
                   </div>}
              </label>
            </div>
          </div>

          {/* Product Variants Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-bold">المتغيرات (الألوان والمقاسات) *</Label>
              <Button type="button" onClick={addVariant} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                إضافة متغير جديد
              </Button>
            </div>

            {variants.map((variant, variantIndex) => (
              <Card key={variantIndex} className="p-4 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="font-semibold">المتغير {variantIndex + 1}</Label>
                    {variants.length > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => removeVariant(variantIndex)} 
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Color Name */}
                  <div>
                    <Label>اسم اللون *</Label>
                    <Input 
                      value={variant.color} 
                      onChange={(e) => updateVariantColor(variantIndex, e.target.value)}
                      placeholder="مثال: أحمر، أزرق، أسود"
                      required
                    />
                  </div>

                  {/* Variant Image */}
                  <div>
                    <Label>صورة المتغير *</Label>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleVariantImageUpload(variantIndex, e)}
                        id={`variant-image-${variantIndex}`}
                        className="hidden"
                      />
                      <label 
                        htmlFor={`variant-image-${variantIndex}`}
                        className="cursor-pointer flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                      >
                        {variant.image ? (
                          <img src={variant.image} alt={`Variant ${variantIndex + 1}`} className="h-full w-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <span className="text-sm">اضغط لتحميل صورة اللون</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Size Options */}
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold">خيارات المقاسات</Label>
                      <Button 
                        type="button" 
                        onClick={() => addVariantOption(variantIndex)}
                        variant="outline" 
                        size="sm"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        إضافة مقاس
                      </Button>
                    </div>

                    {variant.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="grid grid-cols-4 gap-2 items-end">
                        <div>
                          <Label className="text-xs">المقاس *</Label>
                          <Input 
                            value={option.size}
                            onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'size', e.target.value)}
                            placeholder="S, M, L, XL"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">السعر *</Label>
                          <Input 
                            type="number"
                            value={option.price}
                            onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'price', Number(e.target.value))}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-xs">المخزون *</Label>
                          <Input 
                            type="number"
                            value={option.stock}
                            onChange={(e) => updateVariantOption(variantIndex, optionIndex, 'stock', Number(e.target.value))}
                            required
                          />
                        </div>
                        <div>
                          {variant.options.length > 1 && (
                            <Button 
                              type="button"
                              onClick={() => removeVariantOption(variantIndex, optionIndex)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Discount Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="hasDiscount" 
                checked={hasDiscount} 
                onChange={(e) => setHasDiscount(e.target.checked)}
              />
              <Label htmlFor="hasDiscount">تفعيل الخصم</Label>
            </div>
            {hasDiscount && (
              <div>
                <Label htmlFor="discount">نسبة الخصم (%)</Label>
                <Input 
                  id="discount"
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Best Seller & Hot Deal Toggles (Admin only) */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-lg font-semibold">تصنيفات خاصة</Label>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isBestSeller" 
                  checked={isBestSeller} 
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isBestSeller" className="cursor-pointer">⭐ الأكثر مبيعاً (Best Seller)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isHotDeal" 
                  checked={isHotDeal} 
                  onChange={(e) => setIsHotDeal(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isHotDeal" className="cursor-pointer">🔥 عرض ساخن (Hot Deal)</Label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                إلغاء
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "جاري الحفظ..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
