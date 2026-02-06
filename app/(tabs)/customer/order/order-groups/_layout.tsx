import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SearchLayout() {
  return (
    <Stack screenOptions={{
      headerLeft(props) {
        return (
          <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
        )
      },
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'My Orders',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000',
          headerLeft(props) {
            return (
              <Feather onPress={() => router.push("/(tabs)/customer")} name="chevron-left" size={24} color="black" />
            )
          },
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
          headerLeft(props) {
            return (
              <Feather onPress={() => router.push("/(tabs)/customer")} name="chevron-left" size={24} color="black" />
            )
          },
        }}
      />

    </Stack>
  );
}