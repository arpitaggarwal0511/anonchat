import { useEffect, useState } from 'react';

export function useThemeMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(localStorage.getItem('anon-theme') === 'dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('anon-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return { isDark, setIsDark };
}
