import { useUpdateProductStockToOutOfStock } from "@/hooks/queries";
import { blurhash, Product } from "@/types/categories-products.types";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import Toast from "react-native-toast-message";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VendorInventoryCardProps {
  item: Product & {
    categories: { name: string } | null;
    sub_categories: { name: string } | null;
  };
  handleOpenUpdateModal: (item: Product) => void;
  updateLoading?: boolean;
  setUpdateLoading?: (updateLoading: boolean) => void;
}

// ---------------------------------------------------------------------------
// Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg = confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500';
  const accentBg = confirmStyle === 'danger' ? 'bg-red-500' : 'bg-emerald-500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View className={`h-1 w-full ${accentBg}`} />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const VendorInventoryCard = ({
  item,
  handleOpenUpdateModal,
  updateLoading,
  setUpdateLoading,
}: VendorInventoryCardProps) => {
  const updateStockToOutOfStockMutation = useUpdateProductStockToOutOfStock();
  const [outOfStockModalVisible, setOutOfStockModalVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleConfirmOutOfStock = async () => {
    setOutOfStockModalVisible(false);
    try {
      await updateStockToOutOfStockMutation.mutateAsync({ productId: item.id });
      Toast.show({
        type: 'success',
        text1: 'Stock Updated',
        text2: `${item.name} marked as out of stock.`,
        position: 'top',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update stock status. Please try again.',
        position: 'top',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':   return 'bg-emerald-100 text-emerald-700';
      case 'low_stock':  return 'bg-orange-100 text-orange-700';
      case 'out_of_stock': return 'bg-red-100 text-red-700';
      default:           return 'bg-gray-100 text-gray-700';
    }
  };

  const getStockStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':     return 'In Stock';
      case 'low_stock':    return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default:             return 'Unknown';
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/vendor/product/${item.id}`)}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      >
        {/* Product Header */}
        <View className="flex-row gap-3 mb-4">
          <View className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl items-center justify-center">
            <Image
              source={item.image}
              placeholder={{ blurhash }}
              contentFit="cover"
              transition={1000}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <View className="flex-1 justify-center">
            <Text className="text-base font-bold text-gray-900">{item.name}</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {item?.categories?.name || 'category'}
            </Text>
          </View>
        </View>

        {/* Stock Info */}
        <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <View>
            <Text className="text-xs text-gray-600 mb-1">Current Stock</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {item.stock_quantity} ({item.unit})
            </Text>
          </View>
          <View className={`rounded-full px-3 py-1.5 ${getStockStatusColor(item.stock_status)}`}>
            <Text className="text-xs font-semibold">
              {getStockStatusLabel(item.stock_status)}
            </Text>
          </View>
        </View>

        {/* Low Stock Threshold */}
        <View className="mb-3 pb-3 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-gray-600">Low Stock Threshold</Text>
            <Text className="text-sm font-semibold text-gray-900">
              {item.low_stock_threshold} units
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => handleOpenUpdateModal(item)}
            disabled={updateLoading}
            activeOpacity={0.7}
            className={`flex-1 bg-emerald-50 border border-emerald-200 rounded-lg py-2.5 items-center justify-center ${
              updateLoading ? 'opacity-50' : ''
            }`}
          >
            {updateLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Text className="text-emerald-700 font-semibold text-sm">Update</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setOutOfStockModalVisible(true)}
            disabled={
              updateStockToOutOfStockMutation.isPending ||
              item.stock_status === 'out_of_stock'
            }
            activeOpacity={0.7}
            className={`border border-gray-200 rounded-lg p-2.5 items-center justify-center bg-red-400 ${
              item.stock_status === 'out_of_stock' ? 'opacity-40' : ''
            }`}
          >
            {updateStockToOutOfStockMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="alert-circle" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ── Out of Stock Confirm Modal ── */}
      <ConfirmModal
        visible={outOfStockModalVisible}
        title="Mark Out of Stock"
        message={`Mark "${item.name}" as out of stock? Customers will not be able to order this product until stock is updated.`}
        confirmLabel="Mark Out of Stock"
        confirmStyle="danger"
        loading={updateStockToOutOfStockMutation.isPending}
        onConfirm={handleConfirmOutOfStock}
        onCancel={() => setOutOfStockModalVisible(false)}
      />
    </>
  );
};

export default VendorInventoryCard;