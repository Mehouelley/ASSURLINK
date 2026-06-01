import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setLocation(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return location;
}
