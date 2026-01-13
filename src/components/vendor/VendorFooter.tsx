import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVendorContext } from '@/hooks/useVendorContext';
import { useVendorFooter } from '@/hooks/useVendorFooter';
import {
    MessageCircle,
    Facebook,
    Instagram,
    Mail,
    Home,
    ShoppingCart,
    User,
    Package,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * VendorFooter - Custom footer for vendor storefronts
 * Only renders inside /store/:vendorSlug/* routes
 * Displays vendor-customized social links, legal text, and navigation
 */
const VendorFooter: React.FC = () => {
    const { vendorId, vendorSlug, vendor } = useVendorContext();
    const { settings, loading } = useVendorFooter(vendorId);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [returnOpen, setReturnOpen] = useState(false);

    // Don't render if not in vendor context
    if (!vendorId || !vendorSlug) {
        return null;
    }

    if (loading) {
        return (
            <footer className="bg-muted/50 border-t mt-8 pb-20 md:pb-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-8 w-48 mx-auto" />
                        <Skeleton className="h-6 w-64 mx-auto" />
                        <Skeleton className="h-4 w-32 mx-auto" />
                    </div>
                </div>
            </footer>
        );
    }

    const hasSocialLinks = settings?.whatsapp_link || settings?.facebook_link ||
        settings?.instagram_link || settings?.email;
    const hasLegalText = settings?.privacy_policy || settings?.return_policy;
    const hasQuickLinks = settings?.show_home_link || settings?.show_cart_link ||
        settings?.show_profile_link || settings?.show_orders_link;

    // Helper function to ensure URLs have HTTPS protocol
    const ensureHttps = (url: string | null | undefined): string => {
        if (!url || url.trim() === '') return '#';
        const trimmed = url.trim();
        if (trimmed.startsWith('https://')) return trimmed;
        if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://');
        if (trimmed.startsWith('www.') || !trimmed.includes('://')) {
            return `https://${trimmed}`;
        }
        return trimmed;
    };

    return (
        <footer className="bg-muted/50 border-t mt-8 pb-20 md:pb-16">
            <div className="container mx-auto px-4 py-8">
                {/* Quick Links Section */}
                {hasQuickLinks && (
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {settings?.show_home_link && (
                            <Link
                                to={`/store/${vendorSlug}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                الرئيسية
                            </Link>
                        )}
                        {settings?.show_cart_link && (
                            <Link
                                to={`/store/${vendorSlug}/cart`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                العربة
                            </Link>
                        )}
                        {settings?.show_profile_link && (
                            <Link
                                to={`/store/${vendorSlug}/profile`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <User className="w-4 h-4" />
                                حسابي
                            </Link>
                        )}
                        {settings?.show_orders_link && (
                            <Link
                                to={`/store/${vendorSlug}/orders`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <Package className="w-4 h-4" />
                                طلباتي
                            </Link>
                        )}
                    </div>
                )}

                {/* Social Links Section */}
                {hasSocialLinks && (
                    <div className="flex justify-center gap-4 mb-6">
                        {settings?.whatsapp_link && (
                            <a
                                href={ensureHttps(settings.whatsapp_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                                title="WhatsApp"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        )}
                        {settings?.facebook_link && (
                            <a
                                href={ensureHttps(settings.facebook_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                title="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                        )}
                        {settings?.instagram_link && (
                            <a
                                href={ensureHttps(settings.instagram_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white hover:opacity-90 transition-opacity"
                                title="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        )}
                        {settings?.email && (
                            <a
                                href={`mailto:${settings.email}`}
                                className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                                title="Email"
                            >
                                <Mail className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                )}

                {/* Legal Text Section (Collapsible) */}
                {hasLegalText && (
                    <div className="max-w-2xl mx-auto mb-6 space-y-3">
                        {settings?.privacy_policy && (
                            <div className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setPrivacyOpen(!privacyOpen)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium bg-background hover:bg-muted/50 transition-colors"
                                >
                                    سياسة الخصوصية
                                    {privacyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {privacyOpen && (
                                    <div className="px-4 py-3 text-sm text-muted-foreground bg-background border-t">
                                        <p className="whitespace-pre-wrap">{settings.privacy_policy}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {settings?.return_policy && (
                            <div className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setReturnOpen(!returnOpen)}
                                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium bg-background hover:bg-muted/50 transition-colors"
                                >
                                    سياسة الاسترجاع
                                    {returnOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                {returnOpen && (
                                    <div className="px-4 py-3 text-sm text-muted-foreground bg-background border-t">
                                        <p className="whitespace-pre-wrap">{settings.return_policy}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Powered by W8 (Mandatory) */}
                <div className="text-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        Powered by{' '}
                        <Link to="/" className="font-bold text-primary hover:underline">
                            W8
                        </Link>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        © {new Date().getFullYear()} جميع الحقوق محفوظة
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default VendorFooter;
