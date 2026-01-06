import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendorProducts, VendorProduct } from '@/hooks/useVendorProducts';
import { VendorProductList } from './VendorProductList';
import { VendorProductForm } from './VendorProductForm';
import { ProductFormData } from '@/types/product';

interface VendorProductsTabProps {
  isApproved: boolean;
}

export const VendorProductsTab: React.FC<VendorProductsTabProps> = ({ isApproved }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { products, loading, addProduct, updateProduct, deleteProduct } = useVendorProducts(statusFilter);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = async (data: ProductFormData) => {
    setFormLoading(true);
    try {
      const result = await addProduct(data);
      if (result) {
        setShowAddDialog(false);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;
    setFormLoading(true);
    try {
      const success = await updateProduct(editingProduct.id, data);
      if (success) {
        setShowEditDialog(false);
        setEditingProduct(null);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProductId) return;
    const success = await deleteProduct(deletingProductId);
    if (success) {
      setShowDeleteDialog(false);
      setDeletingProductId(null);
    }
  };

  const openEditDialog = (product: VendorProduct) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (productId: string) => {
    setDeletingProductId(productId);
    setShowDeleteDialog(true);
  };

  if (!isApproved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>منتجاتي</CardTitle>
          <CardDescription>إدارة منتجات متجرك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <div className="h-12 w-12 mx-auto mb-4 opacity-50 bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <p className="font-medium">يجب أن يكون متجرك معتمداً لإضافة منتجات</p>
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
              <CardTitle>منتجاتي</CardTitle>
              <CardDescription>إدارة منتجات متجرك ({products.length} منتج)</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة منتج
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
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
          </div>

          <VendorProductList
            products={filteredProducts}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
            <DialogDescription>
              أضف منتج جديد إلى متجرك. سيتم مراجعته من قبل الإدارة قبل النشر.
            </DialogDescription>
          </DialogHeader>
          <VendorProductForm
            onSubmit={handleAddProduct}
            onCancel={() => setShowAddDialog(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
            <DialogDescription>قم بتعديل بيانات المنتج</DialogDescription>
          </DialogHeader>
          <VendorProductForm
            initialData={editingProduct}
            onSubmit={handleEditProduct}
            onCancel={() => {
              setShowEditDialog(false);
              setEditingProduct(null);
            }}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج نهائياً من متجرك.
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
    </>
  );
};
