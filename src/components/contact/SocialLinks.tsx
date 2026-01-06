
import React from 'react';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

interface SocialLinksProps {
  settings: any;
}

const SocialLinks: React.FC<SocialLinksProps> = ({ settings }) => {
  const facebook = settings?.facebook;
  const instagram = settings?.instagram;
  const twitter = settings?.twitter;
  const youtube = settings?.youtube;

  const hasSocialLinks = facebook || instagram || twitter || youtube;

  if (!hasSocialLinks) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium mb-4">Follow Us</h3>
      <div className="flex space-x-4">
        {facebook && (
          <a
            href={facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
          >
            <Facebook size={24} />
          </a>
        )}
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 bg-pink-600 hover:bg-pink-700 text-white rounded-full transition"
          >
            <Instagram size={24} />
          </a>
        )}
        {twitter && (
          <a
            href={twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 bg-blue-400 hover:bg-blue-500 text-white rounded-full transition"
          >
            <Twitter size={24} />
          </a>
        )}
        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full transition"
          >
            <Youtube size={24} />
          </a>
        )}
      </div>
    </div>
  );
};

export default SocialLinks;
