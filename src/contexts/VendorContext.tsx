import React, { createContext, useContext, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendorBySlug } from '@/hooks/useVendors';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Store, AlertCircle, ArrowLeft } from 'lucide-react';

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

interface VendorContextValue {
    vendorId: string;       // Guaranteed non-null when children render
    vendorSlug: string;     // Guaranteed non-null when children render
    vendor: Vendor;         // Full vendor object
}

// ===========================================
// CONTEXT
// ===========================================

const VendorContext = createContext<VendorContextValue | null>(null);

// ===========================================
// HOOK - Use inside vendor routes only
// ===========================================

export function useVendorContext(): VendorContextValue {
    const context = useContext(VendorContext);
    if (!context) {
        throw new Error(
            'useVendorContext must be used within a VendorContextProvider. ' +
            'This hook should only be used in routes under /store/:vendorSlug/*'
        );
    }
    return context;
}

// ===========================================
// LOADING STATE
// ===========================================

function VendorLoading() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Skeleton className="w-20 h-20 rounded-full mb-4" />
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-32 h-4" />
            <p className="text-sm text-muted-foreground mt-4">جاري تحميل المتجر...</p>
        </div>
    );
}

// ===========================================
// NOT FOUND STATE
// ===========================================

function VendorNotFound({ vendorSlug }: { vendorSlug: string }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <Store className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">المتجر غير موجود</h1>
            <p className="text-muted-foreground mb-6">
                لم نتمكن من العثور على متجر "{vendorSlug}"
            </p>
            <Button onClick={() => navigate('/vendors')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                تصفح المتاجر
            </Button>
        </div>
    );
}

// ===========================================
// ERROR STATE
// ===========================================

function VendorError({ error, onRetry }: { error: string; onRetry: () => void }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold mb-2">حدث خطأ</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/')}>
                    العودة للرئيسية
                </Button>
                <Button onClick={onRetry}>
                    إعادة المحاولة
                </Button>
            </div>
        </div>
    );
}

// ===========================================
// PROVIDER
// ===========================================

interface VendorContextProviderProps {
    children: ReactNode;
}

export function VendorContextProvider({ children }: VendorContextProviderProps) {
    // Extract vendorSlug from URL
    const { vendorSlug } = useParams<{ vendorSlug: string }>();

    // Fetch vendor data
    const { vendor, loading, error } = useVendorBySlug(vendorSlug);

    // ===========================================
    // STATE 1: No vendorSlug in URL (should not happen if routing is correct)
    // ===========================================
    if (!vendorSlug) {
        return <VendorNotFound vendorSlug="unknown" />;
    }

    // ===========================================
    // STATE 2: Loading - DO NOT render children
    // ===========================================
    if (loading) {
        return <VendorLoading />;
    }

    // ===========================================
    // STATE 3: Error - DO NOT render children
    // ===========================================
    if (error) {
        return (
            <VendorError
                error={error}
                onRetry={() => window.location.reload()}
            />
        );
    }

    // ===========================================
    // STATE 4: Vendor not found - DO NOT render children
    // ===========================================
    if (!vendor || !vendor.id) {
        return <VendorNotFound vendorSlug={vendorSlug} />;
    }

    // ===========================================
    // STATE 5: RESOLVED - vendorId is available, render children
    // ===========================================
    const contextValue: VendorContextValue = {
        vendorId: vendor.id,
        vendorSlug: vendorSlug,
        vendor: vendor,
    };

    return (
        <VendorContext.Provider value={contextValue}>
            {children}
        </VendorContext.Provider>
    );
}

export default VendorContext;
