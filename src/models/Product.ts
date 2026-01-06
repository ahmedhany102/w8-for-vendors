
export interface SizeWithStock {
  size: string;
  stock: number;
  price: number;
}

export interface ColorImage {
  color: string;
  images: string[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  details?: string;
  price: number;
  category?: string;
  category_id?: string;
  main_image?: string;
  image_url?: string;
  images?: string[];
  colors?: string[];
  colorImages?: Record<string, string[]>;
  sizes?: SizeWithStock[];
  discount?: number;
  hasDiscount?: boolean;
  featured?: boolean;
  stock?: number;
  inventory?: number;
  user_id?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  rating?: number;
  [key: string]: any;
}
