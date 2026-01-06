import React from 'react';
import { Package, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type BrowseMode = 'products' | 'vendors';

interface BrowseModeToggleProps {
  mode: BrowseMode;
  onModeChange: (mode: BrowseMode) => void;
}

const BrowseModeToggle: React.FC<BrowseModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-muted-foreground">تصفح حسب:</span>
      <div className="flex rounded-lg border border-border overflow-hidden">
        <Button
          variant={mode === 'products' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('products')}
          className={`rounded-none gap-1.5 ${mode === 'products' ? '' : 'hover:bg-muted'}`}
        >
          <Package className="w-4 h-4" />
          <span>المنتجات</span>
        </Button>
        <Button
          variant={mode === 'vendors' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onModeChange('vendors')}
          className={`rounded-none gap-1.5 ${mode === 'vendors' ? '' : 'hover:bg-muted'}`}
        >
          <Store className="w-4 h-4" />
          <span>المتاجر</span>
        </Button>
      </div>
    </div>
  );
};

export default BrowseModeToggle;
