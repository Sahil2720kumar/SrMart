import { Order } from "@/types/order.types"
import { router } from "expo-router"
import { Text, TouchableOpacity, View } from "react-native"

interface OrderCardProps {
  item: Order
  getStatusColor:(status: string) => string
  getStatusText:(status: string) => string
}

const OrderCard = ({ item,getStatusColor,getStatusText }: OrderCardProps) => (
  <TouchableOpacity
    onPress={() => {
      // Navigate to order details - in your app: navigation?.navigate("OrderDetails", { orderId: item.id })
      router.push(`/(tabs)/customer/order/orders/${item.id}`)
    }}
    className="bg-white rounded-2xl p-4 mb-3 mx-4"
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    }}
  >
    {/* Order Header */}
    <View className="flex-row items-center justify-between mb-3">
      <View>
        <Text className="text-base font-bold text-gray-900">{item.orderNumber}</Text>
        <Text className="text-xs text-gray-500 mt-1">
          {item.date} • {item.time}
        </Text>
      </View>
      <View
        className="px-3 py-1 rounded-full"
        style={{ backgroundColor: item.status === "delivered" ? "#dcfce7" : "#dbeafe" }}
      >
        <Text className={`text-xs font-semibold ${getStatusColor(item.status)}`}>
          {getStatusText(item.status)}
        </Text>
      </View>
    </View>

    {/* Order Info */}
    <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
      <View>
        <Text className="text-xs text-gray-500 mb-1">Items</Text>
        <Text className="text-sm font-semibold text-gray-900">{item.itemCount} items</Text>
      </View>
      <View>
        <Text className="text-xs text-gray-500 mb-1">Total Amount</Text>
        <Text className="text-sm font-semibold text-gray-900">${item.totalAmount.toFixed(2)}</Text>
      </View>
      <TouchableOpacity className="bg-green-500 rounded-full px-4 py-2">
        <Text className="text-white text-xs font-semibold">View Details</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
)

export default OrderCard