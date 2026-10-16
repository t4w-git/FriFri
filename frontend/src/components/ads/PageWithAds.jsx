import { useEffect } from 'react';
import AdBanner from './AdBanner';

/**
 * PageWithAds wrapper per aggiungere banner AdSense sui lati
 * Usare: <PageWithAds children={<YourPage />} />
 */
export default function PageWithAds({ children, hideAds = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || hideAds) return;
    if (document.querySelector('script[src*="pagead2.googlesyndication"]')) return;
    
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [clientId, hideAds]);

  if (hideAds) return children;

  // Slot ID: configura con i tuoi slot di Google AdSense
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
