import { useProfileStore } from "@/store/profileStore";
import { Redirect, Stack } from "expo-router"

export default function VendorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)"
        options={{
          // headerShown: true,
          headerTitle: "Vendor Dashboard",
          // headerBackVisible: false
        }}
      />
      <Stack.Screen name="product/[productId]" />
      <Stack.Screen name="order/[orderId]" />
      <Stack.Screen name="inventory/index" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="auth" />
    </Stack>
  )
}
