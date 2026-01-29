import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAutoReload(
  refreshCallback: () => void | Promise<void>,
  intervalMs: number = 5 * 60 * 1000
) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }

    console.log(`[useAutoReload] Auto-refresh activé - refresh dans ${intervalMs / 1000} secondes`);

    const timer = setInterval(() => {
      console.log('[useAutoReload] Rafraîchissement des données...');
      refreshCallback();
    }, intervalMs);

    return () => {
      console.log('[useAutoReload] Nettoyage du timer');
      clearInterval(timer);
    };
  }, [pathname, intervalMs, refreshCallback]);
}
