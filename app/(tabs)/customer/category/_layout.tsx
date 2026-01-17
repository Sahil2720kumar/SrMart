import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export default function CategoryLayout() {
  return (
    <Stack screenOptions={{
      headerLeft(props) {
        return (
          <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
        )
      },
      headerRight(props) {
        return (
          <Feather onPress={() =>
            router.push("/(tabs)/customer/search")
          } name="search" size={24} color="black" />
        )
      },
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Categories',
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
        name="[categoryId]"
        options={{
          headerShown: true,
          title: 'Category Details',
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