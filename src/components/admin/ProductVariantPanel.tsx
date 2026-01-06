import React, { useEffect, useState } from "react";
import { useProductVariants, ProductVariant } from "@/hooks/useProductVariants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  productId: string;
  productImages: string[];
}

const ProductVariantPanel: React.FC<Props> = ({ productId, productImages }) => {
  const { variants, fetchVariants, addVariant, updateVariant, deleteVariant, loading } = useProductVariants(productId);

  // For adding a new variant
  const [form, setForm] = useState<{ 
    label: string; 
    image_url: string; 
    hex_code: string;
    price_adjustment: number;
    stock: number;
    is_default: boolean;
    position: number;
  }>({
    label: "",
    image_url: "",
    hex_code: "",
    price_adjustment: 0,
    stock: 0,
    is_default: false,
    position: 0,
  });

  useEffect(() => { 
    fetchVariants(); 
  }, [productId]);

  const handleAddVariant = async () => {
    if (!form.label || !form.image_url) return;
    const success = await addVariant(form);
    if (success) {
      setForm({ 
        label: "", 
        image_url: "", 
        hex_code: "",
        price_adjustment: 0,
        stock: 0,
        is_default: false,
        position: 0,
      });
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      await deleteVariant(id);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold mb-2">Product Color Variants</h3>
      
      {/* Add new variant form */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Input 
          placeholder="Color name" 
          value={form.label} 
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))} 
        />
        <select
          value={form.image_url}
          onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
          className="px-3 py-2 border border-border rounded-md"
        >
          <option value="">Select image</option>
          {productImages.map((img, idx) => (
            <option key={idx} value={img}>
              Image {idx + 1}
            </option>
          ))}
        </select>
        <Input 
          type="number" 
          placeholder="Price adjustment" 
          value={form.price_adjustment} 
          onChange={e => setForm(f => ({ ...f, price_adjustment: Number(e.target.value) }))} 
        />
        <Input 
          type="number" 
          placeholder="Stock" 
          value={form.stock} 
          onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} 
        />
        <Input 
          placeholder="Hex color" 
          value={form.hex_code} 
          onChange={e => setForm(f => ({ ...f, hex_code: e.target.value }))} 
        />
        <Input 
          type="number" 
          placeholder="Position" 
          value={form.position} 
          onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} 
        />
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={form.is_default}
            onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
          />
          <span className="text-sm">Default</span>
        </label>
        <Button type="button" onClick={handleAddVariant}>Add Variant</Button>
      </div>

      {/* Existing variants */}
      <div>
        {loading ? "Loading..." : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map(variant => (
              <div key={variant.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{variant.label}</h4>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleDeleteVariant(variant.id)}
                  >
                    Delete
                  </Button>
                </div>
                
                <img 
                  src={variant.image_url} 
                  alt={variant.label}
                  className="w-full h-24 object-cover rounded mb-2" 
                />
                
                <div className="text-sm space-y-1">
                  <p>Stock: {variant.stock}</p>
                  <p>Price Adj: {variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment}</p>
                  <p>Position: {variant.position}</p>
                  {variant.is_default && <p className="text-primary font-medium">Default</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductVariantPanel;
