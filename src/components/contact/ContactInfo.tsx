import React from 'react';
import { Card } from '@/components/ui/card';
import { Phone, Mail, MapPin } from 'lucide-react';

interface ContactInfoProps {
  settings: any;
}

const ContactInfo: React.FC<ContactInfoProps> = ({ settings }) => {
  const phone = settings?.phone || '01501640040';
  const email = settings?.email || 'support@w8.com';
  const address = settings?.address || 'Cairo, Egypt';
  const developerName = 'Ahmed Hany';
  const developerWhatsapp = 'https://wa.me/qr/2O2JSVLBTNEIJ1';

  return (
    <Card className="p-6 shadow-md bg-gradient-to-br from-green-700 to-green-900 text-white">
      <h2 className="text-xl font-semibold mb-6">Get In Touch</h2>
      
      <div className="space-y-6">
        <div className="flex items-center">
          <div className="bg-white/20 p-3 rounded-full mr-4">
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-white/70">Call Us</p>
            <p className="text-lg font-semibold hover:text-green-300">
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-white/20 p-3 rounded-full mr-4">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-white/70">Email Us</p>
            <p className="text-lg font-semibold hover:text-green-300">
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-white/20 p-3 rounded-full mr-4">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-white/70">Location</p>
            <p className="text-lg font-semibold">{address}</p>
          </div>
        </div>
      </div>

      {/* Developer Info */}
      <div className="mt-6 text-lg font-semibold text-white text-center hover:text-green-300">
        Dev: <a href={developerWhatsapp} target="_blank" rel="noopener noreferrer">{developerName}</a>
      </div>
    </Card>
  );
};

export default ContactInfo;
