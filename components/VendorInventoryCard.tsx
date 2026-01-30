import { useUpdateProductStockToOutOfStock } from "@/hooks/queries";
import { blurhash, Product } from "@/types/categories-products.types";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { View } from "react-native";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";


interface VendorInventoryCardProps {
  item: Product & {
    categories: {
      name: string;
    } | null;
    sub_categories: {
      name: string
    } | null
  }
  handleOpenUpdateModal: (item: Product) => void
  updateLoading?: boolean
  setUpdateLoading?: (updateLoading: boolean) => void
}


const VendorInventoryCard = ({ item, handleOpenUpdateModal, updateLoading, setUpdateLoading }: VendorInventoryCardProps) => {

    // Stock update mutation
    const updateStockToOutOfStockMutation = useUpdateProductStockToOutOfStock();

  const handleMarkOutOfStock = async (item: Product) => {
    Alert.alert(
      'Mark Out of Stock',
      `Mark ${item.name} as out of stock?`,
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStockToOutOfStockMutation.mutateAsync({
                productId: item.id,
              });
              Alert.alert('Updated', `${item.name} marked as out of stock`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update status');
            } finally {
              //do something
            }
          },
        },
      ]
    );
  };

  const getStockStatusColor = (status: string) => {
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

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };


  return (
    <TouchableOpacity onPress={() => router.push(`/vendor/product/${item.id}`)} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      {/* Product Header */}
      <View className="flex-row gap-3 mb-4">
        <View className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl items-center justify-center">
          <Image
            source={item.image}
            placeholder={{ blurhash:blurhash }}
            contentFit="cover"
            transition={1000}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-base font-bold text-gray-900">{item.name}</Text>
          <Text className="text-sm text-gray-600 mt-1">{item?.categories?.name || "category"}</Text>
        </View>
      </View>

      {/* Stock Info */}
      <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <View>
          <Text className="text-xs text-gray-600 mb-1">Current Stock</Text>
          <Text className="text-2xl font-bold text-gray-900">{item.stock_quantity} ({item.unit})</Text>
        </View>
        <View className={`rounded-full px-3 py-1.5 ${getStockStatusColor(item.stock_status)}`}>
          <Text className={`text-xs font-semibold`}>
            {getStockStatusLabel(item.stock_status)}
          </Text>
        </View>
      </View>

      {/* Low Stock Threshold Info */}
      <View className="mb-3 pb-3 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-600">Low Stock Threshold</Text>
          <Text className="text-sm font-semibold text-gray-900">{item.low_stock_threshold} units</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row gap-2 mb-3">
        {/* <TouchableOpacity
        onPress={() => handleDecreaseStock(item)}
        activeOpacity={0.7}
        className="bg-red-50 border border-red-200 rounded-lg p-2.5 items-center justify-center"
      >
        <Feather name="chevron-down" size={18} color="#dc2626" />
      </TouchableOpacity> */}

        <TouchableOpacity
          onPress={() => handleOpenUpdateModal(item)}
          disabled={updateLoading}
          activeOpacity={0.7}
          className={`flex-1 bg-emerald-50 border border-emerald-200 rounded-lg py-2.5 items-center justify-center ${updateLoading ? 'opacity-50' : ''}`}
        >
          {updateLoading ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <Text className="text-emerald-700 font-semibold text-sm">Update</Text>
          )}
        </TouchableOpacity>

        {/* <TouchableOpacity
        onPress={() => handleIncreaseStock(item)}
        activeOpacity={0.7}
        className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 items-center justify-center"
      >
        <Feather name="chevron-up" size={18} color="#059669" />
      </TouchableOpacity> */}

        <TouchableOpacity
          onPress={() => handleMarkOutOfStock(item)}
          activeOpacity={0.7}
          className=" border border-gray-200 rounded-lg p-2.5 items-center justify-center bg-red-400"
        >
          <Feather name='alert-circle' size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
};

export default VendorInventoryCard