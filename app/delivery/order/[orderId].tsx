// app/delivery/order/[orderId].tsx
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import DeliveryOTPVerificationModal from '@/components/DeliveryOTPVerificationModal';
import DeliveryConfirmationModal from '@/components/Deliveryconfirmationmodal';
import {
  useDeliveryGroupDetail,
  useAcceptDeliveryGroup,
  useMarkOrderPickedUp,
  useCompleteGroupDelivery,
  useReportCodDeposit,
} from '@/hooks/queries/useDeliveryGroups';

const OrderDetailScreen = () => {
  const router  = useRouter();
  const params  = useLocalSearchParams();
  const groupId = params.orderId as string;

  const store      = useDeliveryStore();
  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;

  const [expandedVendor, setExpandedVendor]         = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal]             = useState(false);
  const [otpInput, setOtpInput]                     = useState('');
  const [showAcceptModal, setShowAcceptModal]       = useState(false);
  const [showPickupModal, setShowPickupModal]       = useState(false);
  const [showDepositModal, setShowDepositModal]     = useState(false);
  const [pickupOrderId, setPickupOrderId]           = useState<string | null>(null);
  const [checkedItems, setCheckedItems]             = useState<Record<string, boolean>>({});

  const {
    data: group,
    isLoading,
    error,
    refetch,
  } = useDeliveryGroupDetail(groupId);

  const acceptMutation        = useAcceptDeliveryGroup();
  const pickupMutation        = useMarkOrderPickedUp();
  const completeMutation      = useCompleteGroupDelivery();
  const reportDepositMutation = useReportCodDeposit();

  // ── Helpers ──────────────────────────────────────────────────────────────

  const toggleItem = (vendorId: string, itemId: string) => {
    const key = `${vendorId}-${itemId}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemChecked = (vendorId: string, itemId: string) =>
    !!checkedItems[`${vendorId}-${itemId}`];

  const allActiveItemsChecked = (vendorId: string) => {
    if (!group) return false;
    const vendor = group.vendors.find((v) => v.vendor_id === vendorId);
    if (!vendor) return false;
    const active = vendor.items.filter((i) => i.status !== 'cancelled');
    if (active.length === 0) return true;
    return active.every((i) => isItemChecked(vendorId, i.id));
  };

  const pickedUpCount = useMemo(() => {
    if (!group) return 0;
    return group.vendors.filter(
      (v) => ['picked_up', 'out_for_delivery', 'delivered'].includes(v.status)
    ).length;
  }, [group]);

  const readyToPickupCount = useMemo(() => {
    if (!group) return 0;
    return group.vendors.filter((v) => v.status === 'ready_for_pickup').length;
  }, [group]);

  const preparingCount = useMemo(() => {
    if (!group) return 0;
    return group.vendors.filter(
      (v) => !['picked_up', 'out_for_delivery', 'delivered', 'ready_for_pickup', 'cancelled']
        .includes(v.status)
    ).length;
  }, [group]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAccept = async () => {
    if (!group) return;
    try {
      await acceptMutation.mutateAsync(group.id);
      setShowAcceptModal(false);
      Toast.show({ type: 'success', text1: 'Group accepted!', position: 'top' });
      refetch();
    } catch (e: any) {
      setShowAcceptModal(false);
      Toast.show({ type: 'error', text1: e.message, position: 'top' });
    }
  };

  const handlePickupPress = (orderId: string, vendorId: string) => {
    if (!allActiveItemsChecked(vendorId)) {
      Toast.show({
        type:  'error',
        text1: 'Please check off all active items first',
        position: 'top',
      });
      return;
    }
    setPickupOrderId(orderId);
    setShowPickupModal(true);
  };

  const handleConfirmPickup = async () => {
    if (!group || !pickupOrderId) return;
    try {
      await pickupMutation.mutateAsync({ orderId: pickupOrderId, groupId: group.id });
      setShowPickupModal(false);
      setPickupOrderId(null);
      setCheckedItems({});
      Toast.show({ type: 'success', text1: 'Items picked up!', position: 'top' });
      refetch();
    } catch (e: any) {
      setShowPickupModal(false);
      Toast.show({ type: 'error', text1: e.message, position: 'top' });
    }
  };

  const handleVerifyOtp = async () => {
    if (!group) return;
    try {
      await completeMutation.mutateAsync({ groupId: group.id, otp: otpInput });
      setShowOtpModal(false);
      setOtpInput('');
      Toast.show({
        type:  'success',
        text1: 'All delivered!',
        text2: group.payment_method === 'cod'
          ? 'Please deposit cash at the office.'
          : `₹${group.delivery_fee.toFixed(2)} earned`,
        position: 'top',
      });
      refetch();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e.message, position: 'top' });
    }
  };

  const handleConfirmDeposit = async () => {
    if (!group) return;
    try {
      await reportDepositMutation.mutateAsync(group.id);
      setShowDepositModal(false);
      Toast.show({
        type:  'success',
        text1: 'Deposit reported!',
        text2: 'Admin will verify and credit your wallet.',
        position: 'top',
      });
      refetch();
    } catch (e: any) {
      setShowDepositModal(false);
      Toast.show({ type: 'error', text1: e.message, position: 'top' });
    }
  };

  const navigateToVendor = (lat: number | null, lng: number | null) => {
    if (lat && lng)
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const navigateToCustomer = () => {
    const { lat, lng } = group?.customer || {};
    if (lat && lng)
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  // ── Loading / error ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-600">
        <View className="flex-1 items-center justify-center p-6">
          <Feather name="alert-circle" size={40} color="white" />
          <Text className="text-white text-xl font-bold mt-4 mb-2">Group Not Found</Text>
          <TouchableOpacity
            onPress={() => router.replace('/delivery/orders')}
            className="bg-white px-6 py-3 rounded-full mt-4"
          >
            <Text className="text-indigo-600 font-bold">Back to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isUnassigned  = !group.assignment_status || group.assignment_status === 'broadcasting';
  const isAssigned    = group.assignment_status === 'assigned';
  const isDelivering  = group.assignment_status === 'delivering';
  const isCompleted   = group.assignment_status === 'completed';
  const isMultiVendor = group.vendors.length > 1;

  const isCod                = group.payment_method === 'cod';
  const codPending           = group.cod_status === 'pending_deposit';
  const codReported          = group.cod_status === 'deposit_reported';
  const codConfirmed         = group.cod_status === 'deposited';
  const showCodDepositBanner = isCompleted && isCod;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-indigo-600">

      {/* ── Header ── */}
      <View className="px-4 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.replace('/delivery/orders')}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
        >
          <Feather name="arrow-left" size={20} color="white" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-white text-xl font-bold">
            {group.vendors.length} Vendor Group
          </Text>
          <Text className="text-indigo-200 text-xs">
            {group.orders.length} order{group.orders.length !== 1 ? 's' : ''} · ₹{group.delivery_fee.toFixed(2)} payout
          </Text>
        </View>

        <View className={`px-3 py-1.5 rounded-full ${
          isUnassigned   ? 'bg-yellow-500'
          : isAssigned   ? 'bg-blue-500'
          : isDelivering ? 'bg-purple-500'
          : 'bg-green-500'
        }`}>
          <Text className="text-white text-xs font-bold">
            {isUnassigned    ? 'Available'
              : isAssigned   ? 'Assigned'
              : isDelivering ? 'Delivering'
              : 'Completed'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4">

          {/* ── Summary card ── */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Vendors</Text>
                <Text className="font-bold text-gray-900">{group.vendors.length}</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-gray-500 mb-1">Distance</Text>
                <Text className="font-bold text-gray-900">{group.distance.toFixed(1)} km</Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-xl p-3">
                <Text className="text-xs text-green-600 mb-1">Payout</Text>
                <Text className="font-bold text-green-600">
                  ₹{group.delivery_fee.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Financial breakdown */}
            <View className="border-t border-gray-100 pt-3 gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Items subtotal</Text>
                <Text className="text-xs font-semibold text-gray-900">
                  ₹{group.subtotal.toFixed(2)}
                </Text>
              </View>
              {group.vendors.map((v, idx) => (
                <View key={v.order_id} className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs text-gray-500">Delivery — {v.vendor_name}</Text>
                    {isMultiVendor && idx > 0 && (
                      <View className="bg-green-100 px-1.5 py-0.5 rounded-full">
                        <Text className="text-green-700 text-xs font-semibold">50% off</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs font-semibold text-gray-900">
                    {group.is_free_delivery ? 'FREE' : `₹${v.delivery_fee.toFixed(2)}`}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between border-t border-gray-100 pt-1.5 mt-0.5">
                <Text className="text-xs font-bold text-gray-700">Total delivery fee</Text>
                <Text className="text-xs font-bold text-indigo-600">
                  {group.is_free_delivery ? 'FREE' : `₹${group.delivery_fee.toFixed(2)}`}
                </Text>
              </View>
              <View className="flex-row justify-between bg-gray-50 -mx-5 px-5 py-2.5 rounded-b-2xl mt-1">
                <Text className="text-sm font-bold text-gray-900">Order Total</Text>
                <Text className="text-sm font-bold text-gray-900">
                  ₹{group.total_amount.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* COD badge */}
            {isCod && (
              <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex-row items-center">
                <Feather name="alert-circle" size={16} color="#d97706" />
                <Text className="text-amber-700 font-bold text-sm ml-2">
                  COD — Collect ₹{group.total_amount.toFixed(2)} cash on delivery
                </Text>
              </View>
            )}
          </View>

          {/* ── Accept button ── */}
          {isUnassigned && (
            <TouchableOpacity
              onPress={() => setShowAcceptModal(true)}
              disabled={!isVerified || acceptMutation.isPending}
              className={`rounded-3xl p-5 mb-4 shadow-lg ${
                isVerified ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              {acceptMutation.isPending ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold ml-3">Accepting...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Feather name="check-circle" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Accept This Group</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* ── Live status banner when assigned ── */}
          {isAssigned && (
            <View className="bg-white rounded-3xl p-4 mb-4 shadow-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-bold text-gray-900">Pickup Progress</Text>
                <Text className="text-xs font-bold text-indigo-600">
                  {pickedUpCount}/{group.vendors.length} collected
                </Text>
              </View>
              <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                <View
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${(pickedUpCount / group.vendors.length) * 100}%` }}
                />
              </View>

              <View className="flex-row gap-2">
                {pickedUpCount > 0 && (
                  <View className="flex-1 bg-green-50 border border-green-200 rounded-xl p-2.5 items-center">
                    <Text className="text-lg font-bold text-green-700">{pickedUpCount}</Text>
                    <Text className="text-xs text-green-600 font-medium">Collected</Text>
                  </View>
                )}
                {readyToPickupCount > 0 && (
                  <View className="flex-1 bg-purple-50 border border-purple-200 rounded-xl p-2.5 items-center">
                    <Text className="text-lg font-bold text-purple-700">{readyToPickupCount}</Text>
                    <Text className="text-xs text-purple-600 font-medium">Ready now</Text>
                  </View>
                )}
                {preparingCount > 0 && (
                  <View className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-2.5 items-center">
                    <Text className="text-lg font-bold text-amber-700">{preparingCount}</Text>
                    <Text className="text-xs text-amber-600 font-medium">Preparing</Text>
                  </View>
                )}
              </View>

              {readyToPickupCount > 0 && preparingCount > 0 && (
                <View className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex-row items-start gap-2">
                  <Feather name="info" size={14} color="#4f46e5" style={{ marginTop: 1 }} />
                  <Text className="text-xs text-indigo-700 flex-1 leading-5">
                    You can pick up ready orders now while waiting for others to finish preparing.
                    Head to vendors with a <Text className="font-bold">Ready!</Text> badge first.
                  </Text>
                </View>
              )}
              {readyToPickupCount > 0 && preparingCount === 0 && pickedUpCount === 0 && (
                <View className="mt-3 bg-purple-50 border border-purple-100 rounded-xl p-3 flex-row items-center gap-2">
                  <Feather name="check-circle" size={14} color="#7c3aed" />
                  <Text className="text-xs text-purple-700 font-medium">
                    All vendors are ready! Start collecting now.
                  </Text>
                </View>
              )}
              {preparingCount > 0 && readyToPickupCount === 0 && pickedUpCount === 0 && (
                <View className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#d97706" />
                  <Text className="text-xs text-amber-700 font-medium">
                    Vendors are still preparing. Head to them now to save time.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Pickup complete bar for delivering state ── */}
          {isDelivering && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="font-bold text-gray-900 mb-3">Pickup Complete</Text>
              <View className="h-3 bg-green-100 rounded-full overflow-hidden mb-2">
                <View className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </View>
              <Text className="text-xs text-green-600 font-semibold text-center">
                All {group.vendors.length} vendor{group.vendors.length !== 1 ? 's' : ''} collected — now delivering
              </Text>
            </View>
          )}

          {/* ── Vendor pickup stops ── */}
          {!isUnassigned && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-white mb-3">Pickup Stops</Text>

              {group.vendors.map((vendor, idx) => {
                const isPicked          = ['picked_up', 'out_for_delivery', 'delivered'].includes(vendor.status);
                const isVendorReady     = vendor.status === 'ready_for_pickup';
                const isVendorPreparing = !isPicked && !isVendorReady;
                const activeItems       = vendor.items.filter((i) => i.status !== 'cancelled');
                const cancelledItems    = vendor.items.filter((i) => i.status === 'cancelled');
                const allChecked        = allActiveItemsChecked(vendor.vendor_id);

                return (
                  <View
                    key={vendor.order_id}
                    className={`bg-white rounded-3xl p-5 mb-3 shadow-lg ${
                      isVendorReady && !isPicked ? 'border-2 border-purple-300' : ''
                    }`}
                  >
                    {/* Vendor header */}
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          isPicked        ? 'bg-green-100'
                          : isVendorReady ? 'bg-purple-100'
                          : 'bg-indigo-100'
                        }`}>
                          {isPicked ? (
                            <Feather name="check" size={14} color="#22c55e" />
                          ) : (
                            <Text className={`font-bold text-sm ${
                              isVendorReady ? 'text-purple-600' : 'text-indigo-600'
                            }`}>{idx + 1}</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-900">{vendor.vendor_name}</Text>
                          <Text className="text-xs text-gray-500">{vendor.address}</Text>
                          <View className="flex-row items-center gap-1.5 mt-1">
                            <Feather name="truck" size={11} color="#6b7280" />
                            <Text className="text-xs text-gray-500">
                              {group.is_free_delivery
                                ? 'Free delivery'
                                : `Delivery: ₹${vendor.delivery_fee.toFixed(2)}`}
                            </Text>
                            {isMultiVendor && idx > 0 && !group.is_free_delivery && (
                              <View className="bg-green-100 px-1.5 py-0.5 rounded-full">
                                <Text className="text-green-700 text-xs font-semibold">50% off</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs text-gray-400 mt-0.5">
                            {activeItems.length} item{activeItems.length !== 1 ? 's' : ''}
                            {cancelledItems.length > 0 && ` · ${cancelledItems.length} cancelled`}
                          </Text>
                        </View>
                      </View>

                      <View className={`px-3 py-1.5 rounded-full ${
                        isPicked        ? 'bg-green-500'
                        : isVendorReady ? 'bg-purple-500'
                        : 'bg-amber-500'
                      }`}>
                        <Text className="text-white text-xs font-bold">
                          {isPicked        ? 'Collected'
                            : isVendorReady ? 'Ready!'
                            : 'Preparing...'}
                        </Text>
                      </View>
                    </View>

                    {!isPicked && isAssigned && (
                      <TouchableOpacity
                        onPress={() => navigateToVendor(vendor.latitude, vendor.longitude)}
                        className="bg-blue-50 border border-blue-200 py-2.5 rounded-xl mb-3 flex-row items-center justify-center"
                      >
                        <Feather name="navigation" size={16} color="#3b82f6" />
                        <Text className="text-blue-600 font-bold ml-2 text-sm">
                          Navigate to {vendor.vendor_name}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isVendorPreparing && isAssigned && (
                      <View className="flex-row items-center gap-2 py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-100">
                        <ActivityIndicator size="small" color="#d97706" />
                        <View className="flex-1">
                          <Text className="text-amber-800 text-xs font-semibold">Still preparing</Text>
                          <Text className="text-amber-600 text-xs mt-0.5">
                            You can collect other ready orders first
                          </Text>
                        </View>
                      </View>
                    )}

                    {!isPicked && isVendorReady && (
                      <TouchableOpacity
                        onPress={() => setExpandedVendor(
                          expandedVendor === vendor.vendor_id ? null : vendor.vendor_id
                        )}
                        className="flex-row items-center justify-between py-2.5 border-t border-gray-100"
                      >
                        <View className="flex-row items-center gap-2">
                          <Feather name="list" size={14} color="#7c3aed" />
                          <Text className="text-sm font-semibold text-purple-700">
                            {expandedVendor === vendor.vendor_id ? 'Hide items' : 'Check items to collect'}
                          </Text>
                        </View>
                        <Feather
                          name={expandedVendor === vendor.vendor_id ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#7c3aed"
                        />
                      </TouchableOpacity>
                    )}

                    {expandedVendor === vendor.vendor_id && !isPicked && isVendorReady && (
                      <View className="mt-3">
                        {activeItems.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => toggleItem(vendor.vendor_id, item.id)}
                            className="flex-row items-center py-2.5 border-b border-gray-50"
                          >
                            <View className={`w-6 h-6 rounded items-center justify-center mr-3 ${
                              isItemChecked(vendor.vendor_id, item.id) ? 'bg-green-500' : 'bg-gray-200'
                            }`}>
                              {isItemChecked(vendor.vendor_id, item.id) && (
                                <Feather name="check" size={14} color="white" />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text className={`font-semibold text-sm ${
                                isItemChecked(vendor.vendor_id, item.id)
                                  ? 'text-gray-400 line-through'
                                  : 'text-gray-900'
                              }`}>
                                {item.name}
                              </Text>
                              <Text className="text-xs text-gray-400 mt-0.5">{item.qty}</Text>
                            </View>
                            <View className="items-end ml-2">
                              <Text className={`text-sm font-bold ${
                                isItemChecked(vendor.vendor_id, item.id) ? 'text-gray-300' : 'text-gray-900'
                              }`}>
                                ₹{item.total_price.toFixed(2)}
                              </Text>
                              {item.discount_price && item.discount_price > 0 && (
                                <Text className="text-xs text-gray-400 line-through">
                                  ₹{(item.unit_price * item.quantity).toFixed(2)}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}

                        <View className="mt-2 pt-2 border-t border-gray-100 gap-1">
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">
                              {activeItems.length} item{activeItems.length !== 1 ? 's' : ''} subtotal
                            </Text>
                            <Text className="text-xs font-semibold text-gray-900">
                              ₹{activeItems
                                .filter((i) => i.status !== 'cancelled')
                                .reduce((sum, i) => sum + i.total_price, 0)
                                .toFixed(2)}
                            </Text>
                          </View>
                          <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center gap-1">
                              <Text className="text-xs text-gray-500">Delivery fee</Text>
                              {isMultiVendor && idx > 0 && !group.is_free_delivery && (
                                <View className="bg-green-100 px-1 py-0.5 rounded-full">
                                  <Text className="text-green-700 text-xs font-semibold">50% off</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-xs font-semibold text-indigo-600">
                              {group.is_free_delivery ? 'FREE' : `₹${vendor.delivery_fee.toFixed(2)}`}
                            </Text>
                          </View>
                          <View className="flex-row justify-between pt-1 border-t border-gray-100">
                            <Text className="text-xs font-bold text-gray-900">Order total</Text>
                            <Text className="text-sm font-bold text-gray-900">
                              ₹{vendor.total_amount.toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        {cancelledItems.length > 0 && (
                          <View className="mt-2 pt-2 border-t border-dashed border-gray-200">
                            <Text className="text-xs text-red-500 font-semibold mb-2">
                              Do not collect — cancelled by vendor
                            </Text>
                            {cancelledItems.map((item) => (
                              <View key={item.id} className="flex-row items-center py-1.5 opacity-40">
                                <View className="w-6 h-6 bg-red-100 rounded items-center justify-center mr-3">
                                  <Feather name="x" size={12} color="#ef4444" />
                                </View>
                                <Text className="text-gray-500 line-through text-sm flex-1">
                                  {item.name}
                                </Text>
                                <View className="bg-red-100 px-2 py-0.5 rounded-lg">
                                  <Text className="text-red-500 text-xs font-semibold">Cancelled</Text>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {!isPicked && isAssigned && (
                      <TouchableOpacity
                        onPress={() => handlePickupPress(vendor.order_id, vendor.vendor_id)}
                        disabled={!isVendorReady || !allChecked || pickupMutation.isPending}
                        className={`mt-4 py-3 rounded-xl flex-row items-center justify-center ${
                          isVendorReady && allChecked ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        {pickupMutation.isPending ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : !isVendorReady ? (
                          <>
                            <ActivityIndicator size="small" color="#9ca3af" />
                            <Text className="text-gray-500 font-bold ml-2 text-sm">
                              Waiting for vendor...
                            </Text>
                          </>
                        ) : !allChecked ? (
                          <>
                            <Feather name="check-square" size={18} color="#9ca3af" />
                            <Text className="text-gray-500 font-bold ml-2 text-sm">
                              Check all items first
                            </Text>
                          </>
                        ) : (
                          <>
                            <Feather name="check-circle" size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Mark as Picked Up</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Customer delivery section ── */}
          {(isDelivering || isCompleted) && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-white mb-3">Customer Delivery</Text>
              <View className="bg-white rounded-3xl p-5 shadow-lg">
                <View className="flex-row items-start mb-4">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center mr-4">
                    <Feather name="home" size={22} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-green-600 font-bold mb-1">DELIVER TO</Text>
                    <Text className="text-lg font-bold text-gray-900">{group.customer.name}</Text>
                    <Text className="text-sm text-gray-600 mb-1">{group.customer.address}</Text>
                    <Text className="text-sm text-gray-500">📞 {group.customer.phone}</Text>
                  </View>
                </View>

                {!isCompleted && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={navigateToCustomer}
                      className="flex-1 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center"
                    >
                      <Feather name="navigation" size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Navigate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setShowOtpModal(true)}
                      disabled={!isVerified || completeMutation.isPending}
                      className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                        isVerified ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      {completeMutation.isPending ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <>
                          <Feather name="lock" size={18} color="white" />
                          <Text className="text-white font-bold ml-2">Enter OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {isCompleted && (
                  <View className="bg-green-50 p-4 rounded-xl border border-green-200 flex-row items-center justify-center">
                    <Feather name="check-circle" size={20} color="#22c55e" />
                    <Text className="text-green-700 font-bold ml-2">Delivered Successfully</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── COD Deposit Banner ── */}
          {showCodDepositBanner && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-white mb-3">Cash Deposit</Text>

              {/* Pending — needs to deposit */}
              {codPending && (
                <View className="bg-white rounded-3xl p-5 shadow-lg border-2 border-amber-300">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mr-3">
                      <Feather name="dollar-sign" size={20} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">Cash Deposit Required</Text>
                      <Text className="text-xs text-amber-600 mt-0.5">
                        Deposit before end of day
                      </Text>
                    </View>
                    <View className="bg-amber-100 px-2.5 py-1 rounded-full">
                      <Text className="text-amber-700 text-xs font-bold">Pending</Text>
                    </View>
                  </View>

                  <View className="bg-amber-50 rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-amber-700">Cash collected</Text>
                      <Text className="text-sm font-bold text-amber-900">
                        ₹{group.cod_amount?.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-amber-700">Delivery fee (on confirm)</Text>
                      <Text className="text-sm font-bold text-green-700">
                        +₹{group.delivery_fee.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-gray-500 text-center mb-4 leading-5">
                    Go to the office and deposit{' '}
                    <Text className="font-bold text-gray-900">
                      ₹{group.cod_amount?.toFixed(2)}
                    </Text>
                    , then tap below. Admin will verify and credit your{' '}
                    <Text className="font-bold text-gray-900">
                      ₹{group.delivery_fee.toFixed(2)}
                    </Text>{' '}
                    delivery fee.
                  </Text>

                  <TouchableOpacity
                    onPress={() => setShowDepositModal(true)}
                    className="bg-amber-500 py-3.5 rounded-2xl flex-row items-center justify-center"
                  >
                    <Feather name="send" size={18} color="white" />
                    <Text className="text-white font-bold ml-2 text-base">
                      I've Deposited ₹{group.cod_amount?.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Reported — waiting for admin */}
              {codReported && (
                <View className="bg-white rounded-3xl p-5 shadow-lg border-2 border-blue-200">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <ActivityIndicator size="small" color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">Deposit Under Review</Text>
                      <Text className="text-xs text-blue-600 mt-0.5">
                        Admin is verifying your deposit
                      </Text>
                    </View>
                    <View className="bg-blue-100 px-2.5 py-1 rounded-full">
                      <Text className="text-blue-700 text-xs font-bold">Reviewing</Text>
                    </View>
                  </View>

                  <View className="bg-blue-50 rounded-2xl p-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-blue-700">Cash deposited</Text>
                      <Text className="text-sm font-bold text-blue-900">
                        ₹{group.cod_amount?.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-blue-700">Delivery fee (pending)</Text>
                      <Text className="text-sm font-bold text-gray-400">
                        ₹{group.delivery_fee.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-xs text-gray-500 text-center mt-3 leading-5">
                    Once admin confirms, ₹{group.delivery_fee.toFixed(2)} will be credited to your wallet.
                  </Text>
                </View>
              )}

              {/* Confirmed — wallet credited */}
              {codConfirmed && (
                <View className="bg-white rounded-3xl p-5 shadow-lg border-2 border-green-200">
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Feather name="check-circle" size={20} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">Deposit Confirmed</Text>
                      <Text className="text-xs text-green-600 mt-0.5">
                        Delivery fee credited to wallet
                      </Text>
                    </View>
                    <View className="bg-green-100 px-2.5 py-1 rounded-full">
                      <Text className="text-green-700 text-xs font-bold">Done</Text>
                    </View>
                  </View>

                  <View className="bg-green-50 rounded-2xl p-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-xs text-green-700">Cash deposited</Text>
                      <Text className="text-sm font-bold text-green-900">
                        ₹{group.cod_amount?.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between border-t border-green-100 pt-2 mt-1">
                      <Text className="text-xs font-bold text-green-700">Credited to wallet</Text>
                      <Text className="text-sm font-bold text-green-600">
                        +₹{group.delivery_fee.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Blur overlay ── */}
      {(showOtpModal || showPickupModal || showAcceptModal || showDepositModal) && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* ── Accept modal ── */}
      <DeliveryConfirmationModal
        visible={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onConfirm={handleAccept}
        title="Accept This Group?"
        message={`Pick up from ${group.vendors.length} vendor(s) and deliver to ${group.customer.name}. Payout: ₹${group.delivery_fee.toFixed(2)}`}
        confirmText="Yes, Accept"
        cancelText="Cancel"
        isLoading={acceptMutation.isPending}
        icon="check-circle"
        iconColor="#6366f1"
      />

      {/* ── Pickup modal ── */}
      <DeliveryConfirmationModal
        visible={showPickupModal}
        onClose={() => { setShowPickupModal(false); setPickupOrderId(null); }}
        onConfirm={handleConfirmPickup}
        title="Confirm Pickup?"
        message={`Confirm you have collected all active items from ${
          group.vendors.find((v) => v.order_id === pickupOrderId)?.vendor_name || 'this vendor'
        }.`}
        confirmText="Yes, Picked Up"
        cancelText="Cancel"
        isLoading={pickupMutation.isPending}
        icon="package"
        iconColor="#f97316"
      />

      {/* ── COD Deposit confirmation modal ── */}
      <DeliveryConfirmationModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onConfirm={handleConfirmDeposit}
        title="Confirm Cash Deposit?"
        message={`You are confirming that you have deposited ₹${group.cod_amount?.toFixed(2)} at the office. This cannot be undone.`}
        confirmText="Yes, I've Deposited"
        cancelText="Cancel"
        isLoading={reportDepositMutation.isPending}
        icon="dollar-sign"
        iconColor="#d97706"
      />

      {/* ── OTP modal ── */}
      <DeliveryOTPVerificationModal
        showOtpModal={showOtpModal}
        setShowOtpModal={setShowOtpModal}
        selectedOrderForOtp={group}
        otpInput={otpInput}
        setOtpInput={setOtpInput}
        handleVerifyOtp={handleVerifyOtp}
      />

    </SafeAreaView>
  );
};

export default OrderDetailScreen;