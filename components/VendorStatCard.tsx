import { Text, View } from "react-native";




function VendorStatCard({ label, value, icon, bgColor, width }: { label: string; value: string; icon: React.ReactNode; bgColor: string, width: number }) {
  return (
    <View
      className={`${bgColor} border border-gray-200 rounded-xl p-4 items-center shadow-sm`}
      style={{ width: (width - 32) / 2 - 6 }}
    >
      <View className="mb-2">{icon}</View>
      <Text className="text-xs text-gray-600 font-medium mb-1 text-center">{label}</Text>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
    </View>
  )
}

export default VendorStatCard