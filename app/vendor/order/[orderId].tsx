import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Toast from 'react-native-toast-message';
import {
  useOrderDetail,
  useVendorAcceptOrder,
  useVendorRejectOrder,
  useMarkOrderReady,
  useAssignDeliveryPartner,
  useAvailableDeliveryPartners,
  useVendorCancelOrderItem,
} from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import { DeliveryBoy } from '@/types/users.types';
import { Image } from 'expo-image';
import { blurhash } from '@/types/categories-products.types';
import SelectDeliveryPartnerBottomSheet from '@/components/SelectDeliveryPartnerBottomSheet ';
import RejectOrderModal from '@/components/RejectOrderModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const statusConfig = {
  pending:          { label: 'Pending',          color: 'bg-gray-500'    },
  confirmed:        { label: 'New',              color: 'bg-orange-500'  },
  processing:       { label: 'Preparing',        color: 'bg-blue-500'    },
  ready_for_pickup: { label: 'Ready',            color: 'bg-purple-500'  },
  assigned:         { label: 'Partner Assigned', color: 'bg-indigo-500'  },
  picked_up:        { label: 'Picked Up',        color: 'bg-indigo-500'  },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-500'    },
  delivered:        { label: 'Completed',        color: 'bg-emerald-500' },
  cancelled:        { label: 'Cancelled',        color: 'bg-red-500'     },
  refunded:         { label: 'Refunded',         color: 'bg-pink-500'    },
};

const CANCEL_REASONS = [
  'Out of stock',
  'Item unavailable',
  'Quality issue',
  'Pricing error',
  'Other',
];

