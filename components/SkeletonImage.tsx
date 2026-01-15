import { View } from "react-native"

export default function SkeletonImage({ size = "medium" }: { size?: "small" | "medium" }) {
  const dimensions = size === "small" ? "w-12 h-12" : "w-24 h-24"
  return (
    <View className={`${dimensions} bg-gray-200 rounded-lg items-center justify-center`}>
      <View className="w-8 h-8 bg-gray-300 rounded-md" />
    </View>
  )
}