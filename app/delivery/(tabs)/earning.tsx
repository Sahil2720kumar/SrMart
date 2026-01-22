import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { LinearGradient } from 'expo-linear-gradient';


/* ---------------- MOCK DATA ---------------- */
const mockEarningsData = {
  today: {
    totalEarnings: 2450,
    orders: 12,
    distance: 24.5,
    baseEarnings: 2100,
    incentives: 250,
    tips: 100,
    deductions: 0,
    orderHistory: [
      { id: 'ORD-001234', date: '2024-01-22', time: '09:30 AM', distance: 3.2, earnings: 125, status: 'completed' },
      { id: 'ORD-001235', date: '2024-01-22', time: '10:15 AM', distance: 2.1, earnings: 95, status: 'completed' },
      { id: 'ORD-001236', date: '2024-01-22', time: '11:00 AM', distance: 4.5, earnings: 150, status: 'completed' },
      { id: 'ORD-001237', date: '2024-01-22', time: '12:30 PM', distance: 1.8, earnings: 80, status: 'completed' },
      { id: 'ORD-001238', date: '2024-01-22', time: '01:45 PM', distance: 3.5, earnings: 130, status: 'completed' },
      { id: 'ORD-001239', date: '2024-01-22', time: '02:20 PM', distance: 2.8, earnings: 110, status: 'completed' },
      { id: 'ORD-001240', date: '2024-01-22', time: '03:10 PM', distance: 1.5, earnings: 75, status: 'completed' },
      { id: 'ORD-001241', date: '2024-01-22', time: '04:00 PM', distance: 3.9, earnings: 145, status: 'completed' },
    ]
  },
  week: {
    totalEarnings: 15680,
    orders: 78,
    distance: 156.8,
    baseEarnings: 13500,
    incentives: 1680,
    tips: 500,
    deductions: 0,
    orderHistory: [
      { id: 'ORD-001234', date: '2024-01-22', time: '09:30 AM', distance: 3.2, earnings: 125, status: 'completed' },
      { id: 'ORD-001235', date: '2024-01-21', time: '10:15 AM', distance: 2.1, earnings: 95, status: 'completed' },
      { id: 'ORD-001236', date: '2024-01-21', time: '11:00 AM', distance: 4.5, earnings: 150, status: 'completed' },
      { id: 'ORD-001237', date: '2024-01-20', time: '12:30 PM', distance: 1.8, earnings: 80, status: 'completed' },
      { id: 'ORD-001238', date: '2024-01-20', time: '01:45 PM', distance: 3.5, earnings: 130, status: 'completed' },
    ]
  },
  month: {
    totalEarnings: 52340,
    orders: 265,
    distance: 530,
    baseEarnings: 45000,
    incentives: 5840,
    tips: 1500,
    deductions: 0,
    orderHistory: [
      { id: 'ORD-001234', date: '2024-01-22', time: '09:30 AM', distance: 3.2, earnings: 125, status: 'completed' },
      { id: 'ORD-001235', date: '2024-01-21', time: '10:15 AM', distance: 2.1, earnings: 95, status: 'completed' },
      { id: 'ORD-001236', date: '2024-01-20', time: '11:00 AM', distance: 4.5, earnings: 150, status: 'completed' },
    ]
  }
};

const payoutInfo = {
  availableBalance: 52340,
  pendingWithdrawals: [
    { id: 'WD-001', amount: 10000, requestDate: '2024-01-20', status: 'pending' },
    { id: 'WD-002', amount: 5000, requestDate: '2024-01-18', status: 'approved' },
  ],
  lastPayoutDate: '2024-01-15',
  lastPayoutAmount: 48200,
  totalEarned: 150540,
  totalWithdrawn: 98200,
};

