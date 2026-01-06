import React, { useState } from 'react';
import { Search, Filter, Check, X, Eye, EyeOff, Trash2 } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminProducts, VendorProduct } from '@/hooks/useVendorProducts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'في انتظار الموافقة', variant: 'secondary' },
  approved: { label: 'موافق عليه', variant: 'default' },
  active: { label: 'نشط', variant: 'default' },
  inactive: { label: 'غير نشط', variant: 'outline' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

interface VendorInfo {
  id: string;
  email: string;
  name: string;
}

export const AdminProductsManagement: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const { products, loading, updateProductStatus, deleteProduct, refetch } = useAdminProducts(
    vendorFilter || undefined,
    statusFilter
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [vendors, setVendors] = useState<VendorInfo[]>([]);

  // Fetch vendors for filter
  React.useEffect(() => {
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

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (productId: string, newStatus: string) => {
    await updateProductStatus(productId, newStatus);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return;
    const success = await deleteProduct(deletingProductId);
    if (success) {
      setShowDeleteDialog(false);
      setDeletingProductId(null);
    }
  };

  const getVendorName = (userId?: string) => {
    if (!userId) return 'غير معروف';
    const vendor = vendors.find((v) => v.id === userId);
    return vendor?.name || vendor?.email || 'غير معروف';
  };

  // Stats
  const stats = {
    total: products.length,
    pending: products.filter((p) => p.status === 'pending').length,
    active: products.filter((p) => p.status === 'active' || p.status === 'approved').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
  };

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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">في انتظار الموافقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">منتجات نشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">مرفوضة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>إدارة المنتجات</CardTitle>
          <CardDescription>عرض ومراجعة جميع منتجات البائعين</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="حالة المنتج" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">في انتظار الموافقة</SelectItem>
                <SelectItem value="approved">موافق عليه</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
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

          {/* Products Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الصورة</TableHead>
                  <TableHead className="text-right">اسم المنتج</TableHead>
                  <TableHead className="text-right">البائع</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد منتجات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
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
                        <TableCell>{getVendorName(product.user_id)}</TableCell>
                        <TableCell>{product.price} ج.م</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                تغيير الحالة
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {product.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'approved')}>
                                    <Check className="h-4 w-4 ml-2 text-green-600" />
                                    موافقة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'rejected')}>
                                    <X className="h-4 w-4 ml-2 text-red-600" />
                                    رفض
                                  </DropdownMenuItem>
                                </>
                              )}
                              {product.status === 'approved' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'active')}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  تفعيل
                                </DropdownMenuItem>
                              )}
                              {(product.status === 'active' || product.status === 'approved') && (
                                <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'inactive')}>
                                  <EyeOff className="h-4 w-4 ml-2" />
                                  إلغاء التفعيل
                                </DropdownMenuItem>
                              )}
                              {product.status === 'inactive' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'active')}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  تفعيل
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingProductId(product.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProductId(null)}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProductsManagement;
