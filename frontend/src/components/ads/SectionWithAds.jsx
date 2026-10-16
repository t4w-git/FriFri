import { useEffect } from 'react';
import AdBanner from './AdBanner';

/**
 * Wrapper per wrappare una singola sezione con sidebar ads
 * Usare: <SectionWithAds><YourSection /></SectionWithAds>
 */
export default function SectionWithAds({ children }) {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    if (document.querySelector('script[src*="pagead2.googlesyndication"]')) return;
    
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [clientId]);

  const leftSlot = import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_LEFT;
  const rightSlot = import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_RIGHT;

  return (
    <div className="flex gap-4 w-full">
      {/* Left Ad - Hidden on mobile */}
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="sticky top-4">
          <AdBanner 
            slot={leftSlot} 
            format="vertical"
            style={{ width: '300px', height: 'auto' }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Right Ad - Hidden on mobile */}
      <div className="hidden lg:block w-[300px] flex-shrink-0">
        <div className="sticky top-4">
          <AdBanner 
            slot={rightSlot} 
            format="vertical"
            style={{ width: '300px', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}
