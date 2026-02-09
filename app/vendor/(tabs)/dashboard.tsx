import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FullPageError } from '@/components/ErrorComp';
import QuickInfoBox from '@/components/QuickInfoBox';
import VendorStatCard from '@/components/VendorStatCard';
import VendorOrderCard from '@/components/VendorOrderCard';
import AlertItem from '@/components/AlertItem';
import QuickActionButton from '@/components/QuickActionButton';

// Import queries and mutations
import { useUpdateVendorProfile, useVendorDetail, useVendorProfile } from '@/hooks/queries';
import { useVendorOrders, useVendorOrderStats } from '@/hooks/queries/orders';
import { useVendorInventory } from '@/hooks/queries';
import { useWalletData } from '@/hooks/queries/wallets';
import { useAuthStore } from '@/store/authStore';
import VerificationGate, { VerificationOverlay } from '@/components/vendorVerificationComp';

const { width } = Dimensions.get('window');

export default function VendorDashboard() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  // State
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vendor details
  const {
    data: vendorData,
    isLoading: vendorLoading,
    isError: vendorError,
    error: vendorErrorData,
    refetch: refetchVendor,
  } = useVendorDetail(userId || '');

  // Fetch vendor profile for vendor_id
  const { mutate: updateIsOpen, isPending: isLoadingIsOpen } = useUpdateVendorProfile()
  const vendorId = vendorData?.user_id;

  // Fetch orders and stats
  const {
    data: orders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useVendorOrders();

  const {
    data: orderStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useVendorOrderStats(vendorId || '');

  // Fetch inventory
  const {
    data: inventoryItems,
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useVendorInventory();

  // Fetch wallet data
  const {
    wallet,
    transactions
  } = useWalletData(userId, 'vendor', vendorId);

  // Verification status
  const verificationStatus = useMemo(() => {
    if (!vendorData) return { isAdminVerified: false, isKycVerified: false };
    return {
      isAdminVerified: vendorData.is_verified,
      isKycVerified: vendorData.kyc_status === 'approved',
    };
  }, [vendorData]);

  // Shop open/close status
  const isOpen = vendorData?.is_open || false;


  // Active orders (new, preparing, ready)
  const activeOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) =>
      ['pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up'].includes(
        order.status
      )
    ).slice(0, 4); // Show only first 4
  }, [orders]);

  // Low stock items
  const lowStockItems = useMemo(() => {
    if (!inventoryItems) return [];
    return inventoryItems
      .filter((item) => item.stock_status === 'low_stock' || item.stock_status === 'out_of_stock')
      .slice(0, 3); // Show only first 3
  }, [inventoryItems]);

  // Get today's earnings

  const lifetimeEarnings = wallet.data?.lifetime_earnings || 0;
  const todayEarnings = wallet.data?.earnings_today || 0;
  const weeklyEarnings = wallet.data?.earnings_this_week || 0;

  // Business hours display
  const getBusinessHoursDisplay = () => {
    if (!vendorData?.business_hours || Object.keys(vendorData.business_hours).length === 0) {
      return 'Not set';
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = vendorData.business_hours[today];

    if (todayHours && todayHours.open && todayHours.close) {
      return `${todayHours.open} - ${todayHours.close}`;
    }

    return 'Closed Today';
  };

  // Handle shop toggle
  // const handleToggleShop = async () => {
  //   Alert.alert(
  //     isOpen ? 'Close Shop?' : 'Open Shop?',
  //     `Are you sure you want to ${isOpen ? 'close' : 'open'} your shop?`,
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Confirm',
  //         onPress: ()=>updateIsOpen({is_open:!isOpen})
  //       }, 
  //     ]
  //   );
  // };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchVendor(),
        refetchOrders(),
        refetchStats(),
        refetchInventory(),
        wallet.refetch(),
      ]);
    } catch (error) {
      console.error('[Dashboard] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (vendorLoading || ordersLoading || statsLoading || inventoryLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (vendorError || !vendorData) {
    return (
      <FullPageError
        code="500"
        message={vendorErrorData?.message || 'Failed to load dashboard'}
        onActionPress={() => refetchVendor()}
      />
    );
  }


  if (!verificationStatus.isAdminVerified || !verificationStatus.isKycVerified) {
    return (
      <VerificationGate
        isAdminVerified={verificationStatus.isAdminVerified}
        isKycVerified={verificationStatus.isKycVerified}
        kycStatus={vendorData?.kyc_status || 'pending'}
        storeName={vendorData?.store_name || 'Store Name'}
        onKycPress={() => router.push('/vendor/profile/documents')}
      />
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER SECTION */}
        <View className="bg-white border-b border-emerald-100 shadow-sm">
          <View className="px-4 py-4">
            {/* Shop Name & Toggle */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Ionicons name="storefront" size={24} color="white" />
                </View>
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-2xl font-bold text-gray-900">
                      {vendorData.store_name}
                    </Text>
                    {verificationStatus.isAdminVerified && (
                      <View className="rounded-full p-1">
                        <MaterialIcons name="verified" size={24} color="#10b981" />
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500">Vendor Dashboard</Text>
                </View>
              </View>

              {/* Open/Close Toggle */}
              <TouchableOpacity
                onPress={() => updateIsOpen({ is_open: !isOpen })}
                className={`flex-row items-center gap-2 px-4 py-2 rounded-lg border ${isOpen
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                  }`}
              >
                <View
                  className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                />
                <Text
                  className={`text-sm font-semibold ${isOpen ? 'text-emerald-600' : 'text-red-600'
                    }`}
                >
                  {isLoadingIsOpen ? "Loading..." : isOpen ? "Open" : "Closed"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Info Bar */}
            <View className="flex-row gap-2">
              <QuickInfoBox
                icon={<Ionicons name="time-outline" size={16} color="#059669" />}
                label="Hours Today"
                value={getBusinessHoursDisplay()}
              />
              <QuickInfoBox
                icon={<Ionicons name="star" size={16} color="#f59e0b" />}
                label="Rating"
                value={vendorData.rating.toFixed(1)}
              />
            </View>
          </View>
        </View>

        {/* VERIFICATION STATUS BANNER */}
        {(!verificationStatus.isAdminVerified || !verificationStatus.isKycVerified) && (
          <View className="px-4 pt-4">
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <View className="flex-row items-start gap-3">
                <View className="bg-amber-100 rounded-full p-2">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900 mb-1">
                    Action Required
                  </Text>
                  <Text className="text-xs text-amber-700 mb-3">
                    Complete verification to access all features
                  </Text>
                  <View className="gap-2">
                    {!verificationStatus.isAdminVerified && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-gray-700">
                          Admin verification pending
                        </Text>
                      </View>
                    )}
                    {!verificationStatus.isKycVerified && (
                      <TouchableOpacity
                        onPress={() => router.push('/vendor/profile/documents')}
                        className="flex-row items-center gap-2"
                      >
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-blue-600 underline">
                          {vendorData.kyc_status === 'rejected'
                            ? 'KYC rejected - resubmit documents →'
                            : vendorData.kyc_status === 'pending'
                              ? 'KYC review in progress'
                              : 'Complete KYC verification →'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* VERIFICATION STATUS CARDS */}
        <View className="px-4 pt-4">
          <View className="flex-row gap-3">
            {/* Admin Verification */}
            <View
              className={`flex-1 rounded-xl p-4 border ${verificationStatus.isAdminVerified
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="shield-checkmark"
                    size={20}
                    color={verificationStatus.isAdminVerified ? '#3b82f6' : '#9ca3af'}
                  />
                  <Text
                    className={`text-xs font-semibold ${verificationStatus.isAdminVerified
                        ? 'text-blue-900'
                        : 'text-gray-600'
                      }`}
                  >
                    Admin
                  </Text>
                </View>
                {verificationStatus.isAdminVerified ? (
                  <View className="bg-blue-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-gray-400 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Pending</Text>
                  </View>
                )}
              </View>
              <Text
                className={`text-[10px] ${verificationStatus.isAdminVerified ? 'text-blue-700' : 'text-gray-500'
                  }`}
              >
                {verificationStatus.isAdminVerified
                  ? 'Your shop is verified'
                  : 'Awaiting admin approval'}
              </Text>
            </View>

            {/* KYC Verification */}
            <View
              className={`flex-1 rounded-xl p-4 border ${verificationStatus.isKycVerified
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
                }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={verificationStatus.isKycVerified ? '#10b981' : '#9ca3af'}
                  />
                  <Text
                    className={`text-xs font-semibold ${verificationStatus.isKycVerified
                        ? 'text-green-900'
                        : 'text-gray-600'
                      }`}
                  >
                    KYC
                  </Text>
                </View>
                {verificationStatus.isKycVerified ? (
                  <View className="bg-green-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-gray-400 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bold">Pending</Text>
                  </View>
                )}
              </View>
              <Text
                className={`text-[10px] ${verificationStatus.isKycVerified ? 'text-green-700' : 'text-gray-500'
                  }`}
              >
                {verificationStatus.isKycVerified
                  ? 'Documents approved'
                  : 'Submit KYC documents'}
              </Text>
            </View>
          </View>
        </View>

        {/* ORDER SUMMARY STATS */}
        <View className="px-4 py-6">
          <View className="flex-row flex-wrap gap-3 justify-between">
            <VendorStatCard
              width={width}
              label="Total Orders"
              value={orderStats?.total?.toString() || '0'}
              icon={<Ionicons name="receipt-outline" size={28} color="#059669" />}
              bgColor="bg-emerald-50"
            />
            <VendorStatCard
              width={width}
              label="Active Orders"
              value={(
                (orderStats?.new || 0) +
                (orderStats?.preparing || 0) +
                (orderStats?.ready || 0)
              ).toString()}
              icon={<Ionicons name="flash" size={28} color="#f59e0b" />}
              bgColor="bg-amber-50"
            />
            <VendorStatCard
              width={width}
              label="Completed"
              value={orderStats?.completed?.toString() || '0'}
              icon={
                <Ionicons name="checkmark-circle-outline" size={28} color="#10b981" />
              }
              bgColor="bg-green-50"
            />
            <VendorStatCard
              width={width}
              label="Cancelled"
              value={orderStats?.cancelled?.toString() || '0'}
              icon={<Ionicons name="close-circle-outline" size={28} color="#ef4444" />}
              bgColor="bg-red-50"
            />
          </View>
        </View>

        {/* NEW/ACTIVE ORDERS SECTION */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <View className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center gap-2">
                <Ionicons name="list" size={20} color="#047857" />
                <Text className="text-lg font-bold text-gray-900">Active Orders</Text>
                <View className="bg-emerald-500 rounded-full px-2 py-0.5 ml-2">
                  <Text className="text-white text-xs font-bold">
                    {activeOrders.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* Orders List */}
            {activeOrders.length > 0 ? (
              <View className='gap-2 p-2'>
                {activeOrders.map((order) => (
                  <VendorOrderCard
                    key={order.id}
                    order={order as any}
                    onPress={() => router.push(`/vendor/order/${order.id}`)}
                  />
                ))}
              </View>
            ) : (
              <View className="py-8 items-center">
                <Feather name="inbox" size={48} color="#d1d5db" />
                <Text className="text-gray-600 mt-2">No active orders</Text>
              </View>
            )}

            {/* Footer */}
            <TouchableOpacity
              onPress={() => router.push('/vendor/(tabs)/orders')}
              className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2"
            >
              <Text className="text-emerald-600 font-medium text-sm">
                View All Orders
              </Text>
              <Feather name="arrow-right" size={14} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* EARNINGS SNAPSHOT */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={() => router.push('/vendor/earnings')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10b981', '#0d9488']}
              className="rounded-2xl p-6 shadow-lg"
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-start justify-between mb-4">
                <Text className="text-sm font-semibold text-white opacity-90">
                  {/* Today's */}
                  Total Earnings
                </Text>
                <View className="bg-white/20 rounded-full p-2">
                  <Ionicons name="trending-up" size={20} color="white" />
                </View>
              </View>

              <Text className="text-4xl font-bold text-white mb-2">
                ₹{lifetimeEarnings.toLocaleString()}
              </Text>
              <Text className="text-sm text-white opacity-75 mb-4">
                {orderStats?.total || 0} orders completed
              </Text>

              {/* <View className="border-t border-white/20 pt-4 mt-4">
                <Text className="text-xs text-white opacity-75 mb-1">
                  Weekly Total
                </Text>
                <Text className="text-2xl font-bold text-white">
                  ₹{weeklyEarnings.toLocaleString()}
                </Text>
              </View> */}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* LOW STOCK ALERTS */}
        {lowStockItems.length > 0 && (
          <View className="px-4 pb-6">
            <View className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <View className="bg-red-50 px-6 py-4 border-b border-red-200">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="alert-circle" size={20} color="#dc2626" />
                  <Text className="text-lg font-bold text-red-900">
                    Low Stock Alert
                  </Text>
                  <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
                    <Text className="text-white text-xs font-bold">
                      {lowStockItems.length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Alerts */}
              <View className="p-6 gap-3">
                {lowStockItems.map((item) => (
                  <AlertItem
                    key={item.id}
                    product={item.name}
                    stock={`${item.stock_quantity} ${item.unit}`}
                    status={
                      item.stock_status === 'out_of_stock' ? 'Critical' : 'Warning'
                    }
                  />
                ))}
              </View>

              {/* Footer */}
              <TouchableOpacity
                onPress={() => router.push('/vendor/inventory')}
                className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-row items-center justify-center gap-2"
              >
                <Text className="text-red-600 font-medium text-sm">
                  Manage Inventory
                </Text>
                <Feather name="arrow-right" size={14} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QUICK ACTIONS */}
        <View className="px-4 pb-10">
          <View className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>

            <View className="flex-row flex-wrap gap-3 justify-between">
              <QuickActionButton
                icon={
                  <Ionicons name="add-circle-outline" size={24} color="#059669" />
                }
                label="Add Product"
                route="/vendor/product/add"
              />
              <QuickActionButton
                icon={
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={24}
                    color="#059669"
                  />
                }
                label="Inventory"
                route="/vendor/inventory"
              />
              <QuickActionButton
                icon={<Ionicons name="wallet-outline" size={24} color="#059669" />}
                label="Earnings"
                route="/vendor/earnings"
              />
              <QuickActionButton
                icon={<Ionicons name="time-outline" size={24} color="#059669" />}
                label="Shop Hours"
                route="/vendor/(tabs)/profile/edit"
              />
            </View>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}