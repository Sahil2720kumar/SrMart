import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "react-native";
import { View } from "react-native";

function AlertItem({ product, stock, status }: { product: string; stock: string; status: string }) {
  const statusColor = status === 'Critical' ? 'bg-red-100' : 'bg-yellow-100'
  const statusText = status === 'Critical' ? 'text-red-800' : 'text-yellow-800'
  const icon = status === 'Critical'
    ? <Ionicons name="alert-circle" size={16} color="#991b1b" />
    : <Ionicons name="warning" size={16} color="#92400e" />

  return (
    <View className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name="food-variant" size={20} color="#6b7280" />
        <View>
          <Text className="font-medium text-gray-900 text-sm">{product}</Text>
          <Text className="text-xs text-gray-600">{stock} remaining</Text>
        </View>
      </View>
      <View className={`${statusColor} rounded-full px-2 py-1 flex-row items-center gap-1`}>
        {icon}
        <Text className={`text-xs font-semibold ${statusText}`}>{status}</Text>
      </View>
    </View>
  )
}


export default AlertItem