import { Order, OrderItem } from './Order';

// Mock database for orders
class OrderDatabase {
  private static instance: OrderDatabase;
  private orders: Order[];

  private constructor() {
    // Initialize with mock data or load from localStorage
    const savedOrders = localStorage.getItem('orders');
    this.orders = savedOrders ? JSON.parse(savedOrders) : [];
  }

  public static getInstance(): OrderDatabase {
    if (!OrderDatabase.instance) {
      OrderDatabase.instance = new OrderDatabase();
    }
    return OrderDatabase.instance;
  }

  // Save order to database
  public async saveOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber: `EG-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.push(newOrder);
    this.persistToStorage();
    
    // Send notification email (mock)
    this.sendOrderNotification(newOrder);
    
    return newOrder;
  }

  // Create order (alias for saveOrder for compatibility)
  public async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newOrder = await this.saveOrder(order);
    return newOrder.id;
  }

  // Cancel order by ID
  public async cancelOrder(orderId: string): Promise<Order | null> {
    return this.updateOrderStatus(orderId, "CANCELLED");
  }

  // Get all orders (for admin)
  public async getAllOrders(): Promise<Order[]> {
    return [...this.orders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Get orders by customer email
  public async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return [...this.orders]
      .filter(order => order.customerInfo.email === email)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get order by ID
  public async getOrderById(orderId: string): Promise<Order | undefined> {
    return this.orders.find(order => order.id === orderId);
  }

  // Get order by order number
  public async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    return this.orders.find(order => order.orderNumber === orderNumber);
  }

  // Update order status
  public async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return null;
    }
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      status: status,
      updatedAt: new Date().toISOString()
    };
    
    this.persistToStorage();
    
    return this.orders[orderIndex];
  }

  // Update payment status
  public async updatePaymentStatus(orderId: string, status: Order['paymentStatus']): Promise<Order | null> {
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
      return null;
    }
    
    this.orders[orderIndex] = {
      ...this.orders[orderIndex],
      paymentStatus: status,
      updatedAt: new Date().toISOString()
    };
    
    this.persistToStorage();
    
    return this.orders[orderIndex];
  }

  // Get recent orders - for admin dashboard
  public async getRecentOrders(limit: number = 5): Promise<Order[]> {
    return [...this.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Count orders by status - for admin dashboard
  public async countOrdersByStatus(): Promise<Record<Order['status'], number>> {
    const counts: Record<Order['status'], number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    
    this.orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    
    return counts;
  }

  // Get total revenue - for admin dashboard
  public async getTotalRevenue(): Promise<number> {
    return this.orders
      .filter(order => order.status !== 'CANCELLED')
      .reduce((total, order) => total + order.totalAmount, 0);
  }

  // Persist to localStorage
  private persistToStorage(): void {
    localStorage.setItem('orders', JSON.stringify(this.orders));
  }

  // Send email notification
  private sendOrderNotification(order: Order): void {
    // In a real application, this would send an actual email to the admin
  }
}

export default OrderDatabase;
