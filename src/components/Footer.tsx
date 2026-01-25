import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, CreditCard, Banknote, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSupabaseContactSettings } from '@/hooks/useSupabaseContactSettings';
import { useLanguageSafe } from '@/contexts/LanguageContext';

const Footer = () => {
  const [email, setEmail] = useState('');
  const { settings } = useSupabaseContactSettings();
  const { t, direction } = useLanguageSafe();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(direction === 'rtl' ? 'من فضلك أدخل بريدك الإلكتروني' : 'Please enter your email');
      return;
    }
    toast.success(t?.footer?.thankYou || 'Thank you for subscribing!');
    setEmail('');
  };

  // Get social links from settings with fallbacks
  const facebookUrl = (settings as any)?.facebook || '';
  const instagramUrl = (settings as any)?.instagram || '';
  const twitterUrl = (settings as any)?.twitter || '';

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Brand Info */}
          <div className="text-start">
            <Link to="/" className="inline-block mb-4">
              <img
                src="/logo.png"
                alt="Sarraly Logo"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              {t?.footer?.brandDesc || 'Sarraly Platform - Your gateway to integrated e-commerce. Start, sell, and grow without limits.'}
            </p>
            <div className={`flex gap-3 ${direction === 'rtl' ? 'justify-end' : 'justify-start'}`}>
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors"
                >
                  <Facebook size={18} />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors"
                >
                  <Instagram size={18} />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors"
                >
                  <Twitter size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-start">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{t?.footer?.quickLinks || 'Quick Links'}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.home || 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/section/best-seller-1" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.bestSeller || 'Best Sellers'}
                </Link>
              </li>
              <li>
                <Link to="/vendors" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.stores || 'Stores'}
                </Link>
              </li>
              <li>
                <Link to="/become-vendor" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.getYourStore || 'Get Your Store'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="text-start">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{t?.footer?.customerService || 'Customer Service'}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.contactUs || 'Contact Us'}
                </Link>
              </li>
              <li>
                <Link to="/policy/shipping" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.shippingPolicy || 'Shipping Policy'}
                </Link>
              </li>
              <li>
                <Link to="/policy/returns" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.returnsPolicy || 'Returns & Exchanges'}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary transition-colors text-sm">
                  {t?.footer?.faq || 'FAQ'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="text-start">
            <h3 className="font-bold text-gray-900 text-lg mb-4">{t?.footer?.newsletter || 'Newsletter'}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {t?.footer?.newsletterDesc || 'Subscribe for the latest offers and discounts'}
            </p>
            <form onSubmit={handleSubscribe} className={`flex gap-2 mb-4 ${direction === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}>
              <Input
                type="email"
                placeholder={t?.footer?.emailPlaceholder || 'Your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50 border-gray-200"
                dir="ltr"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white shrink-0">
                <Send size={16} />
              </Button>
            </form>

            {/* Payment Methods */}
            <div className={`flex gap-2 ${direction === 'rtl' ? 'justify-end' : 'justify-start'} items-center flex-wrap`}>
              <span className="text-xs text-gray-500">{t?.footer?.paymentMethods || 'Payment Methods'}:</span>
              <div className="flex gap-2 items-center">
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <CreditCard size={14} className="text-gray-600" />
                </div>
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold text-gray-600">
                  VISA
                </div>
                <div className="w-10 h-6 bg-gray-100 rounded flex items-center justify-center">
                  <Banknote size={14} className="text-gray-600" />
                </div>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {t?.footer?.comingSoon || 'Coming Soon'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Credits */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
            {/* Copyright */}
            <div className="text-gray-600">
              © {new Date().getFullYear()} Sarraly. {t?.footer?.copyright || 'All Rights Reserved'}.
            </div>

            {/* Developer Credit */}
            <div className="text-gray-600">
              {t?.footer?.developedBy || 'Developed by'}{' '}
              <a
                href="https://ahmed-hany-dev-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-gray-900 hover:text-primary transition-colors"
              >
                Eng. Ahmed Hany | Founder & CEO
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
