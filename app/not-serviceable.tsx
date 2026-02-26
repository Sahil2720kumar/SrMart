// app/not-serviceable.tsx
import { View, Text, Pressable, StatusBar } from "react-native"
import { useRouter } from "expo-router"
import { Svg, Path, Circle, G } from "react-native-svg"

function LocationOffIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={10} r={3} stroke="white" strokeWidth={1.5} />
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3L21 21"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default function NotServiceable() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-green-500">
      <StatusBar barStyle="light-content" backgroundColor="#22c55e" />

      {/* Top wave decoration */}
      <View className="absolute top-0 left-0 right-0 h-72 bg-green-600 rounded-b-[80px] opacity-40" />

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">

        {/* Icon container */}
        <View className="bg-green-600 w-32 h-32 rounded-full items-center justify-center mb-8 shadow-lg">
          <View className="bg-green-700 w-24 h-24 rounded-full items-center justify-center">
            <LocationOffIcon />
          </View>
        </View>

        {/* Heading */}
        <Text className="text-white text-3xl font-bold text-center mb-3 tracking-tight">
          Oops! Outside Our Zone
        </Text>

        {/* Subtext */}
        <Text className="text-green-100 text-base text-center leading-6 mb-2">
          We're not available in your area yet.
        </Text>
        <Text className="text-green-100 text-base text-center leading-6 mb-10">
          We currently serve{" "}
          <Text className="text-white font-bold">Dibrugarh</Text> &{" "}
          <Text className="text-white font-bold">Guwahati</Text>.
          {"\n"}We're expanding soon! 🚀
        </Text>

        {/* Divider */}
        <View className="flex-row items-center w-full mb-10">
          <View className="flex-1 h-px bg-green-400" />
          <Text className="text-green-200 mx-4 text-sm">What can you do?</Text>
          <View className="flex-1 h-px bg-green-400" />
        </View>

        {/* Action buttons */}
        <Pressable
          onPress={() => router.push("/customer/account/my-addresses")}
          className="bg-white w-full py-4 rounded-2xl items-center mb-4 active:opacity-80"
        >
          <Text className="text-green-600 font-bold text-base">
            📍 Change My Address
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          className="border-2 border-white w-full py-4 rounded-2xl items-center active:opacity-80"
        >
          <Text className="text-white font-semibold text-base">
            ← Go Back
          </Text>
        </Pressable>

      </View>

      {/* Bottom note */}
      <View className="pb-10 px-8 items-center">
        <Text className="text-green-200 text-xs text-center">
          Want us in your city? Reach out at{" "}
          <Text className="text-white font-semibold">support@yourapp.com</Text>
        </Text>
      </View>

    </View>
  )
}