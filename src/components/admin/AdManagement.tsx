
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseAds } from "@/hooks/useSupabaseAds";
import { toast } from "sonner";
import { Trash2, Plus, Edit, Eye, EyeOff, Upload, Link } from "lucide-react";

const AdManagement = () => {
  const { ads, loading, deleteAd, addAd, updateAd, refetch } = useSupabaseAds();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [position, setPosition] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setRedirectUrl("");
    setPosition(0);
    setIsActive(true);
    setUploadMethod("url");
  };

  // Handle file upload and convert to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setImageFile(file);
      
      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAd = async () => {
    if (!imageUrl.trim()) {
      toast.error("Image is required (either URL or file upload)");
      return;
    }

    const success = await addAd({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      image_url: imageUrl.trim(),
      redirect_url: redirectUrl.trim() || undefined,
      position,
      is_active: isActive
    });

    if (success) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleEditAd = async () => {
    if (!editingAd || !imageUrl.trim()) {
      toast.error("Image is required");
      return;
    }

    const success = await updateAd(editingAd.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      image_url: imageUrl.trim(),
      redirect_url: redirectUrl.trim() || undefined,
      position,
      is_active: isActive
    });

    if (success) {
      setShowEditDialog(false);
      setEditingAd(null);
      resetForm();
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this promotional banner?")) {
      const success = await deleteAd(id);
      if (success) {
        console.log('✅ Promotional banner deleted from admin panel');
      }
    }
  };

  const openEditDialog = (ad: any) => {
    setEditingAd(ad);
    setTitle(ad.title || "");
    setDescription(ad.description || "");
    setImageUrl(ad.image_url || "");
    setRedirectUrl(ad.redirect_url || "");
    setPosition(ad.position || 0);
    setIsActive(ad.is_active);
    setUploadMethod("url"); // Default to URL for editing
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promotional Banner Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage promotional banners that appear on your homepage. Multiple banners will auto-rotate.
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Promotional Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Banner title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Banner description"
                />
              </div>
              
              {/* Image Upload Tabs */}
              <div>
                <Label>Banner Image *</Label>
                <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "url" | "file")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Image URL
                    </TabsTrigger>
                    <TabsTrigger value="file" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="mt-3">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="file" className="mt-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                  </TabsContent>
                </Tabs>
                
                {/* Image Preview */}
                {imageUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <div className="relative w-full h-40 bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                        onError={() => toast.error("Invalid image URL or file")}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="position">Display Position</Label>
                <Input
                  id="position"
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0 = first in carousel"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Position Guide:</strong><br />
                  0-9 = Hero Carousel (top of page)<br />
                  10-19 = Mid-Page Left Ad<br />
                  20-29 = Mid-Page Right Ad
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive">Active (show on website)</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAd}>Add Banner</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {ads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <div className="space-y-2">
                <p className="text-lg">No promotional banners found.</p>
                <p className="text-sm">Click "Add New Banner" to create your first promotional banner.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          ads.map((ad) => (
            <Card key={ad.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ad.title || `Banner #${ad.position + 1}`}
                      {ad.is_active ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </CardTitle>
                    {ad.description && (
                      <p className="text-sm text-gray-600 mt-1">{ad.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(ad)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAd(ad.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={ad.image_url}
                      alt={ad.title || "Promotional Banner"}
                      className="w-32 h-20 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1 text-sm">
                    <div><strong>Position:</strong> {ad.position}</div>
                    <div><strong>Status:</strong> <span className={ad.is_active ? "text-green-600" : "text-red-600"}>{ad.is_active ? "Active" : "Inactive"}</span></div>
                    {ad.redirect_url && (
                      <div><strong>Click URL:</strong> <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ad.redirect_url}</a></div>
                    )}
                    <div><strong>Created:</strong> {new Date(ad.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog - Similar structure but for editing */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotional Banner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title (Optional)</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Banner title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Banner description"
              />
            </div>
            <div>
              <Label htmlFor="edit-imageUrl">Image URL *</Label>
              <Input
                id="edit-imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                required
              />
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded border"
                    onError={() => toast.error("Invalid image URL")}
                  />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-redirectUrl">Click Redirect URL (Optional)</Label>
              <Input
                id="edit-redirectUrl"
                value={redirectUrl}
                onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-position">Display Position</Label>
              <Input
                id="edit-position"
                type="number"
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setEditingAd(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditAd}>Update Banner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManagement;
