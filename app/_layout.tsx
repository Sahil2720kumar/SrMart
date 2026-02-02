import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { Redirect, Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { ActivityIndicator, Text } from 'react-native';

// Run this ONCE in your app to clear old data
// import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage.removeItem('active-discount-store').then(() => {
//   console.log('Cart store cleared!');
// });

export default function Layout() {
  const { initialize, initialized, loading } = useAuthStore();
  const { getUserRole } = useProfileStore();


  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // ⏳ wait until auth is ready
  if (loading || !initialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16a34a' }}>
        <StatusBar style="light" />
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>FreshMart</Text>
        <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />
      </GestureHandlerRootView>
    );
  }


  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <StatusBar style="auto" />
          <Stack >
            <Stack.Screen
              name='index'
              options={{
                headerShown: true
              }}
            />
            <Stack.Screen
              name='(tabs)/customer'
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name='auth'
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name='products'
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name='vendor'
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name='delivery'
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </BottomSheetModalProvider>
      </GestureHandlerRootView >
    </QueryClientProvider>
  )
}
