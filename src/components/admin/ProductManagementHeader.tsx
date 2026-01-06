
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductManagementHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  onAddProduct: () => void;
  totalProducts: number;
}

const ProductManagementHeader = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  onAddProduct,
  totalProducts
}: ProductManagementHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Search for a product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-64"
          />
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-48"
          >
            <option value="ALL">All Categories</option>
            <option value="T-Shirts">T-Shirts</option>
            <option value="Trousers">Trousers</option>
            <option value="Shoes">Shoes</option>
            <option value="Jackets">Jackets</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onAddProduct} className="bg-green-800 hover:bg-green-900 text-sm">
            <Plus className="h-4 w-4 mr-2" /> Add New Product
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductManagementHeader;