/* ---------------- MAIN COMPONENT ---------------- */
const EarningsScreen = () => {
  const router = useRouter();
  const store = useDeliveryStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  
  const isVerified = store.adminVerificationStatus === 'approved' && store.isKycCompleted;
  const currentData = mockEarningsData[selectedPeriod];
  const avgPerOrder = currentData.orders > 0 
    ? (currentData.totalEarnings / currentData.orders).toFixed(0) 
    : 0;

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return "Today's Earnings";
      case 'week': return "This Week's Earnings";
      case 'month': return "This Month's Earnings";
    }
  };

  const hasEarnings = currentData.orders > 0;
  const canWithdraw = isVerified && payoutInfo.availableBalance > 0;

  const handleWithdraw = () => {
    if (!isVerified) {
      Alert.alert(
        'Verification Required',
        'Please complete KYC and admin verification to withdraw funds.'
      );
      return;
    }
    if (payoutInfo.availableBalance <= 0) {
      Alert.alert('No Balance', 'You have no available balance to withdraw.');
      return;
    }
    // Navigate to withdrawal screen or show withdrawal modal
    Alert.alert('Withdraw', 'Withdrawal process would start here');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4">
        <Text className="text-white text-3xl font-bold">Earnings</Text>
        <Text className="text-indigo-100 text-sm mt-1">Track your income and performance</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4">
          {/* Verification Warning */}
          {!isVerified && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg border-2 border-orange-400">
              <View className="flex-row items-start">
                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Feather name="alert-triangle" size={24} color="#ea580c" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 mb-2">
                    Verification Required
                  </Text>
                  <Text className="text-sm text-gray-600 leading-5 mb-3">
                    Complete KYC and admin verification to withdraw your earnings.
                  </Text>
                  <TouchableOpacity 
                    className="bg-orange-500 py-2 px-4 rounded-lg self-start"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold text-sm">Complete Verification</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Available Balance Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-sm text-gray-500 mb-1">Available Balance</Text>
                <Text className="text-4xl font-bold text-gray-900">
                  ₹{payoutInfo.availableBalance.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center">
                <Feather name="dollar-sign" size={28} color="#22c55e" />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={!canWithdraw}
              className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${
                canWithdraw ? 'bg-green-500' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
            >
              <Feather name="arrow-down-circle" size={20} color="white" />
              <Text className="text-white font-bold text-base">
                {canWithdraw ? 'Withdraw Funds' : 'Withdrawal Unavailable'}
              </Text>
            </TouchableOpacity>

            {!isVerified && (
              <Text className="text-xs text-orange-600 text-center mt-2">
                Complete verification to enable withdrawals
              </Text>
            )}
            {isVerified && payoutInfo.availableBalance <= 0 && (
              <Text className="text-xs text-gray-500 text-center mt-2">
                No balance available for withdrawal
              </Text>
            )}
          </View>

          {/* Pending Withdrawals Section */}
          {payoutInfo.pendingWithdrawals.length > 0 && (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
              <Text className="text-lg font-bold text-gray-900 mb-4">Pending Approvals</Text>
              
              {payoutInfo.pendingWithdrawals.map((withdrawal) => (
                <View 
                  key={withdrawal.id} 
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className="font-bold text-gray-900 mr-2">#{withdrawal.id}</Text>
                      <View className={`px-2 py-0.5 rounded ${
                        withdrawal.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <Text className={`text-xs font-bold ${
                          withdrawal.status === 'pending' ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {withdrawal.status === 'pending' ? 'Pending' : 'Approved'}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-gray-500">{withdrawal.requestDate}</Text>
                  </View>
                  <Text className="text-lg font-bold text-gray-900">
                    ₹{withdrawal.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Lifetime Stats */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-4">Lifetime Summary</Text>
            
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-indigo-50 rounded-2xl p-4">
                <Feather name="trending-up" size={20} color="#4f46e5" />
                <Text className="text-xs text-gray-500 mt-2 mb-1">Total Earned</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₹{payoutInfo.totalEarned.toLocaleString('en-IN')}
                </Text>
              </View>
              <View className="flex-1 bg-green-50 rounded-2xl p-4">
                <Feather name="arrow-down" size={20} color="#22c55e" />
                <Text className="text-xs text-gray-500 mt-2 mb-1">Withdrawn</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₹{payoutInfo.totalWithdrawn.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {payoutInfo.lastPayoutDate && (
              <View className="bg-gray-50 rounded-xl p-3 mt-2">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs text-gray-500 mb-1">Last Withdrawal</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      ₹{payoutInfo.lastPayoutAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500">{payoutInfo.lastPayoutDate}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Time Filter Tabs */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setSelectedPeriod('today')}
              className={`flex-1 py-3 rounded-full ${
                selectedPeriod === 'today' ? 'bg-white' : 'bg-white/20'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${
                selectedPeriod === 'today' ? 'text-[#4f46e5]' : 'text-white'
              }`}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod('week')}
              className={`flex-1 py-3 rounded-full ${
                selectedPeriod === 'week' ? 'bg-white' : 'bg-white/20'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${
                selectedPeriod === 'week' ? 'text-[#4f46e5]' : 'text-white'
              }`}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedPeriod('month')}
              className={`flex-1 py-3 rounded-full ${
                selectedPeriod === 'month' ? 'bg-white' : 'bg-white/20'
              }`}
              activeOpacity={0.8}
            >
              <Text className={`text-center font-bold ${
                selectedPeriod === 'month' ? 'text-[#4f46e5]' : 'text-white'
              }`}>
                This Month
              </Text>
            </TouchableOpacity>
          </View>

          {hasEarnings ? (
            <>
              {/* Period Summary Card */}
              <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
                <Text className="text-sm text-gray-500 mb-2">{getPeriodLabel()}</Text>
                <Text className="text-4xl font-bold text-gray-900 mb-5">
                  ₹{currentData.totalEarnings.toLocaleString('en-IN')}
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-indigo-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-indigo-500 rounded-full items-center justify-center mb-2">
                      <Feather name="package" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Orders</Text>
                    <Text className="text-xl font-bold text-gray-900">{currentData.orders}</Text>
                  </View>

                  <View className="flex-1 bg-blue-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mb-2">
                      <Feather name="navigation" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Distance</Text>
                    <Text className="text-xl font-bold text-gray-900">{currentData.distance} km</Text>
                  </View>

                  <View className="flex-1 bg-green-50 rounded-xl p-3">
                    <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center mb-2">
                      <Feather name="trending-up" size={16} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500 mb-0.5">Avg</Text>
                    <Text className="text-xl font-bold text-gray-900">₹{avgPerOrder}</Text>
                  </View>
                </View>
              </View>

              {/* Earnings Breakdown */}
              <View className="mb-4">
                <Text className="text-lg font-bold text-white mb-3">Earnings Breakdown</Text>
                <View className="flex-row gap-3 mb-3">
                  <BreakdownCard
                    icon="dollar-sign"
                    label="Base Earnings"
                    amount={currentData.baseEarnings}
                    color="bg-indigo-500"
                  />
                  <BreakdownCard
                    icon="award"
                    label="Incentives"
                    amount={currentData.incentives}
                    color="bg-orange-500"
                  />
                </View>
                <View className="flex-row gap-3">
                  <BreakdownCard
                    icon="gift"
                    label="Tips"
                    amount={currentData.tips}
                    color="bg-green-500"
                  />
                  <BreakdownCard
                    icon="minus-circle"
                    label="Deductions"
                    amount={currentData.deductions}
                    color="bg-red-500"
                  />
                </View>
              </View>

              {/* Order Earnings List */}
              <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                <Text className="text-lg font-bold text-gray-900 mb-4">Earning History</Text>
                
                {currentData.orderHistory.slice(0, 5).map((order) => (
                  <View 
                    key={order.id} 
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="font-bold text-gray-900 text-sm mr-2">#{order.id}</Text>
                        <View className="bg-green-100 px-2 py-0.5 rounded">
                          <Text className="text-xs font-bold text-green-700">Completed</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-xs text-gray-500 mr-2">{order.time}</Text>
                        <View className="flex-row items-center">
                          <Feather name="navigation" size={10} color="#9ca3af" />
                          <Text className="text-xs text-gray-500 ml-1">{order.distance} km</Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-lg font-bold text-green-600">
                      ₹{order.earnings}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity 
                  className="mt-3 py-2 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-indigo-600 font-semibold text-sm">View All History</Text>
                </TouchableOpacity>
              </View>

              {/* Motivational Card */}
              <LinearGradient
              colors={['#22c55e','#059669']} 
              className=" rounded-3xl p-5 shadow-lg"
              style={{borderRadius:16}}
              >
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                    <Feather name="zap" size={24} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">Great Work!</Text>
                    <Text className="text-white/80 text-xs">Keep up the momentum</Text>
                  </View>
                </View>
                <Text className="text-white text-sm leading-5">
                  You're earning ₹{avgPerOrder} per order on average. Complete 3 more orders today to reach your daily target!
                </Text>
              </LinearGradient>
            </>
          ) : (
            /* Empty State */
            <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Feather name="dollar-sign" size={48} color="#9ca3af" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">No Earnings Yet</Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Complete your first order to start earning
              </Text>
              <TouchableOpacity 
                className="bg-[#4f46e5] px-6 py-3 rounded-full"
                activeOpacity={0.8}
                onPress={() => router.push('/delivery/orders')}
              >
                <Text className="text-white font-bold">Browse Orders</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------------- BREAKDOWN CARD COMPONENT ---------------- */
const BreakdownCard = ({ 
  icon, 
  label, 
  amount, 
  color 
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  amount: number;
  color: string;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
    <View className={`w-10 h-10 ${color} rounded-xl items-center justify-center mb-3`}>
      <Feather name={icon} size={20} color="white" />
    </View>
    <Text className="text-xs text-gray-500 mb-1 font-semibold">{label}</Text>
    <Text className="text-xl font-bold text-gray-900">₹{amount.toLocaleString('en-IN')}</Text>
  </View>
);

export default EarningsScreen;