import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
    variant?: 'default' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    variant = 'ghost',
    size = 'sm',
    showIcon = true,
    className = ''
}) => {
    const { language, toggleLanguage } = useLanguage();

    // Show opposite language text
    const buttonText = language === 'ar' ? 'English' : 'العربية';

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
