
import React from 'react';
import { useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { useLanguageSafe } from '@/contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  hideGlobalHeader?: boolean;
}

const Layout = ({ children, hideFooter = false, hideGlobalHeader = false }: LayoutProps) => {
  const location = useLocation();
  const { direction } = useLanguageSafe();

  return (
    <div key={direction} dir={direction} className="flex flex-col min-h-screen">
      {!hideGlobalHeader && <AppHeader />}
      <main className="flex-grow pb-20">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
