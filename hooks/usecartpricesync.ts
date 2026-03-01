import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import useCartStore from '@/store/cartStore';

/**
 * useCartPriceSync
 *
 * Drop this hook into your root layout (or checkout screen) once.
 * It calls syncPricesFromDB:
 *   1. On initial mount (first load / cold start)
 *   2. Every time the app returns to the foreground
 *
 * Usage:
 *   // app/_layout.tsx  (or any top-level component)
 *   import { useCartPriceSync } from '@/hooks/useCartPriceSync';
 *   export default function RootLayout() {
 *     useCartPriceSync();
 *     ...
 *   }
 */
export function useCartPriceSync() {
  const syncPricesFromDB = useCartStore((s) => s.syncPricesFromDB);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Sync on mount
    syncPricesFromDB();

    const subscription = AppState.addEventListener('change', (nextState) => {
      // Sync when app comes back to foreground
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        syncPricesFromDB();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [syncPricesFromDB]);
}

/**
 * useCheckoutPriceSync
 *
 * Use this on the checkout / cart review screen to guarantee
 * prices are fresh before the user places an order.
 *
 * Usage:
 *   // screens/CheckoutScreen.tsx
 *   import { useCheckoutPriceSync } from '@/hooks/useCartPriceSync';
 *   export default function CheckoutScreen() {
 *     const { isSyncing } = useCheckoutPriceSync();
 *     if (isSyncing) return <LoadingSpinner />;
 *     ...
 *   }
 */
export function useCheckoutPriceSync() {
  const syncPricesFromDB = useCartStore((s) => s.syncPricesFromDB);
  const isSyncing = useCartStore((s) => s.isSyncingPrices);

  useEffect(() => {
    syncPricesFromDB();
  }, [syncPricesFromDB]);

  return { isSyncing };
}