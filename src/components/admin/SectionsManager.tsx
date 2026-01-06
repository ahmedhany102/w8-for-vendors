import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Package, Star, Flame, Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink, Image, Grid, Clock, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Section {
  id: string;
  title: string;
  type: string;
  scope: string;
  sort_order: number;
  is_active: boolean;
  slug?: string;
  config: Record<string, any> | null;
}

interface SectionProduct {
  id: string;
  product_id: string;
  section_id: string;
  sort_order: number;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
    price: number;
  };
}

const SECTION_TYPES = [
  { value: 'hero_carousel', label: 'Hero Banner / Ads Carousel', icon: Image, description: 'Top banner ads carousel' },
  { value: 'category_grid', label: 'Categories Grid', icon: Grid, description: 'Category navigation grid' },
  { value: 'best_seller', label: 'Best Sellers', icon: Star, description: 'Auto-populated best selling products' },
  { value: 'hot_deals', label: 'Hot Deals', icon: Flame, description: 'Auto-populated discounted products' },
  { value: 'last_viewed', label: 'Last Viewed', icon: Clock, description: 'Auto-populated recently viewed products' },
  { value: 'mid_page_ads', label: 'Mid-Page Ads', icon: Megaphone, description: 'Advertisement banners in middle' },
  { value: 'manual', label: 'Custom Curated', icon: Package, description: 'Manually add products to this section' },
];

