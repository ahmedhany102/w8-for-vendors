export interface Order {
  id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      zipCode: string;
    };
  };
  items: OrderItem[];
  totalAmount: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PAID" | "PENDING" | "FAILED" | "REFUNDED";
  paymentInfo?: {
    method: "CASH" | "CREDIT_CARD" | "WALLET" | "BANK_TRANSFER";
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
  };
  couponInfo?: {
    code: string;
    discountPercentage: number;
    discountAmount: number;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
  color?: string;
  size?: string;
}

// Adding these interfaces that are referenced in other files
export type CustomerInfo = Order['customerInfo'];
export type PaymentInfo = Order['paymentInfo'];
