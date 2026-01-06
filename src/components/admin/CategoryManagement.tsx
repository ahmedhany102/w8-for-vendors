
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { Trash2, Plus, Edit, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ImageUploader from "@/components/admin/ImageUploader";

// SHORTEN: File now refactored for no black screens and always up-to-date categories
const CategoryManagement = () => {
  const { categories, mainCategories, subcategories, loading, refetch } = useCategories();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>("");

  const resetForm = () => {
    setName("");
    setSlug("");
    setParentId("none");
    setIsActive(true);
    setSortOrder(0);
    setImageUrl("");
  };

  // Generate slug when name changes
  const generateSlug = (name: string) =>
    name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  // Add category
  const handleAddCategory = async () => {
    if (!name.trim()) return toast.error("Category name is required");

    const categorySlug = slug || generateSlug(name);
    const { error } = await supabase
      .from('categories')
      .insert([{
        name: name.trim(),
        slug: categorySlug,
        parent_id: parentId === "none" ? null : parentId || null,
        is_active: isActive,
        sort_order: sortOrder,
        description: "",
        image_url: imageUrl || null,
        scope: 'global'
      }]);
    if (error) {
      toast.error('Failed to add category: ' + error.message);
      return;
    }
    toast.success('Category added successfully!');
    setShowAddDialog(false);
    resetForm();
    refetch();
  };

  // Edit category
  const handleEditCategory = async () => {
    if (!editingCategory || !name.trim()) return toast.error("Category name is required");

    const categorySlug = slug || generateSlug(name);

    const { error } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        slug: categorySlug,
        parent_id: parentId === "none" ? null : parentId || null,
        is_active: isActive,
        sort_order: sortOrder,
        image_url: imageUrl || null
      })
      .eq('id', editingCategory.id);

    if (error) {
      toast.error('Failed to update category: ' + error.message);
      return;
    }
    toast.success('Category updated successfully!');
    setShowEditDialog(false);
    setEditingCategory(null);
    resetForm();
    refetch();
  };

  // Delete category
  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete category: ' + error.message);
      return;
    }
    toast.success('Category deleted successfully!');
    refetch();
  };

  // Open edit dialog
  const openEditDialog = (category: any) => {
    setEditingCategory(category);
    setName(category.name || "");
    setSlug(category.slug || "");
    setParentId(category.parent_id || "none");
    setIsActive(category.is_active);
    setSortOrder(category.sort_order || 0);
    setImageUrl(category.image_url || "");
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Add New Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => { setName(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }}
                  required
                  placeholder="e.g. T-Shirts, Shoes, Electronics"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder="e.g. t-shirts, shoes"
                />
              </div>
              <div>
                <Label htmlFor="parentId">Parent Category (Optional)</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Select parent category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {mainCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} min="0" />
              </div>
              <div>
                <Label>Category Image</Label>
                <ImageUploader
                  value={imageUrl ? [imageUrl] : []}
                  onChange={(urls) => setImageUrl(urls[0] || "")}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleAddCategory}>Add Category</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-gray-500">No categories found. Click "Add New Category".</CardContent></Card>
        ) : (
          categories.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {category.parent_id && "↳ "}
                      {category.name}
                      {category.is_active ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      <p><strong>Slug:</strong> {category.slug}</p>
                      {category.parent_id && <p><strong>Parent:</strong> {categories.find(c => c.id === category.parent_id)?.name || "Unknown"}</p>}
                      <p><strong>Subcategories:</strong> {subcategories(category.id).length}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id, category.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <div><strong>Sort Order:</strong> {category.sort_order}</div>
                  <div><strong>Status:</strong> {category.is_active ? "Active" : "Inactive"}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Category name"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug (URL-friendly)</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div>
              <Label htmlFor="edit-parentId">Parent Category (Optional)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="Select parent category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {mainCategories.filter(c => c.id !== editingCategory?.id).map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sortOrder">Sort Order</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <Label>Category Image</Label>
              <ImageUploader
                value={imageUrl ? [imageUrl] : []}
                onChange={(urls) => setImageUrl(urls[0] || "")}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="edit-isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditingCategory(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleEditCategory}>Update Category</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default CategoryManagement;
