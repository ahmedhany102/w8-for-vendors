
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseContactSettings } from '@/hooks/useSupabaseContactSettings';

const AdminContactSettings = () => {
  const { settings, loading, updateSettings } = useSupabaseContactSettings();
  const [formData, setFormData] = useState({
    store_name: '',
    address: '',
    email: '',
    phone: '',
    working_hours: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    map_url: '',
    terms_and_conditions: '',
    developer_name: 'Ahmed Hany',
    developer_url: 'https://https://ahmed-hany-folio-glow.lovable.app/'
  });
  const [activeTab, setActiveTab] = useState('contact');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      console.log('Loading settings into form:', settings);
      setFormData({
        store_name: settings.store_name || '',
        address: settings.address || '',
        email: settings.email || '',
        phone: settings.phone || '',
        working_hours: settings.working_hours || '',
        website: settings.website || '',
        facebook: settings.facebook || '',
        instagram: settings.instagram || '',
        twitter: settings.twitter || '',
        youtube: settings.youtube || '',
        map_url: settings.map_url || '',
        terms_and_conditions: settings.terms_and_conditions || '',
        developer_name: 'Ahmed Hany',
        developer_url: 'https://https://ahmed-hany-folio-glow.lovable.app/'
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      console.log('Saving contact settings with data:', formData);
      
      // Validate and clean the data
      const cleanData = {
        store_name: formData.store_name?.trim() || 'W8 for Men',
        address: formData.address?.trim() || '',
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        working_hours: formData.working_hours?.trim() || '',
        website: formData.website?.trim() || '',
        facebook: formData.facebook?.trim() || '',
        instagram: formData.instagram?.trim() || '',
        twitter: formData.twitter?.trim() || '',
        youtube: formData.youtube?.trim() || '',
        map_url: formData.map_url?.trim() || '',
        terms_and_conditions: formData.terms_and_conditions?.trim() || '',
        developer_name: 'Ahmed Hany',
        developer_url: 'https://https://ahmed-hany-folio-glow.lovable.app/'
      };
      
      console.log('Cleaned data to save:', cleanData);
      
      const success = await updateSettings(cleanData);
      
      if (success) {
        console.log('Settings saved successfully');
        toast.success('Settings saved successfully!');
        
        // Force a page refresh to see changes immediately
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.error('Failed to save settings - no success returned');
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-800 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading contact settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="contact">Contact Information</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="developer">Developer Credit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Contact Information</CardTitle>
              <CardDescription>Enter contact information to display for visitors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="store_name" className="text-sm font-medium">Store Name</label>
                  <Input
                    id="store_name"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleChange}
                    placeholder="Store Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="text-sm font-medium">Address</label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Full Address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Contact Email"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="text-sm font-medium">Phone Number</label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contact Phone"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="working_hours" className="text-sm font-medium">Working Hours</label>
                  <Input
                    id="working_hours"
                    name="working_hours"
                    value={formData.working_hours}
                    onChange={handleChange}
                    placeholder="Example: Monday-Friday 9AM-5PM"
                  />
                </div>
                
                <div>
                  <label htmlFor="map_url" className="text-sm font-medium">Map URL</label>
                  <Input
                    id="map_url"
                    name="map_url"
                    value={formData.map_url}
                    onChange={handleChange}
                    placeholder="Google Maps Link"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Add social media links for your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="website" className="text-sm font-medium">Website</label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Website URL"
                  />
                </div>
                
                <div>
                  <label htmlFor="facebook" className="text-sm font-medium">Facebook</label>
                  <Input
                    id="facebook"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="Facebook Page URL"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="instagram" className="text-sm font-medium">Instagram</label>
                  <Input
                    id="instagram"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="Instagram Account URL"
                  />
                </div>
                
                <div>
                  <label htmlFor="twitter" className="text-sm font-medium">Twitter</label>
                  <Input
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="Twitter Account URL"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="youtube" className="text-sm font-medium">YouTube</label>
                <Input
                  id="youtube"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  placeholder="YouTube Channel URL"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>Enter the store terms and conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="terms_and_conditions"
                name="terms_and_conditions"
                value={formData.terms_and_conditions}
                onChange={handleChange}
                placeholder="Enter terms and conditions here..."
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle>Developer Credit</CardTitle>
              <CardDescription>Developer information shown in the footer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="developer_name" className="text-sm font-medium">Developer Name</label>
                  <Input
                    id="developer_name"
                    name="developer_name"
                    value={formData.developer_name}
                    onChange={handleChange}
                    placeholder="Developer Name"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">This field cannot be changed</p>
                </div>
                
                <div>
                  <label htmlFor="developer_url" className="text-sm font-medium">Developer URL</label>
                  <Input
                    id="developer_url"
                    name="developer_url"
                    value={formData.developer_url}
                    onChange={handleChange}
                    placeholder="Developer Website URL"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">This field cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          className="bg-green-600 hover:bg-green-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardFooter>
    </div>
  );
};

export default AdminContactSettings;
