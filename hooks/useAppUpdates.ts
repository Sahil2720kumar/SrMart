import { useEffect, useCallback, useRef } from 'react';
import * as Updates from 'expo-updates';

export function useAppUpdates() {
  const {
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    currentlyRunning,
    availableUpdate,
  } = Updates.useUpdates();

  const hasChecked = useRef(false);

  // ✅ Auto-reload the moment a download completes
  useEffect(() => {
    if (isUpdatePending) {
      Updates.reloadAsync();
    }
  }, [isUpdatePending]);

  // ✅ Silent background check on launch (production only)
  const checkAndFetch = useCallback(async () => {
    if (__DEV__ || hasChecked.current) return;
    hasChecked.current = true;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        // isUpdatePending becomes true → triggers useEffect above
      }
    } catch (error) {
      console.warn('[Updates] Check failed:', error);
      // Don't crash the app — just log and move on
    }
  }, []);

  return {
    checkAndFetch,
    isUpdateAvailable,
    isUpdatePending,
    isChecking,
    isDownloading,
    currentlyRunning,
    availableUpdate,
  };
}