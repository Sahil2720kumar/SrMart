import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProductsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Products',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
          headerLeft: () => (
            <Feather 
              onPress={() => router.push('/(tabs)/customer')} // Go to home
              name="chevron-left" 
              size={24} 
              color="black" 
            />
          ),
          headerRight: () => (
            <Ionicons name="filter" size={24} color="black" />
          ),
        }}
      />
      <Stack.Screen
        name="[productId]"
        options={{
          headerShown: true,
          title: 'Product Details',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
          headerLeft: () => (
            <Feather 
              onPress={() => router.back()} // ✅ This is correct - go to previous page
              name="chevron-left" 
              size={24} 
              color="black" 
            />
          ),
        }}
      />
    </Stack>
  );
}