const ITEM_CANCELLABLE_STATUSES = ['pending', 'confirmed', 'processing'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function VendorOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { session } = useAuthStore();

  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [showRejectModal, setShowRejectModal]     = useState(false);
  const [selectedPartner, setSelectedPartner]     = useState<DeliveryBoy | null>(null);

  const [acceptModal, setAcceptModal]       = useState(false);
  const [markReadyModal, setMarkReadyModal] = useState(false);

  const [cancelItemModal, setCancelItemModal]           = useState(false);
  const [cancellingItem, setCancellingItem]             = useState<{ id: string; name: string } | null>(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason]     = useState('');

  // ─── Queries & Mutations ───────────────────────────────────────────────────

  const { data: order, isLoading, error } = useOrderDetail(orderId);

  const { data: deliveryPartners } = useAvailableDeliveryPartners(
    order?.vendors
      ? { latitude: order.vendors.latitude || 0, longitude: order.vendors.longitude || 0 }
      : undefined
  );

  const acceptMutation        = useVendorAcceptOrder();
  const rejectMutation        = useVendorRejectOrder();
  const markReadyMutation     = useMarkOrderReady();
  const assignPartnerMutation = useAssignDeliveryPartner();
  const cancelItemMutation    = useVendorCancelOrderItem();

  // ─── Item cancellation ────────────────────────────────────────────────────

  const handleCancelItemPress = (itemId: string, itemName: string) => {
    setCancellingItem({ id: itemId, name: itemName });
    setSelectedCancelReason('');
    setCustomCancelReason('');
    setCancelItemModal(true);
  };

  const handleConfirmCancelItem = () => {
    if (!cancellingItem) return;

    const reason = selectedCancelReason === 'Other'
      ? customCancelReason.trim()
      : selectedCancelReason;

    if (!reason) {
      Toast.show({ type: 'error', text1: 'Select a reason', position: 'top' });
      return;
    }

    cancelItemMutation.mutate(
      { orderId, orderItemId: cancellingItem.id, reason },
      {
        onSuccess: (data) => {
          const itemName = cancellingItem.name;
          setCancelItemModal(false);
          setCancellingItem(null);
          Toast.show({
            type:  'success',
            text1: data.order_cancelled ? 'Order Cancelled' : 'Item Cancelled',
            text2: data.order_cancelled
              ? 'All items were cancelled — order is now cancelled.'
              : `"${itemName}" has been removed from the order.`,
            position: 'top',
          });
          if (data.order_cancelled) router.back();
        },
        onError: (err: any) => {
          Toast.show({
            type:  'error',
            text1: 'Failed to cancel item',
            text2: err.message || 'Please try again.',
            position: 'top',
          });
        },
      }
    );
  };

  // ─── Order-level actions ───────────────────────────────────────────────────

  const handleAcceptOrder = () => setAcceptModal(true);
  const handleMarkReady   = () => setMarkReadyModal(true);
  const handleRejectOrder = () => setShowRejectModal(true);

  const handleConfirmAcceptOrder = () => {
    acceptMutation.mutate(orderId, {
      onSuccess: () => {
        setAcceptModal(false);
        Toast.show({ type: 'success', text1: 'Order accepted!', position: 'top' });
      },
      onError: (error: any) => {
        setAcceptModal(false);
        Toast.show({ type: 'error', text1: 'Error', text2: error.message, position: 'top' });
      },
    });
  };

  const handleConfirmReject = (reason: string) => {
    rejectMutation.mutate(
      { orderId, reason },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success', text1: 'Order rejected',
            text2: 'Customer has been notified.', position: 'top',
          });
          router.back();
        },
        onError: (error: any) => {
          Toast.show({
            type: 'error', text1: 'Error',
            text2: error.message || 'Failed to reject order.', position: 'top',
          });
        },
      }
    );
  };

  // ✅ UPDATED: shows ready_count / total_count feedback
  const handleConfirmMarkReady = () => {
    markReadyMutation.mutate(orderId, {
      onSuccess: (data: any) => {
        setMarkReadyModal(false);

        // data may be undefined if hook doesn't return it — safe fallback
        const readyCount = data?.ready_count;
        const totalCount = data?.total_count;
        const allReady   = data?.all_ready;

        if (allReady) {
          Toast.show({
            type:  'success',
            text1: 'All vendors ready! 🎉',
            text2: 'Delivery partner is being assigned.',
            position: 'top',
          });
        } else if (readyCount != null && totalCount != null) {
          Toast.show({
            type:  'success',
            text1: 'Order marked as ready ✓',
            text2: `${readyCount} of ${totalCount} vendors ready. Waiting for others.`,
            position: 'top',
          });
        } else {
          Toast.show({
            type:  'success',
            text1: 'Order marked as ready!',
            position: 'top',
          });
        }
      },
      onError: (error: any) => {
        setMarkReadyModal(false);
        Toast.show({ type: 'error', text1: 'Error', text2: error.message, position: 'top' });
      },
    });
  };

  const handleAssignPartner = () => {
    if (!selectedPartner) {
      Toast.show({ type: 'error', text1: 'Select a delivery partner', position: 'top' });
      return;
    }
    assignPartnerMutation.mutate(
      { orderId, deliveryBoyId: selectedPartner.user_id },
      {
        onSuccess: () => {
          Toast.show({ type: 'success', text1: 'Delivery partner assigned!', position: 'top' });
          setShowDeliverySheet(false);
        },
        onError: (error: any) => {
          Toast.show({ type: 'error', text1: 'Error', text2: error.message, position: 'top' });
        },
      }
    );
  };

  const handleCall = (phoneNo?: string) => {
    if (phoneNo) Linking.openURL(`tel:+91${phoneNo}`);
  };

  const getActionButtons = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'pending':
        return [
          { label: 'Accept Order', style: 'bg-emerald-500', action: handleAcceptOrder, loading: acceptMutation.isPending },
          { label: 'Reject Order', style: 'bg-red-500',     action: handleRejectOrder, loading: rejectMutation.isPending },
        ];
      case 'processing':
        return [
          { label: 'Mark as Ready', style: 'bg-purple-500', action: handleMarkReady, loading: markReadyMutation.isPending },
        ];
      default:
        return [];
    }
  };

  // ─── Loading / Error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Text className="text-red-600 text-center mb-4">Error loading order details</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-green-500 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Derived values ────────────────────────────────────────────────────────

  const config         = statusConfig[order.status as keyof typeof statusConfig];
  const actions        = getActionButtons(order.status);
  const canCancelItems = ITEM_CANCELLABLE_STATUSES.includes(order.status);

  const allItems       = order.order_items || [];
  const activeItems    = allItems.filter((i) => (i as any).status !== 'cancelled');
  const cancelledItems = allItems.filter((i) => (i as any).status === 'cancelled');
  const totalItems     = activeItems.reduce((sum, i) => sum + i.quantity, 0);

  const itemsTotal = (order.subtotal != null && Number(order.subtotal) > 0)
    ? Number(order.subtotal)
    : activeItems.reduce((sum, item) => sum + item.total_price, 0);

  const totalCommission = (order.total_commission != null)
    ? Number(order.total_commission)
    : activeItems.reduce((sum, item) => sum + ((item as any).commission_amount ?? 0), 0);

  const vendorPayout = (order.vendor_payout != '0.00')
    ? Number(order.vendor_payout)
    : itemsTotal - totalCommission;

  // ✅ Is a delivery partner already broadcasting / assigned for this order's group?
  const hasPartnerAssigned = !!order.delivery_boys;
  const isPartnerBroadcasting = !hasPartnerAssigned && 
    ['assigned', 'ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(order.status);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Order Details', headerBackTitle: 'Orders' }} />

      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">{order.order_number}</Text>
          <Text className="text-sm text-gray-600 mt-1">
            {new Date(order.created_at).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        <View className={`${config?.color ?? 'bg-gray-500'} rounded-full px-3 py-2`}>
          <Text className="text-white text-xs font-semibold">{config?.label ?? order.status}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        {/* ✅ NEW: Multi-vendor info banner */}
        {order.order_group_id && (
          <View className="bg-indigo-50 border border-indigo-200 mx-4 mt-4 rounded-2xl p-4">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-indigo-100 rounded-full items-center justify-center">
                <Feather name="layers" size={16} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-indigo-900 text-sm">
                  Multi-vendor order
                </Text>
                <Text className="text-indigo-700 text-xs mt-0.5">
                  {order.status === 'processing'
                    ? 'Prepare your items. Delivery partner searching while you cook.'
                    : order.status === 'ready_for_pickup'
                    ? 'Your items are ready. Partner will collect when they arrive.'
                    : order.status === 'assigned'
                    ? 'Partner assigned and heading to vendors.'
                    : order.status === 'picked_up' || order.status === 'out_for_delivery'
                    ? 'Partner has collected items and is delivering.'
                    : 'Part of a group order with multiple vendors.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Summary */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">ORDER SUMMARY</Text>

          <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
            <Text className="text-gray-600 text-sm">Payment Method</Text>
            <Text className={`font-semibold text-sm ${
              order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
            }`}>
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
            <Text className="text-gray-600 text-sm">Customer Pays</Text>
            <Text className="text-base font-bold text-gray-900">
              ₹{Number(order.total_amount).toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center pt-3">
            <Text className="text-green-700 text-sm font-semibold">You Receive</Text>
            <Text className="text-2xl font-bold text-green-600">₹{vendorPayout.toFixed(2)}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">CUSTOMER INFO</Text>

          <View className="flex-row items-center pb-3 border-b border-gray-100 mb-3">
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3 overflow-hidden">
              {order.customers?.profile_image ? (
                <Image
                  source={order.customers.profile_image}
                  placeholder={{ blurhash }}
                  contentFit="cover"
                  transition={1000}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold text-sm">
                {order.customers?.first_name} {order.customers?.last_name}
              </Text>
              <Text className="text-gray-600 text-xs mt-1">Customer</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleCall(order.customers?.users?.phone)}
            className="flex-row items-center gap-3 bg-blue-50 rounded-xl p-3"
          >
            <Feather name="phone" size={18} color="#2563eb" />
            <Text className="text-blue-700 font-semibold text-sm flex-1">Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">DELIVERY ADDRESS</Text>
          <View className="flex-row items-start gap-2">
            <Feather name="map-pin" size={18} color="#6b7280" />
            <View className="flex-1">
              <Text className="text-gray-600 text-xs mb-1">
                {order.customer_addresses?.label || 'Home'}
              </Text>
              <Text className="text-gray-900 font-semibold text-sm leading-5">
                {order.customer_addresses?.address_line1}
                {order.customer_addresses?.address_line2 &&
                  `, ${order.customer_addresses.address_line2}`}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {order.customer_addresses?.city}, {order.customer_addresses?.state} -{' '}
                {order.customer_addresses?.pincode}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-600">ITEMS ({totalItems})</Text>
            {canCancelItems && activeItems.length > 0 && (
              <Text className="text-xs text-orange-500 font-medium">Tap × to cancel an item</Text>
            )}
          </View>

          {/* Active items */}
          {activeItems.map((item, index) => (
            <View
              key={item.id}
              className={`flex-row items-center py-3 ${
                index !== activeItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="w-14 h-14 bg-gray-100 rounded-xl mr-3 overflow-hidden">
                {item.product_image ? (
                  <Image
                    source={item.product_image}
                    placeholder={{ blurhash }}
                    contentFit="cover"
                    transition={1000}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Text className="text-2xl">📦</Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
                  {item.product_name}
                </Text>
                <Text className="text-gray-600 text-xs mt-1">
                  ₹{item.discount_price || item.unit_price} × {item.quantity}
                </Text>
                {(item as any).commission_rate ? (
                  <Text className="text-orange-600 text-xs mt-0.5">
                    Commission: {(item as any).commission_rate}%
                  </Text>
                ) : null}
              </View>

              <View className="items-end gap-1">
                <Text className="text-gray-900 font-bold text-sm">
                  ₹{Number(item.total_price).toFixed(2)}
                </Text>
                {(item as any).commission_amount > 0 ? (
                  <Text className="text-orange-600 text-xs">
                    -₹{Number((item as any).commission_amount).toFixed(2)}
                  </Text>
                ) : null}

                {canCancelItems && (
                  <TouchableOpacity
                    onPress={() => handleCancelItemPress(item.id, item.product_name ?? '')}
                    disabled={cancelItemMutation.isPending}
                    className="mt-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex-row items-center gap-1"
                    activeOpacity={0.7}
                    style={{ opacity: cancelItemMutation.isPending ? 0.5 : 1 }}
                  >
                    <Feather name="x" size={11} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-semibold">Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* Cancelled items */}
          {cancelledItems.length > 0 && (
            <View className="mt-3 pt-3 border-t border-dashed border-gray-200">
              <Text className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
                Cancelled Items ({cancelledItems.length})
              </Text>
              {cancelledItems.map((item) => (
                <View key={item.id} className="flex-row items-center py-2 opacity-50">
                  <View className="w-10 h-10 bg-gray-100 rounded-lg mr-3 overflow-hidden">
                    {item.product_image ? (
                      <Image
                        source={item.product_image}
                        placeholder={{ blurhash }}
                        contentFit="cover"
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-lg">📦</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-sm line-through" numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      ₹{item.discount_price || item.unit_price} × {item.quantity}
                    </Text>
                  </View>
                  <View className="bg-red-100 rounded-lg px-2 py-1">
                    <Text className="text-red-500 text-xs font-semibold">Cancelled</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ✅ UPDATED: Delivery Partner section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">DELIVERY PARTNER</Text>

          {order.delivery_boys ? (
            // Partner assigned — show partner details
            <View>
              <View className="flex-row items-center">
                <View className="relative">
                  {order.delivery_boys.profile_photo ? (
                    <View className="w-16 h-16 rounded-2xl border-2 border-green-400 overflow-hidden">
                      <Image
                        source={order.delivery_boys.profile_photo}
                        placeholder={{ blurhash }}
                        contentFit="cover"
                        transition={1000}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </View>
                  ) : (
                    <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center border-2 border-green-200">
                      <Text className="text-green-800 text-2xl font-bold">
                        {order.delivery_boys.first_name.charAt(0).toUpperCase()}
                        {order.delivery_boys.last_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-gray-900 font-bold text-lg mb-1">
                    {order.delivery_boys.first_name} {order.delivery_boys.last_name}
                  </Text>
                  {order.delivery_boys.rating ? (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text className="text-gray-700 text-sm font-semibold ml-1">
                        {order.delivery_boys.rating.toFixed(1)}
                      </Text>
                      <Text className="text-gray-400 text-xs ml-1">
                        ({order.delivery_boys.review_count || 0} reviews)
                      </Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="motorbike" size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-xs font-medium ml-1.5">
                      {order.delivery_boys.vehicle_number}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  className="w-12 h-12 rounded-full items-center justify-center"
                  onPress={() => handleCall(order.delivery_boys?.users?.phone)}
                  activeOpacity={0.8}
                >
                  <Feather name="phone" size={18} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
                      <MaterialCommunityIcons
                        name={
                          order.status === 'delivered'        ? 'check-circle'   :
                          order.status === 'out_for_delivery' ? 'truck-delivery' :
                          order.status === 'picked_up'        ? 'truck-delivery' :
                          'clipboard-check'
                        }
                        size={16}
                        color="#10B981"
                      />
                    </View>
                    <View>
                      <Text className="text-gray-500 text-xs uppercase tracking-wide">Status</Text>
                      <Text className="text-gray-900 font-semibold text-sm mt-0.5">
                        {order.status === 'delivered'        ? 'Delivered ✓'  :
                         order.status === 'out_for_delivery' ? 'Out for delivery' :
                         order.status === 'picked_up'        ? 'Picked up'    :
                         'On the way to you'}
                      </Text>
                    </View>
                  </View>

                  {order.delivery_otp && order.status !== 'delivered' && (
                    <View className="bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                      <View className="flex-row items-center mb-1">
                        <Ionicons name="lock-closed" size={12} color="#059669" />
                        <Text className="text-green-700 text-xs font-semibold ml-1 uppercase tracking-wide">
                          Delivery OTP
                        </Text>
                      </View>
                      <Text className="text-green-900 font-bold text-xl tracking-widest text-center">
                        {order.delivery_otp}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {order.delivery_boys.users?.phone && (
                <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center">
                  <Ionicons name="call-outline" size={14} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-2 font-medium">
                    {order.delivery_boys.users.phone}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // ✅ UPDATED: No partner yet — show searching state
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <View className="flex-row items-center gap-3">
                <ActivityIndicator size="small" color="#d97706" />
                <View className="flex-1">
                  <Text className="font-bold text-amber-900 text-sm">
                    Searching for delivery partner...
                  </Text>
                  <Text className="text-amber-700 text-xs mt-1">
                    A partner will be assigned automatically. You can start preparing now.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Vendor Earnings Breakdown */}
        <View className="bg-white mx-4 mt-4 mb-2 rounded-2xl p-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-3">YOUR EARNINGS</Text>

          <View className="pb-3 border-b border-gray-100 gap-1">
            <View className="flex-row justify-between py-1">
              <Text className="text-gray-600 text-sm">Items Total</Text>
              <Text className="text-gray-900 font-semibold text-sm">₹{itemsTotal.toFixed(2)}</Text>
            </View>

            {Number(order.discount) > 0 && (
              <View className="flex-row justify-between py-1">
                <View className="flex-row items-center gap-1">
                  <Text className="text-gray-600 text-sm">Your Product Discount</Text>
                  <Feather name="info" size={12} color="#9ca3af" />
                </View>
                <Text className="text-orange-600 font-semibold text-sm">
                  -₹{Number(order.discount).toFixed(2)}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between py-1">
              <View className="flex-row items-center gap-1">
                <Text className="text-gray-600 text-sm">Platform Commission</Text>
                <Feather name="info" size={12} color="#9ca3af" />
              </View>
              <Text className="text-red-600 font-semibold text-sm">
                -₹{totalCommission.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between pt-3 bg-green-50 -mx-4 -mb-4 px-4 py-4 rounded-b-2xl">
            <Text className="text-green-700 font-bold text-base">Your Payout</Text>
            <Text className="text-green-700 font-bold text-xl">₹{vendorPayout.toFixed(2)}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-blue-50 mx-4 mt-4 mb-6 rounded-2xl p-4 border border-blue-200">
          <View className="flex-row items-start gap-3">
            <Feather name="info" size={18} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-blue-900 font-semibold text-sm mb-2">
                Note on Customer's Total
              </Text>
              <Text className="text-blue-700 text-xs leading-5">
                Customer paid ₹{Number(order.total_amount).toFixed(2)}, which includes delivery
                fees (₹{Number(order.delivery_fee_paid_by_customer).toFixed(2)}) and platform coupons (₹
                {Number(order.coupon_discount).toFixed(2)}) that are not deducted from your earnings.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Action Buttons */}
      {actions.length > 0 && (
        <View className="bg-white px-4 py-4 border-t border-gray-200">
          <View className="flex-row gap-3">
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.action}
                disabled={action.loading}
                className={`flex-1 ${action.style} rounded-xl py-4 items-center justify-center`}
                style={{ opacity: action.loading ? 0.6 : 1 }}
              >
                {action.loading
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-bold text-base">{action.label}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Blur overlay */}
      {(showDeliverySheet || showRejectModal || acceptModal || markReadyModal || cancelItemModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* ══════════════════════════ MODALS ══════════════════════════════════ */}

      {/* Cancel Item Modal */}
      <Modal
        visible={cancelItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => !cancelItemMutation.isPending && setCancelItemModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            activeOpacity={1}
            onPress={() => !cancelItemMutation.isPending && setCancelItemModal(false)}
          />
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />

            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Feather name="x-circle" size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Cancel Item</Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {cancellingItem?.name}
                </Text>
              </View>
            </View>

            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Why are you cancelling this item?
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-4">
              {CANCEL_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedCancelReason(reason)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCancelReason === reason
                      ? 'bg-red-500 border-red-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-sm font-medium ${
                    selectedCancelReason === reason ? 'text-white' : 'text-gray-700'
                  }`}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedCancelReason === 'Other' && (
              <TextInput
                value={customCancelReason}
                onChangeText={setCustomCancelReason}
                placeholder="Describe the reason..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                className="border border-gray-200 rounded-xl p-3 text-gray-900 text-sm mb-4"
                style={{ textAlignVertical: 'top', minHeight: 80 }}
              />
            )}

            <View className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5 flex-row items-start gap-2">
              <Feather name="alert-triangle" size={14} color="#f97316" style={{ marginTop: 1 }} />
              <Text className="text-orange-700 text-xs leading-5 flex-1">
                The customer will be notified. If this is the only active item, the entire order
                will be cancelled.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirmCancelItem}
              disabled={
                cancelItemMutation.isPending ||
                !selectedCancelReason ||
                (selectedCancelReason === 'Other' && !customCancelReason.trim())
              }
              className="bg-red-500 py-4 rounded-xl items-center justify-center mb-3"
              style={{
                opacity:
                  cancelItemMutation.isPending ||
                  !selectedCancelReason ||
                  (selectedCancelReason === 'Other' && !customCancelReason.trim())
                    ? 0.5
                    : 1,
              }}
            >
              {cancelItemMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Confirm Cancellation</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCancelItemModal(false)}
              disabled={cancelItemMutation.isPending}
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-gray-700 font-semibold text-base">Keep Item</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Accept Order Modal */}
      <Modal
        visible={acceptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAcceptModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setAcceptModal(false)}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-emerald-100 rounded-full items-center justify-center mb-3">
                <Feather name="check-circle" size={30} color="#059669" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Accept Order?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                Are you sure you want to accept this order?
              </Text>
            </View>
            <TouchableOpacity
              className="bg-emerald-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={handleConfirmAcceptOrder}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Accept</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
              onPress={() => setAcceptModal(false)}
              disabled={acceptMutation.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mark as Ready Modal */}
      <Modal
        visible={markReadyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkReadyModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setMarkReadyModal(false)}
        >
          <Pressable className="bg-white rounded-3xl p-6 w-full">
            <View className="items-center mb-5">
              <View className="w-16 h-16 bg-purple-100 rounded-full items-center justify-center mb-3">
                <Feather name="package" size={30} color="#7c3aed" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Mark as Ready?</Text>
              <Text className="text-sm text-gray-500 text-center leading-5">
                {order.order_group_id
                  ? 'Confirm your items are packed and ready for pickup by the delivery partner.'
                  : 'Is the order ready for pickup?'}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-purple-500 py-4 rounded-xl items-center justify-center mb-3"
              onPress={handleConfirmMarkReady}
              disabled={markReadyMutation.isPending}
            >
              {markReadyMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Yes, Ready</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              className="border-2 border-gray-200 py-4 rounded-xl items-center justify-center"
              onPress={() => setMarkReadyModal(false)}
              disabled={markReadyMutation.isPending}
            >
              <Text className="text-gray-700 font-semibold text-base">Not Yet</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <RejectOrderModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleConfirmReject}
        isLoading={rejectMutation.isPending}
        orderNumber={order?.order_number}
      />

      <SelectDeliveryPartnerBottomSheet
        isVisible={showDeliverySheet}
        partners={deliveryPartners || []}
        selectedPartner={selectedPartner}
        onSelectPartner={setSelectedPartner}
        onClose={() => setShowDeliverySheet(false)}
        onConfirm={handleAssignPartner}
        isLoading={assignPartnerMutation.isPending}
      />
    </SafeAreaView>
  );
}