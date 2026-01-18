import { Stack } from "expo-router"

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
      <Stack.Screen name="(tabs)/orders"
        options={{
          headerShown: true,
          headerTitle: "Vendor Dashboard",
          headerBackVisible: false
        }}
      />
      <Stack.Screen name="product" />
      <Stack.Screen name="order" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="earnings" />
    </Stack>
  )
}
