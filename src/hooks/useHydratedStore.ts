import { useState, useEffect } from 'react';
import { useQuoteStore, QuoteStore } from '@/store/quoteStore';

export function useHydratedStore<T>(
  selector: (state: QuoteStore) => T,
  fallback: T
): T {
  const store = useQuoteStore(selector);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  return isHydrated ? store : fallback;
}
