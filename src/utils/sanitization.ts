
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Sanitize HTML content to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// Sanitize plain text input
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

// Enhanced validation schemas with sanitization
export const createSanitizedProductSchema = () => z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long')
    .transform(sanitizeText),
  description: z.string()
    .max(1000, 'Description too long')
    .transform(sanitizeHtml)
    .optional(),
  price: z.number()
    .positive('Price must be positive')
    .max(999999, 'Price too high'),
  type: z.string()
    .min(1, 'Product type is required')
    .transform(sanitizeText),
  category: z.string()
    .transform(sanitizeText)
    .optional(),
  main_image: z.string()
    .url('Invalid image URL')
    .optional(),
  images: z.array(z.string().url()).optional(),
  colors: z.array(z.string().transform(sanitizeText)).optional(),
  sizes: z.array(z.object({
    size: z.string().transform(sanitizeText),
    stock: z.number().int().min(0),
    price: z.number().positive().optional()
  })).optional(),
  discount: z.number().min(0).max(100).optional(),
  featured: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
  inventory: z.number().int().min(0).optional()
});

export const createSanitizedUserSchema = () => z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform(sanitizeText),
  email: z.string()
    .email('Invalid email format')
    .transform(sanitizeText),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
});

// Rate limiting helper
export const createRateLimiter = (maxAttempts: number, windowMs: number) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const userAttempts = attempts.get(identifier);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (userAttempts.count >= maxAttempts) {
      return false;
    }
    
    userAttempts.count++;
    return true;
  };
};
