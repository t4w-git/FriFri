import { useEffect } from 'react';
import AdBanner from './AdBanner';

/**
 * Banner ad orizzontale da inserire tra le sezioni
 */
export default function AdBannerHorizontal() {
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

  const slot = import.meta.env.VITE_GOOGLE_ADSENSE_SLOT_LEFT;

  return (
    <div className="w-full flex justify-center py-8">
      <div className="w-full max-w-6xl px-4">
        <AdBanner 
          slot={slot} 
          format="horizontal"
          style={{ width: '100%', height: 'auto', maxHeight: '280px' }}
        />
      </div>
    </div>
  );
}
