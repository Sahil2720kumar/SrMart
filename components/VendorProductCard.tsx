import { mockProducts } from "@/app/vendor/(tabs)/products";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { View } from "react-native";



const VendorProductCard = ({ item }: { item: typeof mockProducts[0] }) => {

  const getStockColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-100 text-emerald-700';
      case 'low-stock':
        return 'bg-orange-100 text-orange-700';
      case 'out-of-stock':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStockLabel = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Disabled';
    }
  };


  return (
    <TouchableOpacity onPress={()=>router.push(`/vendor/product/${item.id}`)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 overflow-hidden">
      {/* Product Image & Info Header */}
      <View className="flex-row gap-3 mb-3">
        <View className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl items-center justify-center">
          <Text className="text-3xl">{item.image}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">{item.category}</Text>
          <Text className="text-lg font-bold text-emerald-600">₹{item.price}</Text>
        </View>
      </View>

      {/* Stock Status */}
      <View className="mb-3 pb-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-gray-600 mb-1">Stock Level</Text>
          <Text className="text-base font-semibold text-gray-900">
            {item.stock} units
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${getStockColor(item.status)}`}>
          <Text className={`text-xs font-semibold ${getStockColor(item.status).split(' ')[1]}`}>
            {getStockLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 items-center justify-center flex-row gap-2"
        >
          <Feather name="edit-2" size={16} color="#059669" />
          <Text className="text-emerald-700 font-semibold text-sm">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-2.5 items-center justify-center flex-row gap-2"
        >
          <Feather name="refresh-cw" size={16} color="#2563eb" />
          <Text className="text-blue-700 font-semibold text-sm">Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            item.isActive = !item.isActive
            console.log(item);
          }}
          className={`px-3 py-1 rounded-full flex-row items-center gap-2 ${item.isActive ? "bg-green-100" : "bg-gray-100"}`}
        >
          <Feather
            name={item.isActive ? "check-circle" : "x-circle"}
            size={16}
            color={item.isActive ? "#16a34a" : "#6b7280"}
          />
          <Text className="text-xs font-medium">
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  )
}

export default VendorProductCard