import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProductVariants, ProductVariant } from '@/hooks/useProductVariants';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ProductVariantManagerProps {
  productId: string;
  productImages: string[];
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  productId,
  productImages
}) => {
  const { variants, loading, fetchVariants, addVariant, updateVariant, deleteVariant } = useProductVariants(productId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    image_url: '',
    hex_code: '',
    price_adjustment: 0,
    stock: 0,
    is_default: false,
    position: 0
  });

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.image_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    let success = false;
    if (editingVariant) {
      success = await updateVariant(editingVariant.id, formData);
    } else {
      success = await addVariant(formData);
    }

    if (success) {
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingVariant(null);
      setFormData({
        label: '',
        image_url: '',
        hex_code: '',
        price_adjustment: 0,
        stock: 0,
        is_default: false,
        position: 0
      });
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      label: variant.label,
      image_url: variant.image_url,
      hex_code: variant.hex_code || '',
      price_adjustment: variant.price_adjustment,
      stock: variant.stock,
      is_default: variant.is_default,
      position: variant.position
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      await deleteVariant(id);
    }
  };

  const VariantForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="label">Color Name *</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Red, Blue, Black"
          required
        />
      </div>

      <div>
        <Label htmlFor="image_url">Product Image *</Label>
        <select
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-md"
          required
        >
          <option value="">Select an image</option>
          {productImages.map((image, index) => (
            <option key={index} value={image}>
              Image {index + 1}: {image.substring(image.lastIndexOf('/') + 1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="hex_code">Hex Color Code (optional)</Label>
        <Input
          id="hex_code"
          value={formData.hex_code}
          onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
          placeholder="#FF0000"
        />
      </div>

      <div>
        <Label htmlFor="price_adjustment">Price Adjustment</Label>
        <Input
          id="price_adjustment"
          type="number"
          step="0.01"
          value={formData.price_adjustment}
          onChange={(e) => setFormData({ ...formData, price_adjustment: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
      </div>

      <div>
        <Label htmlFor="stock">Stock</Label>
        <Input
          id="stock"
          type="number"
          value={formData.stock}
          onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      <div>
        <Label htmlFor="position">Display Order</Label>
        <Input
          id="position"
          type="number"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
          placeholder="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
        />
        <Label htmlFor="is_default">Set as default variant</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditingVariant(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">
          {editingVariant ? 'Update' : 'Add'} Variant
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Product Color Variants</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Color Variant</DialogTitle>
              </DialogHeader>
              <VariantForm />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading variants...</div>
        ) : variants.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No color variants defined. Add variants to enable color selection for customers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variants.map((variant) => (
              <div key={variant.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{variant.label}</h4>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(variant)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(variant.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Color Variant</DialogTitle>
            </DialogHeader>
            <VariantForm />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};