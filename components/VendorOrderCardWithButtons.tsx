import { Order, statusConfig } from "@/app/vendor/(tabs)/orders";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";



const VendorOrderCardWithButtons = ({ item }: { item: Order }) => {
  const getActionButtons = (status: string) => {
    switch (status) {
      case 'new':
        return { primary: 'Accept', secondary: 'Reject' };
      case 'preparing':
        return { primary: 'Mark Ready', secondary: null };
      case 'ready':
        return { primary: 'Handover', secondary: null };
      default:
        return { primary: 'View Details', secondary: null };
    }
  };

  const config = statusConfig[item.status];
  const actions = getActionButtons(item.status);
  return (
    <TouchableOpacity onPress={()=>router.push(`/vendor/order/${item.id}`)} className="bg-white rounded-2xl p-4 mb-3 shadow-md border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{item.id}</Text>
          <Text className="text-sm text-gray-600 mt-1">{item.customer}</Text>
        </View>
        <View className={`${config.badge} rounded-full px-3 py-1`}>
          <Text className="text-white text-xs font-semibold">{config.label}</Text>
        </View>
      </View>

      {/* Details Row */}
      <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-100">
        <View>
          <Text className="text-xs text-gray-600 mb-1">Items</Text>
          <Text className="text-base font-bold text-gray-900">{item.items}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-600 mb-1">Amount</Text>
          <Text className="text-base font-bold text-emerald-600">₹{item.amount}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-600 mb-1">Time</Text>
          <Text className="text-sm text-gray-900">{item.time}</Text>
        </View>
        <View>
          <Text className="text-xs text-gray-600 mb-1">Payment</Text>
          <Text className={`text-sm font-semibold ${item.payment === 'Paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
            {item.payment}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-1 bg-emerald-500 rounded-xl py-3 items-center justify-center"
        >
          <Text className="text-white font-bold text-sm">{actions.primary}</Text>
        </TouchableOpacity>
        {actions.secondary && (
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-1 bg-gray-100 rounded-xl py-3 items-center justify-center border border-gray-300"
          >
            <Text className="text-gray-700 font-bold text-sm">{actions.secondary}</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
};

export default VendorOrderCardWithButtons