
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, MessageCircleMore } from 'lucide-react';

const CustomFooter = () => {
  return (
    <footer className="mt-auto bg-gradient-to-r from-green-900 to-black text-white py-6 px-4 shadow-inner">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
            <h3 className="font-bold text-lg mb-2">W8 for Men</h3>
            <p className="text-sm text-gray-300">Best collection for men</p>
          </div>
          
          <div className="flex flex-col items-center">
            <nav className="flex flex-wrap justify-center gap-4 mb-4">
              <Link to="/" className="text-sm hover:text-green-300 transition-colors">Home</Link>
              <Link to="/profile" className="text-sm hover:text-green-300 transition-colors">My Account</Link>
              <Link to="/cart" className="text-sm hover:text-green-300 transition-colors">Cart</Link>
              <Link to="/orders" className="text-sm hover:text-green-300 transition-colors">My Orders</Link>
              <Link to="/contact" className="text-sm hover:text-green-300 transition-colors">Contact Us</Link>
              <Link to="/terms" className="text-sm hover:text-green-300 transition-colors">Terms & Conditions</Link>
            </nav>
          </div>
        </div>
        
        <div className="border-t border-green-800 mt-4 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="text-xs text-gray-300 mb-3 md:mb-0">© {new Date().getFullYear()} W8 for Men</p>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-300">Dev Ahmed Hany:</span>
              
              <a href="https://wa.me/qr/2O2JSVLBTNEIJ1" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-green-400" title="WhatsApp">
                <MessageCircleMore size={16} />
              </a>
              
              <a href="https://www.facebook.com/share/16LEN8zQG3/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-400" title="Facebook">
                <Facebook size={16} />
              </a>
              
              <a href="https://www.instagram.com/a7med0xd/" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400" title="Instagram">
                <Instagram size={16} />
              </a>
              
              <a href="https://linkedin.com/in/ahmed-hany-436342257" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500" title="LinkedIn">
                <Linkedin size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CustomFooter;
