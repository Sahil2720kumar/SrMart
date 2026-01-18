import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';


// Run this ONCE in your app to clear old data
// import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage.removeItem('cart-store').then(() => {
//   console.log('Cart store cleared!');
// });

export default function Layout() {
  return (
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
            name='products'
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen
            name='vendor'
            options={{
              headerShown: false,
              headerBackVisible:false
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView >
  )
}
