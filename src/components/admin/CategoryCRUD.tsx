import React, { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";
import { z } from "zod";
import DOMPurify from "dompurify";

// Zod validation schema for categories
const categorySchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .transform(val => DOMPurify.sanitize(val.trim())),
  slug: z.string()
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .optional()
    .transform(val => val ? val.trim() : val)
});

const CategoryCRUD = () => {
  const { categories, refetch, loading } = useCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editCat, setEditCat] = useState<any>(null);

  const resetForm = () => {
    setName("");
    setSlug("");
    setEditCat(null);
    setModalOpen(false);
    setEditModal(false);
  };

  const generateSlug = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleAdd = async () => {
    // Validate with Zod schema
    const parseResult = categorySchema.safeParse({ 
      name, 
      slug: slug || undefined 
    });
    
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    
    const validated = parseResult.data;
    const slugVal = validated.slug || generateSlug(validated.name);
    
    const { error } = await supabase.from("categories").insert([
      { name: validated.name, slug: slugVal }
    ]);
    if (error) toast.error(error.message);
    else {
      toast.success("Category added");
      refetch();
      resetForm();
    }
  };

  const handleEdit = async () => {
    if (!editCat?.id) return;
    
    // Validate with Zod schema
    const parseResult = categorySchema.safeParse({ 
      name, 
      slug: slug || undefined 
    });
    
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }
    
    const validated = parseResult.data;
    const slugVal = validated.slug || generateSlug(validated.name);
    
    const { error } = await supabase.from("categories")
      .update({ name: validated.name, slug: slugVal })
      .eq("id", editCat.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Category updated");
      refetch();
      resetForm();
    }
  };

  const handleDelete = async (cat: any) => {
    if (!window.confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories")
      .delete().eq("id", cat.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Category deleted");
      refetch();
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Categories</h2>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button>Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
              <Input placeholder="Slug (optional)" value={slug} onChange={e => setSlug(e.target.value)} />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleAdd}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div>
        {categories.length === 0 && (
          <Card><CardContent className="py-8 text-center">No categories</CardContent></Card>
        )}
        {categories.map(cat => (
          <Card className="mb-2" key={cat.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>
                {cat.name}
                <span className="ml-2 text-xs text-gray-400">/ {cat.slug}</span>
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditCat(cat); setEditModal(true); setName(cat.name); setSlug(cat.slug); }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(cat)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <Input placeholder="Slug (optional)" value={slug} onChange={e => setSlug(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleEdit}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryCRUD;
