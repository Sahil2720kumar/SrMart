import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
     
      <Stack.Screen name="(tabs)"
        options={{
          // headerShown: true,
          headerTitle: "Delivery Dashboard",
          // headerBackVisible: false
        }}
      />
      {/* <Stack.Screen name="(tabs)/orders"
        options={{
          headerShown: true,
          headerTitle: "Vendor Dashboard",
          headerBackVisible: false
        }}
      />
      <Stack.Screen name="product" />
      <Stack.Screen name="order" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="earnings" /> */}
    </Stack>
  )
}
