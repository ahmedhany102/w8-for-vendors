
import React from 'react';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import ContactForm from '@/components/contact/ContactForm';
import ContactInfo from '@/components/contact/ContactInfo';
import WorkingHours from '@/components/contact/WorkingHours';
import SocialLinks from '@/components/contact/SocialLinks';
import MapSection from '@/components/contact/MapSection';
import { useSupabaseContactSettings } from '@/hooks/useSupabaseContactSettings';

const Contact = () => {
  const { settings, loading: settingsLoading } = useSupabaseContactSettings();
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the message object
      const newMessage = {
        id: `msg-${Date.now()}`,
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Get existing messages or create empty array
      let existingMessages = [];
      const storedMessages = localStorage.getItem('contactMessages');
      if (storedMessages) {
        existingMessages = JSON.parse(storedMessages);
      }
      
      // Add new message to beginning of array
      existingMessages.unshift(newMessage);
      
      // Save back to localStorage
      localStorage.setItem('contactMessages', JSON.stringify(existingMessages));
      
      // Show success toast and reset form
      toast.success("تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً");
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error saving contact message:", error);
      toast.error("حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Us</h1>
        
        {settingsLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div>
                <ContactForm
                  form={form}
                  isSubmitting={isSubmitting}
                  onFormChange={handleChange}
                  onSubmit={handleSubmit}
                />
              </div>
              
              {/* Contact Information */}
              <div>
                <ContactInfo settings={settings} />
                <WorkingHours settings={settings} />
                <SocialLinks settings={settings} />
              </div>
            </div>
            
            <MapSection settings={settings} />
          </>
        )}
      </div>
    </Layout>
  );
};

export default Contact;
