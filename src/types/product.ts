export interface ProductSize {
  size: string;
  stock: number;
  [key: string]: any; // This makes it compatible with Json type
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number | string;
  category?: string;
  main_image?: string;
  images?: string[];
  colors?: string[];
  sizes?: ProductSize[];
  discount?: number | string;
  featured?: boolean;
  stock?: number | string;
  inventory?: number | string;
}

// This interface matches the database schema exactly
export interface DatabaseProductData {
  user_id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  main_image: string;
  image_url: string;
  images: string[];
  colors: string[];
  sizes: any; // Use 'any' for JSON fields to avoid type conflicts
  discount: number;
  featured: boolean;
  stock: number;
  inventory: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Keep CleanProductData for internal use
export interface CleanProductData {
  user_id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  main_image: string;
  image_url: string;
  images: string[];
  colors: string[];
  sizes: ProductSize[];
  discount: number;
  featured: boolean;
  stock: number;
  inventory: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number | string;
  category?: string;
  main_image?: string;
  images?: string[];
  colors?: string[];
  sizes?: ProductSize[];
  discount?: number | string;
  featured?: boolean;
  stock?: number | string;
  inventory?: number | string;
}
