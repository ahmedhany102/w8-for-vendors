import React, { useState, useEffect } from 'react';
import { Search, Eye, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminOrders, useAdminOrderDetails, VendorOrder } from '@/hooks/useVendorOrders';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', variant: 'secondary', icon: Clock },
  PENDING: { label: 'قيد الانتظار', variant: 'secondary', icon: Clock },
  processing: { label: 'قيد المعالجة', variant: 'default', icon: Package },
  PROCESSING: { label: 'قيد المعالجة', variant: 'default', icon: Package },
  shipped: { label: 'تم الشحن', variant: 'default', icon: Truck },
  SHIPPED: { label: 'تم الشحن', variant: 'default', icon: Truck },
  delivered: { label: 'تم التوصيل', variant: 'default', icon: CheckCircle },
  DELIVERED: { label: 'تم التوصيل', variant: 'default', icon: CheckCircle },
  cancelled: { label: 'ملغي', variant: 'destructive', icon: XCircle },
  CANCELLED: { label: 'ملغي', variant: 'destructive', icon: XCircle },
};

interface VendorInfo {
  id: string;
  email: string;
  name: string;
}

const OrderDetailsDialog: React.FC<{
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ orderId, orderNumber, open, onOpenChange }) => {
  const { items, orderInfo, loading } = useAdminOrderDetails(orderId);
  const [vendors, setVendors] = useState<Record<string, VendorInfo>>({});

  // Fetch vendor info
  useEffect(() => {
    const fetchVendors = async () => {
      const vendorIds = [...new Set(items.map((item) => item.vendor_id))];
      if (vendorIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', vendorIds);

      if (!error && data) {
        const vendorMap: Record<string, VendorInfo> = {};
        data.forEach((v) => {
          vendorMap[v.id] = v;
        });
        setVendors(vendorMap);
      }
    };
    if (items.length > 0) {
      fetchVendors();
    }
  }, [items]);

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    if (!acc[item.vendor_id]) {
      acc[item.vendor_id] = [];
    }
    acc[item.vendor_id].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const customerInfo = orderInfo?.customer_info || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب #{orderNumber}</DialogTitle>
          <DialogDescription>
            عرض كامل للطلب مع تفاصيل كل بائع
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">بيانات العميل</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">الاسم:</span>
                  <p className="font-medium">{customerInfo.name || 'غير معروف'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">البريد:</span>
                  <p className="font-medium">{customerInfo.email || 'غير معروف'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الهاتف:</span>
                  <p className="font-medium">{customerInfo.phone || 'غير معروف'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">العنوان:</span>
                  <p className="font-medium">{customerInfo.address || 'غير معروف'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            {orderInfo && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">إجمالي الطلب:</span>
                    <p className="font-bold text-lg">{orderInfo.total_amount} ج.م</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الحالة:</span>
                    <Badge variant={statusConfig[orderInfo.status]?.variant || 'secondary'} className="mt-1">
                      {statusConfig[orderInfo.status]?.label || orderInfo.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">عدد البائعين:</span>
                    <p className="font-medium">{Object.keys(itemsByVendor).length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">عدد المنتجات:</span>
                    <p className="font-medium">{items.length}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items by Vendor */}
            {Object.entries(itemsByVendor).map(([vendorId, vendorItems]) => {
              const vendor = vendors[vendorId];
              const vendorTotal = vendorItems.reduce((sum, item) => sum + item.total_price, 0);

              return (
                <Card key={vendorId}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {vendor?.name || vendor?.email || 'بائع غير معروف'}
                      </CardTitle>
                      <Badge variant="outline">{vendorTotal} ج.م</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendorItems.map((item) => {
                        const itemStatus = statusConfig[item.item_status] || statusConfig.pending;
                        const StatusIcon = itemStatus.icon;

                        return (
                          <div key={item.item_id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                            <img
                              src={item.product_image || '/placeholder.svg'}
                              alt={item.product_name}
                              className="w-16 h-16 object-cover rounded-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{item.product_name}</h4>
                              <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4">
                                <span>الكمية: {item.quantity}</span>
                                <span>السعر: {item.unit_price} ج.م</span>
                                {item.size && <span>المقاس: {item.size}</span>}
                                {item.color && <span>اللون: {item.color}</span>}
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold">{item.total_price} ج.م</p>
                              <Badge variant={itemStatus.variant} className="mt-1 text-xs">
                                <StatusIcon className="h-3 w-3 ml-1" />
                                {itemStatus.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const AdminOrdersManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const { orders, loading, updateOrderStatus } = useAdminOrders(
    vendorFilter || undefined,
    statusFilter
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [vendors, setVendors] = useState<VendorInfo[]>([]);

  // Fetch vendors for filter
  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name');

      if (!error && data) {
        setVendors(data);
      }
    };
    fetchVendors();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.order_status === 'PENDING' || o.order_status === 'pending').length,
    processing: orders.filter((o) => o.order_status === 'PROCESSING' || o.order_status === 'processing').length,
    delivered: orders.filter((o) => o.order_status === 'DELIVERED' || o.order_status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قيد الانتظار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قيد المعالجة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">تم التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة الطلبات</CardTitle>
          <CardDescription>عرض وإدارة جميع الطلبات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الطلب أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                <SelectItem value="PROCESSING">قيد المعالجة</SelectItem>
                <SelectItem value="SHIPPED">تم الشحن</SelectItem>
                <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter || 'all-vendors'} onValueChange={(val) => setVendorFilter(val === 'all-vendors' ? '' : val)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="جميع البائعين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-vendors">جميع البائعين</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name || vendor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">المنتجات</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const status = statusConfig[order.order_status] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-medium">#{order.order_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{order.customer_name || 'غير معروف'}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.item_count} منتج</TableCell>
                        <TableCell>{order.vendor_total} ج.م</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  تغيير الحالة
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'PENDING')}>
                                  <Clock className="h-4 w-4 ml-2" />
                                  قيد الانتظار
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'PROCESSING')}>
                                  <Package className="h-4 w-4 ml-2" />
                                  قيد المعالجة
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'SHIPPED')}>
                                  <Truck className="h-4 w-4 ml-2" />
                                  تم الشحن
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'DELIVERED')}>
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  تم التوصيل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'CANCELLED')}>
                                  <XCircle className="h-4 w-4 ml-2 text-destructive" />
                                  إلغاء
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetailsDialog
          orderId={selectedOrder.order_id}
          orderNumber={selectedOrder.order_number}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminOrdersManagement;
