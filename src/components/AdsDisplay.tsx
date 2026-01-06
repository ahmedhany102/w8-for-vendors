
import React from 'react';
import { useSupabaseAds } from '@/hooks/useSupabaseAds';

interface Ad {
  id: string;
  title?: string;
  image_url: string;
  redirect_url?: string;
  description?: string;
  position: number;
  is_active: boolean;
}

const AdsDisplay: React.FC = () => {
  const { ads, loading } = useSupabaseAds();

  // Filter only active ads
  const activeAds = ads.filter(ad => ad.is_active);

  const handleAdClick = (ad: Ad) => {
    if (ad.redirect_url) {
      window.open(ad.redirect_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (activeAds.length === 0) {
    return null; // Don't show anything if no active ads
  }

  return (
    <div className="w-full space-y-4">
      {activeAds.map((ad) => (
        <div 
          key={ad.id} 
          className={`relative rounded-lg overflow-hidden shadow-md ${ad.redirect_url ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
          onClick={() => handleAdClick(ad)}
        >
          <img 
            src={ad.image_url} 
            alt={ad.title || 'Advertisement'} 
            className="w-full h-auto object-cover"
            onError={(e) => {
              console.error('Failed to load ad image:', ad.image_url);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {ad.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <h3 className="text-sm font-medium">{ad.title}</h3>
              {ad.description && (
                <p className="text-xs opacity-90">{ad.description}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdsDisplay;
