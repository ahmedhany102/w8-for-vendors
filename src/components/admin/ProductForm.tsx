
import React, { useState, useEffect } from "react";
import SizeManager, { SizeItem } from "./SizeManager";
import { Product, SizeWithStock } from "@/models/Product";

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (product: Omit<Product, "id">) => void;
  submitLabel?: string;
}

// Updated categories to match current requirements
const PRODUCT_CATEGORIES = [
  'T-Shirts',
  'Jackets', 
  'Pants',
  'Shoes'
];

// Type for color image for internal use in form
interface ColorImageInternal {
  color: string;
  imageUrl: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData = {}, onSubmit, submitLabel = "حفظ المنتج" }) => {
  const [name, setName] = useState(initialData.name || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [type, setType] = useState(initialData.type || "");
  const [colors, setColors] = useState<string[]>(initialData.colors || []);
  const [details, setDetails] = useState(initialData.details || "");
  const [hasDiscount, setHasDiscount] = useState(initialData.hasDiscount || false);
  const [discount, setDiscount] = useState(initialData.discount || 0);
  const [mainImage, setMainImage] = useState(initialData.mainImage || "");
  const [additionalImages, setAdditionalImages] = useState<string[]>(initialData.images || []);
  const [colorImages, setColorImages] = useState<ColorImageInternal[]>([]);
  const [sizes, setSizes] = useState<SizeItem[]>(
    initialData.sizes 
      ? initialData.sizes.map(s => ({ 
          size: s.size,
          price: s.price,
          stock: s.stock,
          image: ""
        })) 
      : []
  );
  
  // Initialize colorImages from initialData if available
  useEffect(() => {
    if (initialData.colorImages && initialData.colors) {
      const colorImagesArray: ColorImageInternal[] = [];
      
      initialData.colors.forEach(color => {
        // Get images for this color
        const images = initialData.colorImages?.[color];
        if (images && images.length > 0) {
          colorImagesArray.push({
            color,
            imageUrl: images[0] // Use the first image
          });
        }
      });
      
      setColorImages(colorImagesArray);
    }
  }, [initialData]);
  
  const [error, setError] = useState<string>("");

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

  // Handle additional images upload
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAdditionalImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAdditionalImage = (indexToRemove: number) => {
    setAdditionalImages(additionalImages.filter((_, index) => index !== indexToRemove));
  };

  // Handle color image file upload
  const handleColorImageUpload = (colorIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && colors[colorIndex]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedColorImages = [...colorImages];
        const existingIndex = updatedColorImages.findIndex(ci => ci.color === colors[colorIndex]);
        if (existingIndex >= 0) {
          updatedColorImages[existingIndex].imageUrl = reader.result as string;
        } else {
          updatedColorImages.push({ color: colors[colorIndex], imageUrl: reader.result as string });
        }
        setColorImages(updatedColorImages);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle color name change
  const handleColorNameChange = (index: number, value: string) => {
    const newColors = [...colors];
    const oldColor = newColors[index];
    newColors[index] = value;
    setColors(newColors);
    
    // Update colorImages if the color name changes
    const updatedColorImages = colorImages.map(ci => ci.color === oldColor ? { ...ci, color: value } : ci);
    setColorImages(updatedColorImages);
  };

  const addColor = () => {
    setColors([...colors, '']);
  };

  const removeColor = (index: number) => {
    const colorToRemove = colors[index];
    setColors(colors.filter((_, i) => i !== index));
    setColorImages(colorImages.filter(ci => ci.color !== colorToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation check
    if (!name.trim() || !category || !type.trim() || (!mainImage && additionalImages.length === 0) || colors.length === 0 || sizes.length === 0) {
      setError("يرجى ملء جميع الحقول المطلوبة (الاسم، القسم، النوع، صور المنتج، الألوان، المقاسات)");
      return;
    }
    
    // Basic check for color names and images
    if (colors.some(color => !color.trim())) {
      setError("يرجى إدخال اسم لكل لون");
      return;
    }
    
    // Check that each color has a corresponding image
    if (colors.some(color => !colorImages.find(ci => ci.color === color))) {
      setError("يرجى تحميل صورة لكل لون مضاف");
      return;
    }

    const formattedSizes: SizeWithStock[] = sizes.map(sizeItem => ({
      size: sizeItem.size,
      price: sizeItem.price,
      stock: sizeItem.stock
    }));
    
    setError(""); // Clear error on successful validation
    
    // Combine all images
    const allImages = [...additionalImages];
    if (mainImage) {
      allImages.unshift(mainImage);
    }
    
    // Convert colorImages array to Record<string, string[]>
    const formattedColorImages: Record<string, string[]> = {};
    colorImages.forEach(ci => {
      formattedColorImages[ci.color] = [ci.imageUrl];
    });
    
    // Construct the product object to be submitted
    onSubmit({
      name: name.trim(),
      category: category,
      type: type.trim(),
      colors,
      colorImages: formattedColorImages,
      details,
      hasDiscount,
      discount: hasDiscount ? discount : 0,
      mainImage: mainImage || additionalImages[0] || "",
      images: allImages,
      sizes: formattedSizes,
      description: details,
      price: formattedSizes.length > 0 ? formattedSizes[0].price : 0,
      inventory: formattedSizes.reduce((sum, item) => sum + item.stock, 0),
      createdAt: initialData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto p-4">
      {/* Product Details */}
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
        
        <div>
          <label className="block text-sm font-medium mb-1">القسم*</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            required
          >
            <option value="">اختر القسم</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">النوع*</label>
          <input
            type="text"
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            required
            placeholder="مثل: قميص كاجوال، بدلة رسمية، إلخ"
          />
        </div>
        <div></div> {/* Placeholder for layout */}
      </div>

      {/* Description */}
      <div>
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
      <div>
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

      {/* Additional Images Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">صور إضافية للمنتج</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdditionalImagesUpload}
          className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        {additionalImages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {additionalImages.map((image, index) => (
              <div key={index} className="relative group">
                <img src={image} alt={`product ${index + 1}`} className="h-20 w-20 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Color and Color Images */}
      <div>
        <label className="block text-sm font-medium mb-1">الألوان وصور الألوان المتاحة*</label>
        <div className="space-y-4">
          {colors.map((color, index) => (
            <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 border rounded-md">
              <div className="flex-1 w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">اسم اللون*</label>
                <input
                  type="text"
                  value={color}
                  onChange={e => handleColorNameChange(index, e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="اسم اللون (مثال: أحمر)"
                  required
                />
              </div>
              <div className="flex-1 w-full md:w-auto">
                <label className="block text-sm font-medium mb-1">صورة اللون*</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleColorImageUpload(index, e)}
                  className="w-full p-2 border rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  required={!colorImages.find(ci => ci.color === color)}
                />
                {colorImages.find(ci => ci.color === color)?.imageUrl && (
                  <img
                    src={colorImages.find(ci => ci.color === color)?.imageUrl}
                    alt={`Image for ${color}`}
                    className="h-16 w-16 object-cover rounded mt-2"
                  />
                )}
              </div>
              
              <button
                type="button"
                onClick={() => removeColor(index)}
                className="mt-2 md:mt-auto text-red-600 hover:text-red-700 self-end md:self-center"
              >
                حذف اللون
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addColor}
            className="text-green-600 hover:text-green-700 text-sm font-semibold"
          >
            + إضافة لون جديد
          </button>
        </div>
      </div>

      {/* Sizes Management */}
      <div>
        <label className="block text-sm font-medium mb-1">المقاسات المتاحة*</label>
        <div className="overflow-x-auto">
          <SizeManager sizes={sizes} onChange={setSizes} />
        </div>
      </div>

      {/* Discount */}
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

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded font-bold text-sm"
      >
        {submitLabel}
      </button>
    </form>
  );
};

export default ProductForm;
