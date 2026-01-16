import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export default function OffersLayout() {
  return (
    <Stack screenOptions={{
      headerLeft(props) {
        return (
          <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
        )
      },
      headerRight(props) {
        return (
          <Feather name="search" size={24} color="black" />
        )
      },
    }}>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: 'Offers',
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
        name="[offerId]"
        options={{
          headerShown: true,
          title: 'Offer Name',
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