"use client";

import { useEffect, useState } from "react";

export function ClientBoundary({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : <>{fallback}</>;
}
