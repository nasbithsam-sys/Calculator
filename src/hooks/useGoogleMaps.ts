import { useState, useEffect, useMemo } from 'react';

export function useGoogleMaps(libraries: string[] = ['places', 'geometry']) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  const libraryList = libraries.join(',');
  const configurationError = useMemo(
    () => apiKey ? null : new Error('Google Maps browser key is not configured'),
    [apiKey]
  );

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    if (window.google) {
      const timeout = window.setTimeout(() => setIsLoaded(true), 0);
      return () => window.clearTimeout(timeout);
    }

    if (document.getElementById('google-maps-script')) {
      // Script is already loading, wait for it
      const checkInterval = setInterval(() => {
        if (window.google) {
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Use fixed libraries since we can't easily dynamically change them once script is injected
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraryList}&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError(new Error('Failed to load Google Maps script'));
    
    document.head.appendChild(script);
  }, [apiKey, libraryList]);

  return { isLoaded, error: configurationError ?? error };
}
