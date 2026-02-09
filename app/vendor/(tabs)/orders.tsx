// app/(tabs)/vendor/orders/index.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useVendorOrders, useVendorOrderStats } from '@/hooks/queries/orders';
import { useAuthStore } from '@/store/authStore';
import VendorOrderCard from '@/components/VendorOrderCard';
import { OrderFilterStatus } from '@/types/orders-carts.types';
import { useVendorProfile } from '@/hooks/queries';
import VerificationGate from '@/components/vendorVerificationComp';

type OrderStatus =
  | 'all'
  | 'new'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

interface StatusConfigItem {
  label: string;
  badge: string;
  color: string;
  textColor: string;
  dbStatus: string[];
}

const statusConfig: Record<OrderStatus, StatusConfigItem> = {
  all: {
    label: 'All',
    badge: 'bg-gray-800',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    dbStatus: [],
  },
  new: {
    label: 'New',
    badge: 'bg-orange-500',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
    dbStatus: ['pending', 'confirmed'],
  },
  preparing: {
    label: 'Preparing',
    badge: 'bg-blue-500',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
    dbStatus: ['processing'],
  },
  ready: {
    label: 'Ready',
    badge: 'bg-purple-500',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
    dbStatus: ['ready_for_pickup', 'picked_up'],
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-500',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    dbStatus: ['delivered'],
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-500',
    color: 'bg-red-100',
    textColor: 'text-red-700',
    dbStatus: ['cancelled', 'refunded'],
  },
};



export default function VendorOrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const { session } = useAuthStore();
  const vendorId = session?.user?.id;

  const tabToStatusMap: Record<
    typeof activeTab,
    OrderFilterStatus
  > = {
    all: 'all',
    new: 'active',
    preparing: 'active',
    ready: 'active',
    completed: 'completed',
    cancelled: 'completed',
  };
  const { data: vendorData } = useVendorProfile(session?.user.id);
  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useVendorOrders();



  const { data: stats } = useVendorOrderStats(vendorId || '');

  // console.log(stats);
  const verificationStatus = useMemo(() => {
    if (!vendorData) return { isAdminVerified: false, isKycVerified: false };
    return {
      isAdminVerified: vendorData.is_verified,
      isKycVerified: vendorData.kyc_status === 'approved',
    };
  }, [vendorData]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    if (activeTab === 'all') return orders;

    const statusesToFilter = statusConfig[activeTab].dbStatus;

    return orders.filter((order) => {
      // console.log(order.status,statusConfig[activeTab].dbStatus);
      return statusesToFilter.includes(order.status)
    });
  }, [orders, activeTab]);



  const statusCounts = useMemo(() => {
    if (!stats) return null;
    return {
      all: stats.total,
      new: stats.new,
      preparing: stats.preparing,
      ready: stats.ready,
      completed: stats.completed,
      cancelled: stats.cancelled,
    };
  }, [stats]);

  

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Text className="text-red-600 text-center mb-4">
          Error loading orders: {error.message}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="bg-green-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Orders</Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-600 text-sm">
            Total: {statusCounts?.all || 0} orders
          </Text>
          {stats && (
            <Text className="text-green-600 text-sm font-semibold">
              Today: ₹{stats.todayRevenue.toFixed(0)}
            </Text>
          )}
        </View>
      </View>

      {/* Filters */}
      <View>
        <FlatList
          horizontal
          data={Object.entries(statusConfig) as [OrderStatus, StatusConfigItem][]}
          keyExtractor={([status]) => status}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item: [status, config] }) => {
            const isActive = activeTab === status;
            const count = statusCounts?.[status] || 0;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(status)}
                className={`px-4 py-2.5 rounded-full flex-row items-center ${isActive ? config.badge : 'bg-gray-100 border border-gray-200'
                  }`}
              >
                <Text
                  className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {config.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${isActive ? 'bg-white bg-opacity-30' : 'bg-gray-200'
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${'text-gray-700'
                        }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VendorOrderCard
              order={item as any}
              onPress={() => router.push(`/vendor/order/${item.id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ fontSize: 64 }}>📭</Text>
          <Text className="text-xl font-bold text-gray-900 mt-4 mb-2">
            No {activeTab === 'all' ? '' : activeTab} orders
          </Text>
          <Text className="text-gray-600 text-center">
            {activeTab === 'new'
              ? 'New orders will appear here'
              : 'Orders will appear when customers place them'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}