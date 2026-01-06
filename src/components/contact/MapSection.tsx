import React from 'react';

interface MapSectionProps {
  settings: any;
}

const MapSection: React.FC<MapSectionProps> = ({ settings }) => {
  const mapUrl = settings?.map_url || 'https://maps.app.goo.gl/6fL14oHrKsSyFUoK7';
  const locationTitle = settings?.address || 'ضع العنوان هنا'; // هذا العنوان يظهر للمستخدم

  if (!mapUrl) return null;

  return (
    <div className="mt-10">
      {/* العنوان القابل للضغط */}
      <h2 className="text-2xl font-semibold mb-4 text-center">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-green-500 transition-colors"
        >
          {locationTitle}
        </a>
      </h2>

      {/* الخريطة */}
      <div className="h-80 bg-gray-200 rounded-lg overflow-hidden shadow-md">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Store Location"
        />
      </div>
    </div>
  );
};

export default MapSection;
