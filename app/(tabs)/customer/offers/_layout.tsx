import { router, Stack } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';

export default function OffersLayout() {
  return (
    <Stack screenOptions={{
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
          title: 'Offers',
          headerBackTitle: 'Back',
          // Optional: customize header
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTitleAlign: 'center',
          headerTintColor: '#000', 
          headerLeft(props) {
            return (
              <Feather onPress={() => router.push("/customer")} name="chevron-left" size={24} color="black" />
            )
          },
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
          headerLeft(props) {
            return (
              <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
            )
          }, 
        }}
      />
    </Stack>
  );
}