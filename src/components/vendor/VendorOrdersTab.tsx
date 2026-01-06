import React, { useState } from 'react';
import { Eye, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useVendorOrders, useVendorOrderDetails, VendorOrder, VendorOrderInfo } from '@/hooks/useVendorOrders';
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

interface VendorOrdersTabProps {
  isApproved: boolean;
}

const OrderDetailsDialog: React.FC<{
  orderId: string;
  orderNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ orderId, orderNumber, open, onOpenChange }) => {
  const { items, orderInfo, loading, updateItemStatus } = useVendorOrderDetails(orderId);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    await updateItemStatus(itemId, newStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل الطلب #{orderNumber}</DialogTitle>
          <DialogDescription>
            المنتجات الخاصة بك في هذا الطلب
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Info Section */}
            {orderInfo && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">معلومات العميل</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">الاسم: </span>
                    <span>{orderInfo.customer_info?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">الهاتف: </span>
                    <span>{orderInfo.customer_info?.phone || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">العنوان: </span>
                    <span>
                      {orderInfo.customer_info?.address?.street && `${orderInfo.customer_info.address.street}, `}
                      {orderInfo.customer_info?.address?.city && `${orderInfo.customer_info.address.city} `}
                      {orderInfo.customer_info?.address?.zipCode && `- ${orderInfo.customer_info.address.zipCode}`}
                      {!orderInfo.customer_info?.address?.street && !orderInfo.customer_info?.address?.city && '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">طريقة الدفع: </span>
                    <span>{orderInfo.payment_info?.method === 'CASH' ? 'الدفع عند الاستلام' : orderInfo.payment_info?.method || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">حالة الدفع: </span>
                    <Badge variant={orderInfo.payment_status === 'PAID' ? 'default' : 'secondary'}>
                      {orderInfo.payment_status === 'PAID' ? 'مدفوع' : 'غير مدفوع'}
                    </Badge>
                  </div>
                  {orderInfo.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">ملاحظات: </span>
                      <span>{orderInfo.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Items Section */}
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد منتجات
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-sm">المنتجات</h4>
                {items.map((item) => {
                  const status = statusConfig[item.item_status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <div key={item.item_id} className="flex gap-4 p-4 border rounded-lg">
                      <img
                        src={item.product_image || '/placeholder.svg'}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name}</h4>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <p>الكمية: {item.quantity}</p>
                          <p>السعر: {item.unit_price} ج.م</p>
                          {item.size && <p>المقاس: {item.size}</p>}
                          {item.color && <p>اللون: {item.color}</p>}
                          <p className="font-medium text-foreground">الإجمالي: {item.total_price} ج.م</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant={status.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Select
                          value={item.item_status}
                          onValueChange={(val) => handleStatusChange(item.item_id, val)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="تغيير الحالة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                            <SelectItem value="processing">قيد المعالجة</SelectItem>
                            <SelectItem value="shipped">تم الشحن</SelectItem>
                            <SelectItem value="delivered">تم التوصيل</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const VendorOrdersTab: React.FC<VendorOrdersTabProps> = ({ isApproved }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { orders, loading } = useVendorOrders(statusFilter);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);

  if (!isApproved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>طلباتي</CardTitle>
          <CardDescription>الطلبات التي تحتوي على منتجاتك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">يجب أن يكون متجرك معتمداً لتلقي الطلبات</p>
            <p className="text-sm mt-2">انتقل لإعدادات المتجر لمتابعة حالة طلبك</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>طلباتي</CardTitle>
              <CardDescription>الطلبات التي تحتوي على منتجاتك ({orders.length} طلب)</CardDescription>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات حتى الآن</p>
              <p className="text-sm">ستظهر الطلبات هنا عندما يشتري العملاء منتجاتك</p>
            </div>
          ) : (
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
                  {orders.map((order) => {
                    const status = statusConfig[order.order_status] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-medium">#{order.order_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell>{order.customer_name || 'غير معروف'}</TableCell>
                        <TableCell>{order.item_count} منتج</TableCell>
                        <TableCell>{order.vendor_total} ج.م</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
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
    </>
  );
};
