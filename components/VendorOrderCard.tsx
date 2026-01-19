import { Feather, Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Text, TouchableOpacity, View } from "react-native"



function VendorOrderCard({
  orderId,
  customerName,
  items,
  time,
  total,
  status,
  priority,
}: {
  orderId: string
  customerName: string
  items: string
  time: string
  total: string
  status: string
  priority: string
}) {
  const borderColor =
    priority === 'urgent' ? 'border-l-red-500' : priority === 'high' ? 'border-l-emerald-500' : 'border-l-gray-300'
  const bgColor =
    priority === 'urgent' ? 'bg-red-50' : priority === 'high' ? 'bg-emerald-50' : 'bg-white'

  const statusBg =
    status === 'New Order'
      ? 'bg-red-100'
      : status === 'Ready for Pickup'
        ? 'bg-blue-100'
        : 'bg-yellow-100'
  const statusText =
    status === 'New Order'
      ? 'text-red-800'
      : status === 'Ready for Pickup'
        ? 'text-blue-800'
        : 'text-yellow-800'

  const statusIcon =
    status === 'New Order'
      ? <Ionicons name="alarm" size={12} color="#991b1b" />
      : status === 'Ready for Pickup'
        ? <Ionicons name="checkmark-circle" size={12} color="#1e40af" />
        : <Ionicons name="hourglass" size={12} color="#92400e" />

  return (
    <TouchableOpacity onPress={()=>router.push(`/vendor/order/1`)} className={`flex-row items-center justify-between p-4 border-l-4 ${borderColor} ${bgColor} border-b border-gray-100`}>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="font-bold text-gray-900 text-sm">{orderId}</Text>
          <View className={`${statusBg} rounded-full px-2 py-1 flex-row items-center gap-1`}>
            {statusIcon}
            <Text className={`text-xs font-semibold ${statusText}`}>{status}</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1 mb-1">
          <Ionicons name="person-outline" size={14} color="#6b7280" />
          <Text className="text-sm text-gray-700 font-medium">{customerName}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="cube-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-500">{items}</Text>
          <Text className="text-xs text-gray-400 mx-1">•</Text>
          <Ionicons name="time-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-500">{time}</Text>
        </View>
      </View>

      <View className="items-end gap-3 ml-4">
        <View>
          <Text className="text-lg font-bold text-emerald-600">{total}</Text>
          <Text className="text-xs text-gray-500">Total</Text>
        </View>
        <TouchableOpacity className="bg-emerald-500 rounded-lg px-4 py-2 flex-row items-center gap-1 shadow-sm">
          <Text className="text-white font-medium text-xs">Details</Text>
          <Feather name="chevron-right" size={12} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default VendorOrderCard