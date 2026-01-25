import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
    language: Language;
    direction: Direction;
    isLoading: boolean;
    toggleLanguage: () => void;
    t: typeof import('@/utils/translations').translations.ar;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    // Initialize from localStorage or default to Arabic
    const [language, setLanguage] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language') as Language;
            return saved === 'en' ? 'en' : 'ar';
        }
        return 'ar';
    });

    // Loading state for smooth language transitions
    const [isLoading, setIsLoading] = useState(false);

    const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

    // Dynamically import translations
    const [translations, setTranslations] = useState<any>(null);

    useEffect(() => {
        import('@/utils/translations').then((module) => {
            setTranslations(module.translations);
        });
    }, []);

    // Persist language preference and update document direction
    useEffect(() => {
        localStorage.setItem('language', language);

        // Update document direction and lang
        document.documentElement.dir = direction;
        document.documentElement.lang = language;

        // Add/remove RTL class for additional styling hooks
        if (direction === 'rtl') {
            document.documentElement.classList.add('rtl');
            document.documentElement.classList.remove('ltr');
        } else {
            document.documentElement.classList.add('ltr');
            document.documentElement.classList.remove('rtl');
        }
    }, [language, direction]);

    const toggleLanguage = () => {
        // Show loading state for smooth transition
        setIsLoading(true);

        // Small delay to show loading, then switch language
        setTimeout(() => {
            setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));

            // Hide loader after direction change completes
            setTimeout(() => {
                setIsLoading(false);
            }, 300);
        }, 200);
    };

    // Get current language translations
    const t = translations ? translations[language] : translations?.ar || {};

    return (
        <LanguageContext.Provider value={{ language, direction, isLoading, toggleLanguage, t }}>
            {children}
            {/* Global Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm transition-opacity duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-lg font-medium text-foreground animate-pulse">
                            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                    </div>
                </div>
            )}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// Safe hook that returns defaults if not in provider
export const useLanguageSafe = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        // Return safe defaults when not in provider
        return {
            language: 'ar' as Language,
            direction: 'rtl' as Direction,
            isLoading: false,
            toggleLanguage: () => { },
            t: {} as any
        };
    }
    return context;
};

export default LanguageContext;
