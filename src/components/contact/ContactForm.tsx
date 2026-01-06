
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ContactFormProps {
  form: {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  isSubmitting: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  form,
  isSubmitting,
  onFormChange,
  onSubmit
}) => {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            الاسم
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            className="w-full p-2 border rounded focus:ring focus:ring-green-200 focus:border-green-500"
            placeholder="الاسم الكامل"
            required
          />
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={onFormChange}
            className="w-full p-2 border rounded focus:ring focus:ring-green-200 focus:border-green-500"
            placeholder="example@email.com"
            required
          />
        </div>

        {/* Subject field */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            الموضوع
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={form.subject}
            onChange={onFormChange}
            className="w-full p-2 border rounded focus:ring focus:ring-green-200 focus:border-green-500"
            placeholder="موضوع الرسالة"
            required
          />
        </div>

        {/* Message field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            الرسالة
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={onFormChange}
            rows={5}
            className="w-full p-2 border rounded focus:ring focus:ring-green-200 focus:border-green-500"
            placeholder="اكتب رسالتك هنا..."
            required
          ></textarea>
        </div>

        {/* Submit button */}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-green-700 hover:bg-green-800 text-white py-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري الإرسال...
            </span>
          ) : (
            "إرسال الرسالة"
          )}
        </Button>
      </form>
    </Card>
  );
};

export default ContactForm;
