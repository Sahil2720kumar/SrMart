// components/VendorOrderCard.tsx
import { OrderStatus } from "@/types/orders-carts.types";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";


interface VendorOrderCardProps {
  order: {
    id: string;
    order_number: string;
    status: OrderStatus;
    payment_status: string;
    payment_method: string;
    item_count: number;
    total_amount: number;
    created_at: string;
    customers?: {
      first_name: string;
      last_name: string;
    };
    vendors?: {
      store_name: string;
    };
  };
  onPress:()=>void
}

function VendorOrderCard({ order,onPress }: VendorOrderCardProps) {
  // Calculate time ago
  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return orderTime.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Determine priority based on status and time
  const getPriority = (status: OrderStatus, createdAt: string): 'urgent' | 'high' | 'normal' => {
    const diffMins = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / 60000
    );

    // New orders older than 10 minutes are urgent
    if ((status === 'pending' || status === 'confirmed') && diffMins > 10) {
      return 'urgent';
    }

    // New orders within 10 minutes are high priority
    if (status === 'pending' || status === 'confirmed') {
      return 'high';
    }

    return 'normal';
  };

  const priority = getPriority(order.status, order.created_at);
  const timeAgo = getTimeAgo(order.created_at);
  const customerName = order.customers
    ? `${order.customers.first_name} ${order.customers.last_name}`
    : 'Customer';

  // Status configuration
  const getStatusConfig = (status: OrderStatus="pending") => {
    const configs = {
      pending: {
        label: 'New Order',
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <Ionicons name="alarm" size={12} color="#991b1b" />,
      },
      confirmed: {
        label: 'New Order',
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: <Ionicons name="alarm" size={12} color="#9a3412" />,
      },
      processing: {
        label: 'Preparing',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Ionicons name="hourglass" size={12} color="#1e40af" />,
      },
      ready_for_pickup: {
        label: 'Ready for Pickup',
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: <Ionicons name="checkmark-circle" size={12} color="#6b21a8" />,
      },
      picked_up: {
        label: 'Picked Up',
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        icon: <Ionicons name="bicycle" size={12} color="#3730a3" />,
      },
      out_for_delivery: {
        label: 'Out for Delivery',
        bg: 'bg-cyan-100',
        text: 'text-cyan-800',
        icon: <Ionicons name="car-sport" size={12} color="#155e75" />,
      },
      delivered: {
        label: 'Completed',
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        icon: <Ionicons name="checkmark-done-circle" size={12} color="#065f46" />,
      },
      cancelled: {
        label: 'Cancelled',
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: <Ionicons name="close-circle" size={12} color="#374151" />,
      },
      refunded: {
        label: 'Refunded',
        bg: 'bg-pink-100',
        text: 'text-pink-800',
        icon: <Ionicons name="arrow-back-circle" size={12} color="#9f1239" />,
      },
    };

    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(order.status);

  // Border and background colors based on priority
  const borderColor =
    priority === 'urgent'
      ? 'border-l-red-500'
      : priority === 'high'
      ? 'border-l-emerald-500'
      : 'border-l-gray-300';

  const bgColor =
    priority === 'urgent'
      ? 'bg-red-50'
      : priority === 'high'
      ? 'bg-emerald-50'
      : 'bg-white';

  // Payment badge
  const paymentBadge = order.payment_status === 'paid' ? (
    <View className="bg-green-100 rounded-full px-2 py-0.5 flex-row items-center gap-1">
      <Ionicons name="checkmark-circle" size={10} color="#065f46" />
      <Text className="text-xs font-semibold text-green-800">Paid</Text>
    </View>
  ) : (
    <View className="bg-orange-100 rounded-full px-2 py-0.5 flex-row items-center gap-1">
      <Ionicons name="cash" size={10} color="#9a3412" />
      <Text className="text-xs font-semibold text-orange-800">COD</Text>
    </View>
  );

  return (
    <TouchableOpacity
      onPress={() => router.push(`/vendor/order/${order.id}`)}
      className={`flex-row items-center justify-between p-4 border-l-4 ${borderColor} ${bgColor} rounded-xl mb-3 shadow-sm`}
      activeOpacity={0.7}
    >
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-2 mb-2 flex-wrap">
          <Text className="font-bold text-gray-900 text-sm">
            #{order.order_number}
          </Text>
          <View
            className={`${statusConfig.bg} rounded-full px-2 py-1 flex-row items-center gap-1`}
          >
            {statusConfig.icon}
            <Text className={`text-xs font-semibold ${statusConfig.text}`}>
              {statusConfig.label}
            </Text>
          </View>
          {paymentBadge}
        </View>

        {/* Customer Name */}
        <View className="flex-row items-center gap-1 mb-1">
          <Ionicons name="person-outline" size={14} color="#6b7280" />
          <Text className="text-sm text-gray-700 font-medium">
            {customerName}
          </Text>
        </View>

        {/* Items and Time */}
        <View className="flex-row items-center gap-1">
          <Ionicons name="cube-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-500">
            {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
          </Text>
          <Text className="text-xs text-gray-400 mx-1">•</Text>
          <Ionicons name="time-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-500">{timeAgo}</Text>
        </View>

        {/* Urgent badge for old new orders */}
        {priority === 'urgent' && (
          <View className="flex-row items-center gap-1 mt-2">
            <Ionicons name="warning" size={12} color="#dc2626" />
            <Text className="text-xs font-semibold text-red-600">
              Needs Attention!
            </Text>
          </View>
        )}
      </View>

      {/* Right Section */}
      <View className="items-end gap-3 ml-4">
        {/* Total Amount */}
        <View>
          <Text className="text-lg font-bold text-emerald-600">
            ₹{order.total_amount.toFixed(0)}
          </Text>
          <Text className="text-xs text-gray-500">Total</Text>
        </View>

        {/* Details Button */}
        <TouchableOpacity
          className="bg-emerald-500 rounded-lg px-4 py-2 flex-row items-center gap-1 shadow-sm"
          activeOpacity={0.8}
          onPress={onPress}
        >
          <Text className="text-white font-medium text-xs">Details</Text>
          <Feather name="chevron-right" size={12} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default VendorOrderCard;