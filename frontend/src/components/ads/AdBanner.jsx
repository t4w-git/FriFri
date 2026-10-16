import { useEffect } from 'react';

export default function AdBanner({ slot, format = 'auto', style = {} }) {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, [slot, clientId]);

  if (!clientId || !slot) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ 
        display: 'block', 
        minHeight: '250px',
        ...style 
      }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
