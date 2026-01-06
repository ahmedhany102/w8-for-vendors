
import React from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash } from "lucide-react";
import { CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  type?: string;
  colors?: string[];
  sizes?: Array<{ size: string; stock: number }>;
  price: number;
  stock?: number;
  main_image?: string;
}

interface ProductManagementTableProps {
  products: Product[];
  loading: boolean;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const ProductManagementTable = ({
  products,
  loading,
  onEditProduct,
  onDeleteProduct
}: ProductManagementTableProps) => {
  if (loading) {
    return (
      <CardContent className="p-0">
        <div className="flex justify-center items-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
        </div>
      </CardContent>
    );
  }

  if (products.length === 0) {
    return (
      <CardContent className="p-0">
        <div className="text-center py-10">
          <p className="text-gray-500">No products found</p>
          <p className="text-sm text-gray-400 mt-2">Click "Add New Product" to get started</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-green-50">
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="hidden lg:table-cell">Colors</TableHead>
              <TableHead className="hidden lg:table-cell">Sizes</TableHead>
              <TableHead className="hidden md:table-cell">Stock</TableHead>
              <TableHead className="hidden md:table-cell">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id} className="hover:bg-green-50 transition-colors">
                <TableCell>
                  {product.main_image ? (
                    <img 
                      src={product.main_image} 
                      alt={product.name} 
                      width={40}
                      height={40}
                      decoding="async"
                      loading="lazy"
                      className="h-10 w-10 object-cover rounded-md" 
                    />
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium truncate" title={product.name}>
                  <div className="max-w-[120px] truncate">{product.name}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{product.type || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? 
                    <div className="max-w-[100px] truncate">{product.colors.join(", ")}</div> : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? 
                    <div className="max-w-[120px] truncate">{product.sizes.map(s => s.size).join(", ")}</div> : "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {product.sizes && Array.isArray(product.sizes) ? 
                    product.sizes.reduce((total, size) => total + (size?.stock || 0), 0) : 
                    product.stock || 0}
                </TableCell>
                <TableCell className="hidden md:table-cell">${product.price}</TableCell>
                <TableCell className="text-right space-x-1">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      onClick={() => onEditProduct(product)}
                      className="bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 p-1 h-auto"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDeleteProduct(product.id)}
                      className="bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600 p-1 h-auto"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  );
};

export default ProductManagementTable;
