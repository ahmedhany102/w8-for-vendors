

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAds } from "@/hooks/useSupabaseAds";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Edit, Eye, EyeOff, Upload, Link, Monitor, Smartphone, Loader2 } from "lucide-react";

/**
 * Sanitize redirect URL to ensure it's an internal path only
 * Strips any protocol, domain, or localhost prefix
 */
const sanitizeRedirectUrl = (url: string): string => {
  if (!url) return '';

  let cleanUrl = url.trim();

  // Remove any http/https protocol and domain
  cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');

  // Ensure it starts with /
  if (cleanUrl && !cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }

  return cleanUrl;
};

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
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isActive, setIsActive] = useState(true);
  const [uploadMethod, setUploadMethod] = useState<"url" | "file">("url");
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setImageFile(null);
    setRedirectUrl("");
    setPosition(0);
    setOrientation('horizontal');
    setIsActive(true);
    setUploadMethod("url");
  };

  // Handle file selection (no longer converts to Base64)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setImageFile(file);
      // Show preview using object URL (not Base64)
      setImageUrl(URL.createObjectURL(file));
    }
  };

  // Upload file to Supabase Storage and return public URL
  const uploadToStorage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Upload to Supabase Storage bucket 'promos' (neutral name to avoid ad blockers)
      const { data, error } = await supabase.storage
        .from('promos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        toast.error('Failed to upload image: ' + error.message);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('promos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Upload exception:', err);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAd = async () => {
    let finalImageUrl = imageUrl.trim();

    // If using file upload, upload to Storage first
    if (uploadMethod === 'file' && imageFile) {
      const storageUrl = await uploadToStorage(imageFile);
      if (!storageUrl) {
        return; // Upload failed, error already shown
      }
      finalImageUrl = storageUrl;
    }

    if (!finalImageUrl) {
      toast.error("Image is required (either URL or file upload)");
      return;
    }

    // Sanitize redirect URL to ensure internal path only
    const cleanRedirectUrl = sanitizeRedirectUrl(redirectUrl);

    const success = await addAd({
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      image_url: finalImageUrl,
      redirect_url: cleanRedirectUrl || undefined,
      position,
      is_active: isActive,
      orientation
    });

    if (success) {
      setShowAddDialog(false);
      resetForm();
    }
  };

  const handleEditAd = async () => {
    if (!editingAd) {
      toast.error("No ad selected for editing");
      return;
    }

    let finalImageUrl = imageUrl.trim();

    // If using file upload with a new file, upload to Storage first
    if (uploadMethod === 'file' && imageFile) {
      const storageUrl = await uploadToStorage(imageFile);
      if (!storageUrl) {
        return; // Upload failed, error already shown
      }
      finalImageUrl = storageUrl;
    }

    if (!finalImageUrl) {
      toast.error("Image is required");
      return;
    }

    // Sanitize redirect URL to ensure internal path only
    const cleanRedirectUrl = sanitizeRedirectUrl(redirectUrl);

    const success = await updateAd(editingAd.id, {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      image_url: finalImageUrl,
      redirect_url: cleanRedirectUrl || undefined,
      position,
      is_active: isActive,
      orientation
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
    setOrientation(ad.orientation || 'horizontal');
    setIsActive(ad.is_active);
    setUploadMethod("url");
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  // Shared form content for Add and Edit dialogs
  const AdFormContent = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Label>Title (Optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Banner title"
        />
      </div>
      <div>
        <Label>Description (Optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Banner description"
        />
      </div>

      {/* Image Upload */}
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
              onChange={handleFileSelect}
              className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
          </TabsContent>
        </Tabs>

        {imageUrl && (
          <div className="mt-3">
            <p className="text-sm font-medium mb-2">Preview:</p>
            <div className={`relative bg-gray-100 rounded border overflow-hidden ${orientation === 'vertical' ? 'w-32 h-56' : 'w-full h-40'
              }`}>
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

      {/* Redirect URL - INTERNAL PATHS ONLY */}
      <div>
        <Label>Click Redirect URL (Optional)</Label>
        <Input
          value={redirectUrl}
          onChange={(e) => setRedirectUrl(e.target.value)}
          placeholder="/product/123 or /section/best-sellers"
          dir="ltr"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Internal path only (e.g., /product/123, /category/electronics)
        </p>
      </div>

      {/* Position & Orientation in grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Display Position</Label>
          <Input
            type="number"
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
            min="0"
          />
          <p className="text-xs text-muted-foreground mt-1">
            0-9 = Top Carousel<br />
            10+ = Mid-Page
          </p>
        </div>
        <div>
          <Label>Orientation</Label>
          <Select value={orientation} onValueChange={(v) => setOrientation(v as 'horizontal' | 'vertical')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Horizontal (Banner)
                </div>
              </SelectItem>
              <SelectItem value="vertical">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Vertical (Story)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label>Active (show on website)</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            isEdit ? setShowEditDialog(false) : setShowAddDialog(false);
            if (isEdit) setEditingAd(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleEditAd : handleAddAd}>
          {isEdit ? 'Update Banner' : 'Add Banner'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Promotional Banner Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage promotional banners. Multiple banners auto-rotate as a carousel.
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
            <AdFormContent isEdit={false} />
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
                    <div><strong>Position:</strong> {ad.position} ({ad.position < 10 ? 'Top Carousel' : 'Mid-Page'})</div>
                    <div><strong>Orientation:</strong> {(ad as any).orientation === 'vertical' ? 'Vertical' : 'Horizontal'}</div>
                    <div><strong>Status:</strong> <span className={ad.is_active ? "text-green-600" : "text-red-600"}>{ad.is_active ? "Active" : "Inactive"}</span></div>
                    {ad.redirect_url && (
                      <div><strong>Click URL:</strong> <span className="text-blue-600">{ad.redirect_url}</span></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotional Banner</DialogTitle>
          </DialogHeader>
          <AdFormContent isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManagement;
