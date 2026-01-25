import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { ProductFormData } from "@/types/product";
import ProductManagementHeader from "./ProductManagementHeader";
import ProductManagementStats from "./ProductManagementStats";
import ProductManagementTable from "./ProductManagementTable";
import ProductManagementDialogs from "./ProductManagementDialogs";

const ProductManagement = () => {
  const { products, loading, addProduct, updateProduct, deleteProduct, refetch } = useSupabaseProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Debug logging to track product state changes
  useEffect(() => {
    console.log('📊 ProductManagement - Products state updated:', {
      count: products.length,
      loading,
      products: products.map(p => ({ id: p.id, name: p.name }))
    });
  }, [products, loading]);

  const handleAddProduct = async (product: ProductFormData, saveVariants?: (productId: string) => Promise<boolean>) => {
    try {
      console.log('🆕 Starting product addition...', { hasVariantSaver: !!saveVariants });

      const result = await addProduct(product);

      if (result && typeof result === 'object' && result.id) {
        // If product was created successfully and we have variants to save
        if (saveVariants) {
          console.log('🎨 Saving variants for new product:', result.id);
          const variantResult = await saveVariants(result.id);
          if (!variantResult) {
            toast.error('تم إنشاء المنتج ولكن فشل حفظ الألوان');
          } else {
            console.log('✅ Variants saved successfully');
          }
        }

        setShowAddDialog(false);
        toast.success('تم إضافة المنتج بنجاح!');
        // Force a refetch to ensure UI updates
        setTimeout(() => {
          refetch();
        }, 200);
      } else {
        toast.error('فشل في إضافة المنتج');
      }

    } catch (error: any) {
      console.error("❌ Error in handleAddProduct:", error);
      toast.error("فشل في إضافة المنتج: " + (error?.message || 'خطأ غير معروف'));
    }
  };

  const handleEditProduct = async (product: ProductFormData, saveVariants?: (productId: string) => Promise<boolean>) => {
    if (!editProduct?.id) {
      toast.error('لم يتم اختيار منتج للتعديل');
      return;
    }

    try {
      console.log('✏️ Starting product update...', { hasVariantSaver: !!saveVariants });

      const result = await updateProduct(editProduct.id, product);

      if (result) {
        // If product was updated successfully and we have variants to save
        if (saveVariants) {
          console.log('🎨 Saving variants for updated product:', editProduct.id);
          const variantResult = await saveVariants(editProduct.id);
          if (!variantResult) {
            toast.error('تم تحديث المنتج ولكن فشل حفظ الألوان');
          } else {
            console.log('✅ Variants saved successfully');
          }
        }

        setShowEditDialog(false);
        setEditProduct(null);
        toast.success('تم تحديث المنتج بنجاح!');
        // Force a refetch to ensure UI updates
        setTimeout(() => {
          refetch();
        }, 200);
      } else {
        toast.error('فشل في تحديث المنتج');
      }

    } catch (error: any) {
      console.error("❌ Error in handleEditProduct:", error);
      toast.error("فشل في تحديث المنتج: " + (error?.message || 'خطأ غير معروف'));
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) {
      toast.error('لم يتم اختيار منتج للحذف');
      return;
    }

    try {
      console.log('🗑️ Starting product deletion...');

      const result = await deleteProduct(deleteProductId);

      if (result) {
        setShowDeleteDialog(false);
        setDeleteProductId(null);
        toast.success('تم حذف المنتج بنجاح!');
        // Force a refetch to ensure UI updates
        setTimeout(() => {
          refetch();
        }, 200);
      } else {
        toast.error('فشل في حذف المنتج');
      }

    } catch (error: any) {
      console.error("❌ Error in handleDeleteProduct:", error);
      toast.error("فشل في حذف المنتج: " + (error?.message || 'خطأ غير معروف'));
    }
  };

  // Filter products by search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (product.type?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    // Now matches only `category_id` (not text)
    const matchesCategory = categoryFilter === "ALL" || String(product.category_id) === String(categoryFilter);

    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (product: any) => {
    console.log('📝 Edit clicked for product:', product.id);
    setEditProduct(product);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (productId: string) => {
    console.log('🗑️ Delete clicked for product:', productId);
    setDeleteProductId(productId);
    setShowDeleteDialog(true);
  };

  // Show loading message with better UX
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductManagementHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        onAddProduct={() => setShowAddDialog(true)}
        totalProducts={products.length}
      />

      <ProductManagementStats totalProducts={products.length} />

      <ProductManagementTable
        products={filteredProducts}
        loading={false} // We handle loading at the component level
        onEditProduct={handleEditClick}
        onDeleteProduct={handleDeleteClick}
      />

      <ProductManagementDialogs
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        editProduct={editProduct}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
      />
    </div>
  );
};

export default ProductManagement;
