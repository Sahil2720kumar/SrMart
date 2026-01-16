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
      headerRight(props) {
        return (
          <Ionicons name="filter" size={24} color="black" />
        )
      },
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Search',
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
        name="search-results"
        options={{
          headerShown: true,
          title: 'Search Query',
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