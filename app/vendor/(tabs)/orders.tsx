import VendorOrderCardWithButtons from '@/components/VendorOrderCardWithButtons';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


type OrderStatus =
  | 'all'
  | 'new'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

type PaymentStatus = 'Paid' | 'COD';

export interface Order {
  id: string;
  customer: string;
  items: number;
  amount: number;
  time: string;
  status: Exclude<OrderStatus, 'all'>;
  payment: PaymentStatus;
}

interface StatusConfigItem {
  label: string;
  badge: string;
  color: string;
  textColor: string;
}

const mockOrders: Order[] = [
  {
    id: 'ORD1245',
    customer: 'Rajesh Kumar',
    items: 3,
    amount: 450,
    time: '6 min ago',
    status: 'preparing',
    payment: 'COD',
  },
  {
    id: 'ORD1246',
    customer: 'Priya Singh',
    items: 5,
    amount: 820,
    time: '12 min ago',
    status: 'new',
    payment: 'Paid',
  },
  {
    id: 'ORD1247',
    customer: 'Amit Patel',
    items: 2,
    amount: 320,
    time: '18 min ago',
    status: 'ready',
    payment: 'Paid',
  },
  {
    id: 'ORD1248',
    customer: 'Deepika Verma',
    items: 7,
    amount: 1240,
    time: '45 min ago',
    status: 'completed',
    payment: 'COD',
  },
  {
    id: 'ORD1249',
    customer: 'Vikram Das',
    items: 4,
    amount: 650,
    time: '2 hours ago',
    status: 'new',
    payment: 'Paid',
  },
  {
    id: 'ORD1250',
    customer: 'Neha Gupta',
    items: 3,
    amount: 380,
    time: '3 hours ago',
    status: 'cancelled',
    payment: 'COD',
  },
];

export const statusConfig: Record<Exclude<OrderStatus, 'all'>, StatusConfigItem> = {
  new: {
    label: 'New',
    badge: 'bg-orange-500',
    color: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
  preparing: {
    label: 'Preparing',
    badge: 'bg-blue-500',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  ready: {
    label: 'Ready',
    badge: 'bg-purple-500',
    color: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-500',
    color: 'bg-emerald-100',
    textColor: 'text-emerald-700',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-500',
    color: 'bg-red-100',
    textColor: 'text-red-700',
  },
};

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [isLoading] = useState(false);

 
  const filteredOrders = useMemo<Order[]>(() => {
    if (activeTab === 'all') return mockOrders;
    return mockOrders.filter(order => order.status === activeTab);
  }, [activeTab]);


  const statusCounts = useMemo<Record<OrderStatus, number>>(() => {
    const counts = {
      all: mockOrders.length,
      new: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };

    mockOrders.forEach(order => {
      counts[order.status]++;
    });

    return counts;
  }, []);

  const statusEntries = Object.entries(statusCounts) as [
    OrderStatus,
    number,
  ][];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-100">
        <Text className="text-2xl font-bold">Orders</Text>
        <Text className="text-gray-600 text-sm">Total: {mockOrders.length}</Text>
      </View>

      {/* Filters */}
      <View>
        <FlatList
          horizontal
          data={statusEntries}
          keyExtractor={([status]) => status}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, gap: 8, minHeight: 60, maxHeight: 60 }}
          className='flex-auto'
          renderItem={({ item: [status, count] }) => {
            const isActive = activeTab === status;
            const badge = status === 'all' ? 'bg-gray-800' : statusConfig[status].badge;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(status)}
                className={`px-5 py-1 rounded-full flex-row items-center ${isActive ? badge : 'bg-gray-100 border border-gray-200'}`}
              >
                <Text
                  className={`font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}
                >
                  {status}
                </Text>
                <Text
                  className={`ml-2 text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}
                >
                  {count}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders */}
      {isLoading ? (
        <ActivityIndicator size="large" className="mt-10" />
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({item})=><VendorOrderCardWithButtons item={item} />}
          contentContainerStyle={{ padding: 16 }}
          className='flex-1'
        />
      ) : (
        <View className="items-center justify-center py-16 flex-1">
          <Text className="text-xl">📭</Text>
          <Text className="font-semibold mt-2">
            No {activeTab} orders
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
