import { Stack } from "expo-router"

export default function DeliveryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="edit"/>
      <Stack.Screen name="settings" />
      <Stack.Screen name="support" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="privacy-policy" />
      <Stack.Screen name="terms-and-conditions" />
    </Stack>
  )
}
