
import { ProductFormData, ProductUpdateData } from '@/types/product';
import { createSanitizedProductSchema, sanitizeText, sanitizeHtml } from './sanitization';

// Safe product data validation helper with sanitization
export const validateProductData = (product: any): any | null => {
  if (!product || typeof product !== 'object') {
    console.warn('⚠️ Invalid product data:', product);
    return null;
  }

  // Sanitize string fields
  if (product.name) product.name = sanitizeText(product.name);
  if (product.description) product.description = sanitizeHtml(product.description);
  if (product.type) product.type = sanitizeText(product.type);
  if (product.category) product.category = sanitizeText(product.category);

  // Ensure sizes is always an array and sanitize
  if (product.sizes && !Array.isArray(product.sizes)) {
    console.warn('⚠️ Product sizes is not an array, converting:', product.sizes);
    try {
      product.sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : [];
    } catch {
      product.sizes = [];
    }
  }
  if (Array.isArray(product.sizes)) {
    product.sizes = product.sizes.map((size: any) => ({
      ...size,
      size: sanitizeText(size?.size || '')
    })).filter(size => size.size);
  }

  // Ensure colors is always an array and sanitize
  if (product.colors && !Array.isArray(product.colors)) {
    console.warn('⚠️ Product colors is not an array, converting:', product.colors);
    try {
      product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : [];
    } catch {
      product.colors = [];
    }
  }
  if (Array.isArray(product.colors)) {
    product.colors = product.colors.map(sanitizeText).filter(Boolean);
  }

  // Ensure images is always an array
  if (product.images && !Array.isArray(product.images)) {
    console.warn('⚠️ Product images is not an array, converting:', product.images);
    try {
      product.images = typeof product.images === 'string' ? JSON.parse(product.images) : [];
    } catch {
      product.images = [];
    }
  }

  // Set defaults for missing fields
  return {
    ...product,
    sizes: product.sizes || [],
    colors: product.colors || [],
    images: product.images || [],
    price: typeof product.price === 'number' ? product.price : 0,
    name: product.name || 'Unnamed Product',
    description: product.description || ''
  };
};

export const validateRequiredFields = (data: ProductFormData): string | null => {
  try {
    const schema = createSanitizedProductSchema();
    schema.parse(data);
    return null;
  } catch (error: any) {
    return error.errors?.[0]?.message || 'Validation failed';
  }
};

export const validateUpdateFields = (data: ProductUpdateData): string | null => {
  try {
    const schema = createSanitizedProductSchema().partial();
    schema.parse(data);
    return null;
  } catch (error: any) {
    return error.errors?.[0]?.message || 'Validation failed';
  }
};
