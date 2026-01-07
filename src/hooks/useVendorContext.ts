import { useContext } from 'react';
import VendorContext from '@/contexts/VendorContext';

// ===========================================
// TYPES
// ===========================================

interface Vendor {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    cover_url?: string | null;
    description?: string | null;
    owner_id?: string;
    status: string;
}

interface VendorContextResult {
    isVendorContext: boolean;
    vendorId?: string;
    vendorSlug?: string;
    vendor?: Vendor;
}

// ===========================================
// HOOK - Single source of truth for context detection
// ===========================================

/**
 * Hook to detect if currently in vendor context.
 * 
 * - In vendor routes (/store/:vendorSlug/*): Returns isVendorContext=true with vendorId and vendor
 * - In global routes: Returns isVendorContext=false
 * 
 * This is the ONLY way hooks should detect context.
 */
export function useVendorContext(): VendorContextResult {
    const context = useContext(VendorContext);

    // Global route - no VendorContextProvider wrapping this component
    if (!context) {
        return {
            isVendorContext: false,
            vendorId: undefined,
            vendorSlug: undefined,
            vendor: undefined,
        };
    }

    // Vendor route - VendorContextProvider is active
    // At this point, vendorId is GUARANTEED to exist (provider blocks until resolved)
    return {
        isVendorContext: true,
        vendorId: context.vendorId,
        vendorSlug: context.vendorSlug,
        vendor: context.vendor,
    };
}

export default useVendorContext;
