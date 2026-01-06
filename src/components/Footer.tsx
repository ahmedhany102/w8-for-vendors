import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MessageCircleMore } from 'lucide-react';
import { useSupabaseContactSettings } from '@/hooks/useSupabaseData';

const Footer = () => {
  const { settings, loading } = useSupabaseContactSettings();

  // Default values with updated developer info
  const defaultSettings = {
    store_name: 'W8 for Men',
    address: 'Cairo, Egypt',
    email: 'info@w8store.com',
    phone: '+20 123 456 7890',
    working_hours: 'Mon-Fri: 9AM-6PM',
    facebook: 'https://www.facebook.com/share/16LEN8zQG3/',
    instagram: 'https://www.instagram.com/a7med0xd/',
    developer_name: 'Ahmed Hany',
    developer_url: 'https://www.instagram.com/a7med0xd/',
    developer_portfolio: 'https://ahmed-hany-folio-glow.lovable.app/',
  };

  const currentSettings = settings || defaultSettings;

  if (loading) {
    return (
      <footer className="bg-background border-t border-border pt-6 pb-3 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center p-4">
            <div className="text-center text-muted-foreground">Loading...</div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-background border-t border-border text-foreground pt-6 pb-3 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {/* Store Info */}
          <div>
            <h3 className="font-bold mb-2 text-base">{currentSettings.store_name}</h3>
            <p className="text-muted-foreground mb-2">
              Best collection of clothing and footwear for men at affordable prices.
            </p>
            <div className="flex space-x-3 rtl:space-x-reverse">
              {currentSettings.facebook && (
                <a
                  href={currentSettings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-blue-400"
                >
                  <Facebook size={16} />
                </a>
              )}
              {currentSettings.instagram && (
                <a
                  href={currentSettings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-pink-400"
                >
                  <Instagram size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-2 text-base">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              <li><Link to="/orders" className="text-muted-foreground hover:text-foreground">My Orders</Link></li>
              <li><Link to="/cart" className="text-muted-foreground hover:text-foreground">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Contact Us + Developer Info */}
          <div>
            <h3 className="font-bold mb-2 text-base">Contact Us</h3>
            <ul className="space-y-1">
              <li className="flex items-center text-muted-foreground">{currentSettings.phone}</li>
              <li className="flex items-center text-muted-foreground">{currentSettings.email}</li>
              <li className="flex items-center text-muted-foreground">{currentSettings.address}</li>
            </ul>

            {/* Developer Info */}
            <div className="mt-4">
              <span className="text-foreground font-semibold text-lg">
                Dev:{' '}
                <a
                  href={currentSettings.developer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-all duration-300"
                >
                  {currentSettings.developer_name}
                </a>
              </span>
            </div>

            <div className="mt-1">
              <span className="text-muted-foreground text-sm">
             
              </span>
            </div>
          </div>

          {/* Information */}
          <div>
            <h3 className="font-bold mb-2 text-base">Information</h3>
            <ul className="space-y-1">
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-3 md:mb-0">
              © {new Date().getFullYear()} {currentSettings.store_name}. All Rights Reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://wa.me/qr/2O2JSVLBTNEIJ1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-green-400"
                title="WhatsApp"
              >
                <MessageCircleMore size={16} />
              </a>
              <a
                href="https://www.facebook.com/share/16LEN8zQG3/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-blue-400"
                title="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://www.instagram.com/a7med0xd/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-pink-400"
                title="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://linkedin.com/in/ahmed-hany-436342257"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-blue-500"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
