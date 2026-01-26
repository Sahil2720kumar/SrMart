import { useProfileStore } from "@/store/profileStore";
import { Redirect, Stack } from "expo-router"
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
      <Stack.Screen name="order/[orderId]" />
      <Stack.Screen name="auth" />
    </Stack>
  )
}
