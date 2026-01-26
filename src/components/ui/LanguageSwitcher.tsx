import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
    iconOnly?: boolean;
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'ghost',
    size = 'sm',
    showIcon = true,
    iconOnly = false,
    className = ''
}) => {
    const { language, toggleLanguage } = useLanguage();

    // Show opposite language text
    const buttonText = language === 'ar' ? 'English' : 'العربية';

    // Icon-only mode for mobile
    if (iconOnly) {
        return (
            <Button
                variant={variant}
                size="icon"
                onClick={toggleLanguage}
                className={`h-8 w-8 md:h-9 md:w-9 ${className}`}
                title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
                <Globe className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
        );
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 font-medium ${className}`}
            title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
            {showIcon && <Globe className="h-4 w-4" />}
            <span>{buttonText}</span>
        </Button>
    );
};

export default LanguageSwitcher;
