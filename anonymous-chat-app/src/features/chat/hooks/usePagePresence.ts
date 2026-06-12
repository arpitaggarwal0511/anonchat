import { useEffect, useState } from 'react';

const isPageActive = () =>
  typeof document !== 'undefined' &&
  document.visibilityState === 'visible' &&
  document.hasFocus();

export function usePagePresence() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const updatePresence = () => {
      setIsActive(isPageActive());
    };

    updatePresence();
    window.addEventListener('focus', updatePresence);
    window.addEventListener('blur', updatePresence);
    document.addEventListener('visibilitychange', updatePresence);

    return () => {
      window.removeEventListener('focus', updatePresence);
      window.removeEventListener('blur', updatePresence);
      document.removeEventListener('visibilitychange', updatePresence);
    };
  }, []);

  return isActive;
}
