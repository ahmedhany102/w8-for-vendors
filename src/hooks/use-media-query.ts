
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Update matches state immediately
    setMatches(media.matches);
    
    // Define the handler
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Add event listener
    media.addEventListener('change', handler);
    
    // Clean up
    return () => media.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