// Predefined color options for section styling
const SECTION_COLORS = [
  { value: 'none', label: 'Default (No color)' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#000000', label: 'Black' },
];

const SectionsManager: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionProducts, setSectionProducts] = useState<SectionProduct[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('manual');
  const [isActive, setIsActive] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('none');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('scope', 'global')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSections((data || []).map(s => ({
        ...s,
        config: (s.config as Record<string, any>) || {}
      })));
    } catch (error: any) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionProducts = async (sectionId: string) => {
    try {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('section_products')
        .select(`
          id,
          product_id,
          section_id,
          sort_order,
          products (
            id,
            name,
            image_url,
            price
          )
        `)
        .eq('section_id', sectionId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSectionProducts(data?.map(sp => ({
        ...sp,
        product: sp.products
      })) || []);
    } catch (error: any) {
      console.error('Error fetching section products:', error);
      toast.error('Failed to load section products');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, price')
        .in('status', ['active', 'approved'])
        .order('name', { ascending: true });

      if (error) throw error;
      setAllProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('manual');
    setIsActive(true);
    setBackgroundColor('none');
  };

  const handleAddSection = async () => {
    if (!title.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    try {
      const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0;

      // Generate slug using database function
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_section_slug', { p_title: title.trim() });

      if (slugError) {
        console.error('Error generating slug:', slugError);
        // Fallback slug generation
      }

      const slug = slugData || title.trim().toLowerCase()
        .replace(/[أإآا]/g, 'a')
        .replace(/[ب]/g, 'b')
        .replace(/[ت]/g, 't')
        .replace(/[ث]/g, 'th')
        .replace(/[ج]/g, 'j')
        .replace(/[ح]/g, 'h')
        .replace(/[خ]/g, 'kh')
        .replace(/[د]/g, 'd')
        .replace(/[ذ]/g, 'dh')
        .replace(/[ر]/g, 'r')
        .replace(/[ز]/g, 'z')
        .replace(/[س]/g, 's')
        .replace(/[ش]/g, 'sh')
        .replace(/[ص]/g, 's')
        .replace(/[ض]/g, 'd')
        .replace(/[ط]/g, 't')
        .replace(/[ظ]/g, 'z')
        .replace(/[ع]/g, 'a')
        .replace(/[غ]/g, 'gh')
        .replace(/[ف]/g, 'f')
        .replace(/[ق]/g, 'q')
        .replace(/[ك]/g, 'k')
        .replace(/[ل]/g, 'l')
        .replace(/[م]/g, 'm')
        .replace(/[ن]/g, 'n')
        .replace(/[ه]/g, 'h')
        .replace(/[و]/g, 'w')
        .replace(/[ي]/g, 'y')
        .replace(/[ى]/g, 'a')
        .replace(/[ة]/g, 'h')
        .replace(/[\u0600-\u06FF]/g, '') // Remove any remaining Arabic
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .substring(0, 50) || `section-${Date.now()}`;

      const { error } = await supabase
        .from('sections')
        .insert({
          title: title.trim(),
          type,
          scope: 'global',
          sort_order: maxOrder,
          is_active: isActive,
          slug,
          config: backgroundColor && backgroundColor !== 'none' ? { background_color: backgroundColor } : {}
        });

      if (error) throw error;

      toast.success('Section created successfully');
      setShowAddDialog(false);
      resetForm();
      fetchSections();
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section');
    }
  };

  const handleEditSection = async () => {
    if (!editingSection || !title.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    try {
      const existingConfig = editingSection.config || {};
      const newConfig = {
        ...existingConfig,
        background_color: backgroundColor && backgroundColor !== 'none' ? backgroundColor : undefined
      };

      const { error } = await supabase
        .from('sections')
        .update({
          title: title.trim(),
          type,
          is_active: isActive,
          config: newConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      toast.success('Section updated successfully');
      setShowEditDialog(false);
      setEditingSection(null);
      resetForm();
      fetchSections();
    } catch (error: any) {
      console.error('Error updating section:', error);
      toast.error('Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
      // First delete section products
      await supabase
        .from('section_products')
        .delete()
        .eq('section_id', sectionId);

      // Then delete section
      const { error } = await supabase
        .from('sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      toast.success('Section deleted successfully');
      fetchSections();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    try {
      const currentSection = sections[currentIndex];
      const targetSection = sections[targetIndex];

      // Swap sort_order values
      await Promise.all([
        supabase.from('sections').update({ sort_order: targetSection.sort_order }).eq('id', currentSection.id),
        supabase.from('sections').update({ sort_order: currentSection.sort_order }).eq('id', targetSection.id)
      ]);

      toast.success('Section order updated');
      fetchSections();
    } catch (error: any) {
      console.error('Error moving section:', error);
      toast.error('Failed to move section');
    }
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    setTitle(section.title);
    setType(section.type);
    setIsActive(section.is_active);
    setBackgroundColor(section.config?.background_color || 'none');
    setShowEditDialog(true);
  };

  const openProductsDialog = async (section: Section) => {
    setEditingSection(section);
    await fetchSectionProducts(section.id);
    await fetchAllProducts();
    setShowProductsDialog(true);
  };

  const handleAddProductToSection = async (productId: string) => {
    if (!editingSection) return;

    // Check if product already exists in section
    if (sectionProducts.some(sp => sp.product_id === productId)) {
      toast.error('Product already in section');
      return;
    }

    try {
      const maxOrder = sectionProducts.length > 0
        ? Math.max(...sectionProducts.map(sp => sp.sort_order)) + 1
        : 0;

      const { error } = await supabase
        .from('section_products')
        .insert({
          section_id: editingSection.id,
          product_id: productId,
          sort_order: maxOrder
        });

      if (error) throw error;

      toast.success('Product added to section');
      fetchSectionProducts(editingSection.id);
    } catch (error: any) {
      console.error('Error adding product to section:', error);
      toast.error('Failed to add product');
    }
  };

  const handleRemoveProductFromSection = async (sectionProductId: string) => {
    try {
      const { error } = await supabase
        .from('section_products')
        .delete()
        .eq('id', sectionProductId);

      if (error) throw error;

      toast.success('Product removed from section');
      if (editingSection) {
        fetchSectionProducts(editingSection.id);
      }
    } catch (error: any) {
      console.error('Error removing product from section:', error);
      toast.error('Failed to remove product');
    }
  };

  const getTypeConfig = (sectionType: string) => {
    return SECTION_TYPES.find(t => t.value === sectionType);
  };

  const getTypeIcon = (sectionType: string) => {
    const typeConfig = getTypeConfig(sectionType);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Package className="w-4 h-4" />;
  };

  const isAutoSection = (sectionType: string) => {
    return ['hero_carousel', 'category_grid', 'best_seller', 'hot_deals', 'last_viewed', 'mid_page_ads'].includes(sectionType);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sections Manager</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage homepage sections. Some sections auto-populate, others need manual product assignment.
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Section Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Featured Products"
                />
              </div>
              <div>
                <Label>Section Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTypeConfig(type)?.description}
                </p>
              </div>
              <div>
                <Label>Section Title Background Color</Label>
                <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_COLORS.map((color) => (
                      <SelectItem key={color.value || 'default'} value={color.value}>
                        <span className="flex items-center gap-2">
                          {color.value && (
                            <span
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.value }}
                            />
                          )}
                          {color.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active (visible on homepage)</Label>
              </div>
              <Button onClick={handleAddSection} className="w-full">
                Create Section
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info about default sections */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Hero Banner, Categories Grid, Mid-Page Ads, and Last Viewed sections
            are shown automatically if not explicitly added here. Add them as sections only if you
            want to control their position or settings.
          </p>
        </CardContent>
      </Card>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Sections Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Default sections (Hero, Categories, Best Sellers, Hot Deals, Last Viewed) will be shown automatically.
              <br />Create custom sections to add curated product collections.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={section.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => handleMoveSection(section.id, 'up')}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === sections.length - 1}
                      onClick={() => handleMoveSection(section.id, 'down')}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Section icon with optional color */}
                  <div
                    className="flex items-center justify-center gap-2 p-2 rounded"
                    style={{
                      backgroundColor: section.config?.background_color || 'transparent',
                      color: section.config?.background_color ? '#fff' : 'inherit'
                    }}
                  >
                    {getTypeIcon(section.type)}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {section.title}
                      {section.config?.background_color && (
                        <span
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: section.config.background_color }}
                          title="Section color"
                        />
                      )}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{section.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className={`flex items-center gap-1 ${section.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {section.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {section.is_active ? 'Active' : 'Hidden'}
                      </span>
                      {isAutoSection(section.type) && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 text-xs">Auto-populated</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {section.type === 'manual' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => openProductsDialog(section)}>
                          <Package className="w-4 h-4 mr-1" />
                          Products
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`/section/${section.slug || section.id}`, '_blank')}
                          title="Preview Section Page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(section)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteSection(section.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Section Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Featured Products"
              />
            </div>
            <div>
              <Label>Section Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="w-4 h-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {getTypeConfig(type)?.description}
              </p>
            </div>
            <div>
              <Label>Section Title Background Color</Label>
              <Select value={backgroundColor} onValueChange={setBackgroundColor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_COLORS.map((color) => (
                    <SelectItem key={color.value || 'default'} value={color.value}>
                      <span className="flex items-center gap-2">
                        {color.value && (
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color.value }}
                          />
                        )}
                        {color.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active (visible on homepage)</Label>
            </div>
            <Button onClick={handleEditSection} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Products - {editingSection?.title}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            {/* Current products in section */}
            <div>
              <h4 className="font-medium mb-2">Products in Section ({sectionProducts.length})</h4>
              {productsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : sectionProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No products added yet. Add products from below.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {sectionProducts.map((sp) => (
                    <div key={sp.id} className="flex items-center gap-3 p-2 border rounded-lg">
                      <img
                        src={sp.product?.image_url || '/placeholder.svg'}
                        alt={sp.product?.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sp.product?.name}</p>
                        <p className="text-sm text-muted-foreground">${sp.product?.price}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemoveProductFromSection(sp.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All products to add */}
            <div>
              <h4 className="font-medium mb-2">Add Products</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {allProducts
                  .filter(p => !sectionProducts.some(sp => sp.product_id === p.id))
                  .map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleAddProductToSection(product.id)}
                    >
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">${product.price}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionsManager;