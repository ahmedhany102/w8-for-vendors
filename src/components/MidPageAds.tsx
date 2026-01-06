import React from 'react';
import { useSupabaseAds } from '@/hooks/useSupabaseAds';
import { Card } from './ui/card';

interface MidPageAdsProps {
  className?: string;
}

const MidPageAds: React.FC<MidPageAdsProps> = ({ className = '' }) => {
  const { ads, loading } = useSupabaseAds();

  // Filter ads by position: 
  // position 0-9 = hero (top)
  // position 10-19 = mid_left
  // position 20-29 = mid_right
  const midLeftAds = ads.filter(ad => ad.is_active && ad.position >= 10 && ad.position < 20);
  const midRightAds = ads.filter(ad => ad.is_active && ad.position >= 20 && ad.position < 30);

  const leftAd = midLeftAds[0];
  const rightAd = midRightAds[0];

  const handleAdClick = (redirectUrl?: string | null) => {
    if (redirectUrl) {
      window.open(redirectUrl, '_blank');
    }
  };

  // Don't render if no mid-page ads or still loading
  if (loading || (!leftAd && !rightAd)) {
    return null;
  }

  return (
    <div className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {/* Left Ad */}
      <div className="w-full">
        {leftAd ? (
          <Card 
            className={`relative overflow-hidden rounded-lg shadow-lg h-40 md:h-48 ${leftAd.redirect_url ? 'cursor-pointer' : ''}`}
            onClick={() => handleAdClick(leftAd.redirect_url)}
          >
            <img 
              src={leftAd.image_url} 
              alt={leftAd.title || 'Advertisement'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {leftAd.title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-bold">{leftAd.title}</h3>
                  {leftAd.description && (
                    <p className="text-sm opacity-90 line-clamp-2">{leftAd.description}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="h-40 md:h-48 bg-muted rounded-lg" />
        )}
      </div>

      {/* Right Ad */}
      <div className="w-full">
        {rightAd ? (
          <Card 
            className={`relative overflow-hidden rounded-lg shadow-lg h-40 md:h-48 ${rightAd.redirect_url ? 'cursor-pointer' : ''}`}
            onClick={() => handleAdClick(rightAd.redirect_url)}
          >
            <img 
              src={rightAd.image_url} 
              alt={rightAd.title || 'Advertisement'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            {rightAd.title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-bold">{rightAd.title}</h3>
                  {rightAd.description && (
                    <p className="text-sm opacity-90 line-clamp-2">{rightAd.description}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="h-40 md:h-48 bg-muted rounded-lg" />
        )}
      </div>
    </div>
  );
};

export default MidPageAds;
