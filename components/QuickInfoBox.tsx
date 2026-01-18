import { Text, View } from "react-native";

function QuickInfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
      <View className="flex-row items-center gap-1 mb-1">
        {icon}
        <Text className="text-xs text-gray-600 font-medium">{label}</Text>
      </View>
      <Text className="text-sm font-bold text-gray-900">{value}</Text>
    </View>
  )
}

export default QuickInfoBox