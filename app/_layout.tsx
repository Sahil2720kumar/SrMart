import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { router, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import { OneSignal } from 'react-native-onesignal';
import * as Device from "expo-device"

Sentry.init({
  dsn: 'https://fc55274d0c42d1a57af8a2a0ce9a0056@o4510942569037824.ingest.us.sentry.io/4510942570414080',
  environment: __DEV__ ? 'development' : 'production',
  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration(),
    Sentry.consoleLoggingIntegration({ levels: ['error'] }), // 👈 this too
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function Layout() {
  const { initialize, initialized } = useAuthStore();

  // Kick off auth initialization — index.tsx waits for `initialized` via authReady prop
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);


  useEffect(() => {
    
    const appId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

    if (!appId) {
      console.error("EXPO_PUBLIC_ONESIGNAL_APP_ID Not found");
      return;
    }

    if (!Device.isDevice) {
      console.error("Push notifications require physical device");
      return;
    }

    OneSignal.initialize(appId);

    OneSignal.Notifications.requestPermission(true);

    const handleClick = (event: any) => {
      
      const data = event.notification.additionalData as {
        type: string;
        orderId?: string;
        orderGroupId?: string;
        offerId?: string;
        screen: string;
      };

      
      if (!data) return;
      handleNotificationNavigation(data);
    };

    OneSignal.Notifications.addEventListener("click", handleClick);

    return () => {
      OneSignal.Notifications.removeEventListener("click", handleClick);
    };
  }, []);

  const handleNotificationNavigation = (data: any) => {
    switch (data.type) {

      // Customer taps order notification
      // → app/(tabs)/customer/order/order-groups/orders/[orderId].tsx
      case 'order':
        router.push({
          pathname: '/(tabs)/customer/order/order-groups/orders/[orderId]',
          params: { orderId: data.orderId },
        });
        break;

      // Customer taps offer/promo notification
      // → app/(tabs)/customer/offers/[offerId].tsx
      case 'offer':
        if (data.offerId) {
          router.push({
            pathname: '/(tabs)/customer/offers/[offerId]',
            params: { offerId: data.offerId },
          });
        } else {
          // No specific offer → go to offers list
          router.push('/(tabs)/customer/offers');
        }
        break;

      // Vendor taps new order notification
      // → you need to add this route in vendor section
      case 'vendor_order':
        router.push({
          pathname: '/vendor/orders',
          params: { orderId: data.orderId },
        });
        break;

      // Delivery boy taps assigned order
      // → app/delivery/order/[orderId].tsx
      case 'delivery_order':
        router.push({
          pathname: '/delivery/order/[orderId]',
          params: { orderId: data.orderId },
        });
        break;
    }
  };


  // ✅ No early return here — index.tsx SplashScreen handles the wait for auth
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(tabs)/customer"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="auth"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="products"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="vendor"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="delivery"
              options={{ headerShown: false }}
            />
          </Stack>
          <Toast />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
});