import { ProductFormData, DatabaseProductData } from '@/types/product';

export const cleanProductDataForInsert = (productData: ProductFormData, userId: string): DatabaseProductData => {
  console.log('🧹 Cleaning product data for database insertion:', productData);
  
  // Ensure arrays are properly formatted
  const cleanImages = Array.isArray(productData.images) ? 
    productData.images.filter(Boolean) : [];
  const cleanColors = Array.isArray(productData.colors) ? 
    productData.colors.filter(Boolean) : [];
  
  // Clean and structure sizes data properly
  const cleanSizes = Array.isArray(productData.sizes) ? 
    productData.sizes
      .filter(size => size && size.size && typeof size.size === 'string')
      .map(size => ({
        size: String(size.size).trim(),
        stock: Number(size.stock) || 0,
        price: Number(size.price) || Number(productData.price) || 0
      })) : [];

  // Calculate total inventory from all sizes
  const totalInventory = cleanSizes.reduce((sum, size) => sum + size.stock, 0);
  
  // Prepare main image
  const mainImage = productData.main_image || cleanImages[0] || '';
  
  const cleanData: DatabaseProductData = {
    user_id: userId,
    name: String(productData.name || '').trim(),
    description: String(productData.description || '').trim(),
    price: Number(productData.price) || (cleanSizes.length > 0 ? cleanSizes[0].price : 0),
    category: String(productData.category || '').trim(),
    main_image: mainImage,
    image_url: mainImage, // Keep both for compatibility
    images: cleanImages,
    colors: cleanColors,
    sizes: cleanSizes, // This will be stored as JSONB
    discount: Number(productData.discount) || 0,
    featured: Boolean(productData.featured),
    stock: Number(productData.stock) || totalInventory,
    inventory: Number(productData.inventory) || totalInventory
  };

  console.log('✅ Cleaned product data:', cleanData);
  return cleanData;
};

export const formatProductForDisplay = (rawProduct: any) => {
  if (!rawProduct) return null;
  
  // Ensure sizes is always an array
  let sizes = [];
  if (rawProduct.sizes) {
    if (Array.isArray(rawProduct.sizes)) {
      sizes = rawProduct.sizes;
    } else if (typeof rawProduct.sizes === 'string') {
      try {
        sizes = JSON.parse(rawProduct.sizes);
      } catch (e) {
        console.warn('Failed to parse sizes JSON:', rawProduct.sizes);
        sizes = [];
      }
    }
  }
  
  // Ensure colors is always an array
  let colors = [];
  if (rawProduct.colors) {
    if (Array.isArray(rawProduct.colors)) {
      colors = rawProduct.colors;
    } else if (typeof rawProduct.colors === 'string') {
      try {
        colors = JSON.parse(rawProduct.colors);
      } catch (e) {
        console.warn('Failed to parse colors JSON:', rawProduct.colors);
        colors = [];
      }
    }
  }
  
  // Ensure images is always an array
  let images = [];
  if (rawProduct.images) {
    if (Array.isArray(rawProduct.images)) {
      images = rawProduct.images;
    } else if (typeof rawProduct.images === 'string') {
      try {
        images = JSON.parse(rawProduct.images);
      } catch (e) {
        console.warn('Failed to parse images JSON:', rawProduct.images);
        images = [];
      }
    }
  }
  
  return {
    ...rawProduct,
    sizes,
    colors,
    images,
    price: Number(rawProduct.price) || 0,
    discount: Number(rawProduct.discount) || 0,
    stock: Number(rawProduct.stock) || 0,
    inventory: Number(rawProduct.inventory) || 0
  };
};
