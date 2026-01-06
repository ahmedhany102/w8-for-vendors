import React from 'react';
import { Package, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VendorProduct } from '@/hooks/useVendorProducts';

interface VendorProductListProps {
  products: VendorProduct[];
  loading: boolean;
  onEdit: (product: VendorProduct) => void;
  onDelete: (productId: string) => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'في انتظار الموافقة', variant: 'secondary' },
  approved: { label: 'موافق عليه', variant: 'default' },
  active: { label: 'نشط', variant: 'default' },
  inactive: { label: 'غير نشط', variant: 'outline' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

export const VendorProductList: React.FC<VendorProductListProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>لا توجد منتجات حتى الآن</p>
        <p className="text-sm">ابدأ بإضافة منتجك الأول</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الصورة</TableHead>
            <TableHead className="text-right">اسم المنتج</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">المخزون</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const status = statusConfig[product.status || 'active'] || statusConfig.active;
            const imageUrl = product.main_image || product.image_url || (product.images?.[0]) || '/placeholder.svg';
            
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.price} ج.م</TableCell>
                <TableCell>{product.stock || product.inventory || 0}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
