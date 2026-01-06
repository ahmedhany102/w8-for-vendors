
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP'
  }).format(amount);
}

// Helper function to get payment method display name
export function getPaymentMethodName(method: string | null): string {
  switch (method) {
    case 'card':
      return 'Credit/Debit Card';
    case 'cod':
      return 'Cash on Delivery';
    default:
      return 'Cash on Delivery';
  }
}
