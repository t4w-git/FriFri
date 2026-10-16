import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Hook for generating and persisting browser fingerprint
 * Used for anti-cheating device-hopping detection
 * 
 * Returns: { fingerprint: string, loading: boolean }
 */
export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFingerprint = async () => {
      try {
        // Check localStorage first
        const stored = localStorage.getItem('browserFingerprint');
        if (stored) {
          setFingerprint(stored);
          setLoading(false);
          return;
        }

        // Load FingerprintJS and generate fingerprint
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        // Store in localStorage for persistence across sessions
        localStorage.setItem('browserFingerprint', visitorId);
        setFingerprint(visitorId);
        setLoading(false);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
        
        // Fallback: Generate pseudo-random ID if FingerprintJS fails
        const fallbackId = `fallback_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        localStorage.setItem('browserFingerprint', fallbackId);
        setFingerprint(fallbackId);
        setLoading(false);
      }
    };

    getFingerprint();
  }, []);

  return { fingerprint, loading };
}
