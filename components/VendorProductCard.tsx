import { Product } from "@/types/categories-products.types";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { View } from "react-native";
import { Image } from 'expo-image';


const VendorProductCard = ({ item }: { item: Product & { categories: { name: string } } }) => {
  const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

  const getStockColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-emerald-100 text-emerald-700';
      case 'low_stock':
        return 'bg-orange-100 text-orange-700';
      case 'out_of_stock':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStockLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Disabled';
    }
  };


  return (
    <TouchableOpacity onPress={() => router.push(`/vendor/product/${item.id}`)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 overflow-hidden">
      {/* Product Image & Info Header */}
      <View className="flex-row gap-3 mb-3">
        <View className="w-20 h-20 rounded-xl overflow-hidden">
          <Image
            source={item.image}
            placeholder={{blurhash}}
            contentFit="cover"
            transition={1000}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-sm text-gray-600 mb-2">{item.categories.name}</Text>
          <Text className="text-lg font-bold text-emerald-600">₹{item.discount_price}</Text>
        </View>
      </View>

      {/* Stock Status */}
      <View className="mb-3 pb-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xs text-gray-600 mb-1">Stock Level</Text>
          <Text className="text-base font-semibold text-gray-900">
            {item.stock_quantity} units
          </Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${getStockColor(item.stock_status)}`}>
          <Text className={`text-xs font-semibold ${getStockColor(item.stock_status).split(' ')[1]}`}>
            {getStockLabel(item.stock_status)}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => router.push(`/vendor/product/edit/${item.id}`)}
          activeOpacity={0.7}
          className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 items-center justify-center flex-row gap-2"
        >
          <Feather name="edit-2" size={16} color="#059669" />
          <Text className="text-emerald-700 font-semibold text-sm">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/vendor/inventory")}
          activeOpacity={0.7}
          className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-2.5 items-center justify-center flex-row gap-2"
        >
          <Feather name="refresh-cw" size={16} color="#2563eb" />
          <Text className="text-blue-700 font-semibold text-sm">Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            item.is_available = !item.is_available
          }}
          className={`px-3 py-1 rounded-full flex-row items-center gap-2 ${item.is_available ? "bg-green-100" : "bg-gray-100"}`}
        >
          <Feather
            name={item.is_available ? "check-circle" : "x-circle"}
            size={16}
            color={item.is_available ? "#16a34a" : "#6b7280"}
          />
          <Text className="text-xs font-medium">
            {item.is_available ? "Active" : "Inactive"}
          </Text>
        </TouchableOpacity>

      </View>
    </TouchableOpacity>
  )
}

export default VendorProductCard