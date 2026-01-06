import React, { useState, useEffect } from "react";
import { Product, SizeWithStock } from "@/models/Product";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CategorySelector from "./CategorySelector";
import ProductColorVariantManager from "./ProductColorVariantManager";
import { ProductVariantService, ProductVariant } from "@/services/productVariantService";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (product: Omit<Product, "id">, saveVariants?: (productId: string) => Promise<boolean>) => void;
  submitLabel?: string;
  onCancel?: () => void;
  allowSizesWithoutColors?: boolean;
  predefinedCategories?: string[];
  predefinedTypes?: string[];
}

const ImprovedProductForm = ({
  initialData = {}, 
  onSubmit, 
  submitLabel = "حفظ المنتج", 
  onCancel, 
  allowSizesWithoutColors,
  predefinedCategories,
  predefinedTypes
}: ProductFormProps) => {
  // Basic product information
  const [name, setName] = useState(initialData.name || "");
  const [categoryId, setCategoryId] = useState(initialData.category_id || "");
  const [details, setDetails] = useState(initialData.details || initialData.description || "");
  const [mainImage, setMainImage] = useState(initialData.main_image || initialData.image_url || "");
  
  // Discount information
  const [hasDiscount, setHasDiscount] = useState(initialData.hasDiscount || false);
  const [discount, setDiscount] = useState(initialData.discount || 0);
  
  // Product variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  
  // Simple product (no variations)
  const [simpleProductPrice, setSimpleProductPrice] = useState(initialData.price || 0);
  const [simpleProductStock, setSimpleProductStock] = useState(initialData.inventory || 0);

  // Additional images for gallery
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Validation state
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load existing variants when editing
  useEffect(() => {
    const loadVariants = async () => {
      if (initialData.id) {
        console.log('🔄 Loading existing variants for product:', initialData.id);
        const existingVariants = await ProductVariantService.loadProductVariants(initialData.id);
        if (existingVariants.length > 0) {
          setVariants(existingVariants);
          setHasVariants(true);
          console.log('✅ Loaded existing variants:', existingVariants);
        }
      }
    };

    loadVariants();

    // Initialize gallery images (exclude main image)
    if (initialData.images && Array.isArray(initialData.images)) {
      const mainImg = initialData.main_image || initialData.image_url;
      const galleryImgs = initialData.images.filter(img => img !== mainImg);
      setGalleryImages(galleryImgs);
    }
  }, [initialData]);

  // Handle main image file upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMainImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle gallery image upload
  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form validation
  const validateForm = () => {
    if (!name.trim()) return "يرجى إدخال اسم المنتج";
    if (!categoryId || categoryId === "" || categoryId === "placeholder") return "يرجى اختيار القسم";
    if (!mainImage) return "يرجى تحميل صورة رئيسية للمنتج";
    
    if (hasVariants) {
      if (variants.length === 0) return "يرجى إضافة لون واحد على الأقل";
      
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        if (!variant.color.trim()) return "يرجى إدخال اسم لكل لون";
        if (!variant.image) return `يرجى تحميل صورة للون: ${variant.color || `#${i+1}`}`;
        
        if (variant.options.length === 0) return `يرجى إضافة مقاس واحد على الأقل للون: ${variant.color}`;
        
        for (let j = 0; j < variant.options.length; j++) {
          const option = variant.options[j];
          if (!option.size.trim()) return `يرجى إدخال اسم المقاس للون: ${variant.color}`;
          if (option.price <= 0) return `يرجى إدخال سعر صحيح للمقاس: ${option.size} من اللون: ${variant.color}`;
          if (option.stock < 0) return `يرجى إدخال كمية صالحة للمقاس: ${option.size} من اللون: ${variant.color}`;
        }
      }
    } else {
      if (simpleProductPrice <= 0) return "يرجى إدخال سعر صحيح للمنتج";
      if (simpleProductStock < 0) return "يرجى إدخال كمية صالحة للمنتج";
    }
    
    return "";
  };

  // Variant saving function
  const saveVariantsToDatabase = async (productId: string): Promise<boolean> => {
    if (hasVariants && variants.length > 0) {
      console.log('🔄 Saving variants for product:', productId);
      const success = await ProductVariantService.saveProductVariants(productId, variants);
      if (success) {
        toast.success('تم حفظ ألوان المنتج بنجاح');
      }
      return success;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('🎯 Form submission - categoryId:', categoryId);
    console.log('🎯 Form submission - hasVariants:', hasVariants);
    console.log('🎯 Form submission - variants:', variants);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      setLoading(false);
      return;
    }
    
    try {
      // Format data for submission
      let formattedSizes: SizeWithStock[] = [];
      let formattedColors: string[] = [];
      let allImages: string[] = [];
      
      // Build image arrays
      if (mainImage) {
        allImages.push(mainImage);
      }
      allImages = [...allImages, ...galleryImages];
      
      if (hasVariants) {
        // For variants, we'll handle them separately after product creation
        formattedColors = variants.map(variant => variant.color);
        
        // Add variant images to main images array
        variants.forEach(variant => {
          if (variant.image && !allImages.includes(variant.image)) {
            allImages.push(variant.image);
          }
        });
        
        // For compatibility, create a basic size array from all variants
        variants.forEach(variant => {
          variant.options.forEach(option => {
            formattedSizes.push({
              size: option.size,
              price: option.price,
              stock: option.stock
            });
          });
        });
      } else {
        // Simple product
        formattedSizes = [{
          size: "standard",
          price: simpleProductPrice,
          stock: simpleProductStock
        }];
      }
      
      // Calculate inventory
      const calculatedInventory = formattedSizes.reduce((sum, item) => sum + item.stock, 0);
      
      // Create the product object
      const productData: any = {
        name: name.trim(),
        category_id: categoryId,
        description: details,
        discount: hasDiscount ? discount : 0,
        main_image: mainImage,
        image_url: mainImage,
        images: allImages,
        colors: formattedColors,
        sizes: formattedSizes,
        price: formattedSizes.length > 0 ? formattedSizes[0].price : 0,
        inventory: calculatedInventory,
        stock: calculatedInventory,
        featured: false
      };
      
      console.log('🎯 Submitting product data:', productData);
      
      // Submit the product with variant saving callback
      console.log('🎯 About to call onSubmit with product data and variant saver');
      await onSubmit(productData, hasVariants ? saveVariantsToDatabase : undefined);
      
      setError("");
      
    } catch (error: any) {
      console.error('💥 Error submitting product:', error);
      setError('حدث خطأ أثناء حفظ المنتج');
      toast.error('حدث خطأ أثناء حفظ المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
      <div className="border-b pb-4 mb-4">
        <h3 className="text-lg font-bold mb-4">معلومات المنتج الأساسية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">اسم المنتج*</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              required
            />
          </div>
          
          <div className="space-y-4">
            <CategorySelector 
              value={categoryId} 
              onChange={(id) => {
                console.log('🎯 Category selected:', id);
                setCategoryId(id);
              }} 
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">الوصف*</label>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={4}
            required
            placeholder="وصف تفصيلي للمنتج..."
          />
        </div>

        {/* Main Image Upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">صورة المنتج الرئيسية*</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleMainImageUpload}
            className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          {mainImage && (
            <div className="mt-2">
              <div className="relative inline-block">
                <img src={mainImage} alt="main product" className="h-20 w-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => setMainImage("")}
                  className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-600 text-white rounded-full p-1 text-xs"
                >
                  X
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Gallery Images Upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">صور إضافية للمعرض</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryImageUpload}
            className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {galleryImages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {galleryImages.map((image, index) => (
                <div key={index} className="relative inline-block">
                  <img src={image} alt={`gallery ${index + 1}`} className="h-16 w-16 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-600 text-white rounded-full p-1 text-xs"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Type Selection */}
      <div className="border-b pb-4 mb-4">
        <h3 className="text-lg font-bold mb-4">نوع المنتج</h3>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={!hasVariants}
              onChange={() => setHasVariants(false)}
              className="mr-2"
            />
            منتج بسيط (بدون ألوان متعددة)
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              checked={hasVariants}
              onChange={() => setHasVariants(true)}
              className="mr-2"
            />
            منتج بألوان ومقاسات متعددة
          </label>
        </div>
        
        {!hasVariants ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">السعر*</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={simpleProductPrice}
                onChange={e => setSimpleProductPrice(Number(e.target.value))}
                className="w-full p-2 border rounded text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">الكمية المتوفرة*</label>
              <input
                type="number"
                min="0"
                value={simpleProductStock}
                onChange={e => setSimpleProductStock(Number(e.target.value))}
                className="w-full p-2 border rounded text-sm"
                required
              />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <ProductColorVariantManager
              variants={variants}
              onChange={setVariants}
              productId={initialData.id}
            />
          </div>
        )}
      </div>

      {/* Discount */}
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={hasDiscount}
            onChange={e => setHasDiscount(e.target.checked)}
            id="hasDiscount"
            className="w-4 h-4"
          />
          <label htmlFor="hasDiscount" className="text-sm font-medium">منتج عليه خصم</label>
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={discount}
                onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                className="w-20 p-2 border rounded text-sm"
                placeholder="نسبة الخصم %"
              />
              <span className="text-sm">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">{error}</div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded font-bold text-sm"
            disabled={loading}
          >
            إلغاء
          </Button>
        )}
        <Button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded font-bold text-sm"
          disabled={loading}
        >
          {loading ? "جاري الحفظ..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ImprovedProductForm;
