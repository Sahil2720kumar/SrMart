import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function OrderLayout() {
  return (
    <Stack screenOptions={{
      headerLeft(props) {
        return (
          <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
        )
      },
    }}>
      <Stack.Screen
        name="cart"
        options={{
          headerShown: true,
          title: 'My Cart',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',

          headerLeft(props) {
            return (
              <Feather onPress={() => router.navigate("/(tabs)/customer")} name="chevron-left" size={24} color="black" />
            )
          },
        }}
      />
      <Stack.Screen
        name="checkout"
        options={{
          headerShown: true,
          title: 'Checkout',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          headerShown: true,
          title: 'Payment Method',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          headerShown: false,
          title: 'My Orders',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
        }}
      />
    </Stack>
  );
}