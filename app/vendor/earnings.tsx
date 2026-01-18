import { Entypo, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// Mock data
const mockWalletData = {
  availableBalance: 45230,
  pendingBalance: 8500,
  lifetimeEarnings: 285430,
  bankAccount: {
    name: 'HDFC Bank',
    accountNumber: '****5678',
    ifsc: 'HDFC0001234',
    verified: true,
  },
  recentCashouts: [
    {
      id: 'CO001',
      amount: 25000,
      requestDate: 'Jan 15, 2025',
      status: 'completed',
      timeline: {
        requested: true,
        approved: true,
        transferred: true,
        completed: true,
      },
    },
    {
      id: 'CO002',
      amount: 15000,
      requestDate: 'Jan 8, 2025',
      status: 'completed',
      timeline: {
        requested: true,
        approved: true,
        transferred: true,
        completed: true,
      },
    },
    {
      id: 'CO003',
      amount: 10000,
      requestDate: 'Jan 1, 2025',
      status: 'pending',
      timeline: {
        requested: true,
        approved: false,
        transferred: false,
        completed: false,
      },
    },
  ],
  transactions: [
    {
      id: 'TXN001',
      type: 'credit',
      amount: 450,
      orderId: 'ORD1245',
      date: 'Today 2:30 PM',
      description: 'Order completed',
    },
    {
      id: 'TXN002',
      type: 'credit',
      amount: 820,
      orderId: 'ORD1246',
      date: 'Today 1:15 PM',
      description: 'Order completed',
    },
    {
      id: 'TXN003',
      type: 'debit',
      amount: 100,
      date: 'Today 12:00 PM',
      description: 'Platform commission (0.5%)',
    },
    {
      id: 'TXN004',
      type: 'credit',
      amount: 620,
      orderId: 'ORD1247',
      date: 'Yesterday 6:45 PM',
      description: 'Order completed',
    },
  ],
  earningsBreakdown: {
    today: 2800,
    thisWeek: 18500,
    thisMonth: 65400,
  },
};

export default function EarningsScreen() {
  const [cashoutModalVisible, setCashoutModalVisible] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [activeEarningsFilter, setActiveEarningsFilter] = useState<'today' | 'week' | 'month'>('today');
  const [showBankNumber, setShowBankNumber] = useState(false);

  const handleRequestCashout = async () => {
    if (!cashoutAmount || parseInt(cashoutAmount) === 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseInt(cashoutAmount) > mockWalletData.availableBalance) {
      Alert.alert('Error', 'Amount exceeds available balance');
      return;
    }

    if (parseInt(cashoutAmount) < 1000) {
      Alert.alert('Error', 'Minimum cashout amount is ₹1,000');
      return;
    }

    Alert.alert(
      'Confirm Cashout',
      `Request cashout of ₹${cashoutAmount}?\n\nYou'll receive this amount within 2 business days after admin approval.`,
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Confirm',
          onPress: async () => {
            setCashoutLoading(true);
            try {
              await new Promise(resolve => setTimeout(resolve, 2000));
              Alert.alert('Success', `Cashout request of ₹${cashoutAmount} submitted!\nIt will be transferred within 2 business days.`);
              setCashoutAmount('');
              setCashoutModalVisible(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to process cashout request');
            } finally {
              setCashoutLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleViewBankAccount = () => {
    Alert.alert(
      'Bank Account Details',
      `Bank: ${mockWalletData.bankAccount.name}\nAccount: ${mockWalletData.bankAccount.accountNumber}\nIFSC: ${mockWalletData.bankAccount.ifsc}\n\nStatus: Verified ✓`
    );
  };

  const handleEditBankAccount = () => {
    Alert.alert('Edit Bank Account', 'Opening bank account editor...');
  };

  const handleSettlementHistory = () => {
    Alert.alert('Settlement History', 'Opening detailed settlement history...');
  };

  const getEarningsAmount = () => {
    switch (activeEarningsFilter) {
      case 'today':
        return mockWalletData.earningsBreakdown.today;
      case 'week':
        return mockWalletData.earningsBreakdown.thisWeek;
      case 'month':
        return mockWalletData.earningsBreakdown.thisMonth;
      default:
        return 0;
    }
  };

  const getEarningsLabel = () => {
    switch (activeEarningsFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity className="p-2 -ml-2">
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Earnings & Wallet</Text>
          <Text className="text-sm text-gray-600 mt-1">Track your income and manage payouts</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Wallet Overview Cards */}
        <View className="px-4 pt-4 pb-2 gap-3">
          {/* Available Balance - Primary Card */}
          <LinearGradient
            colors={['#10b981', '#0d9488']} style={{ borderRadius: 16 }} className=" rounded-2xl p-6 shadow-lg">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-white text-sm opacity-90 font-medium mb-1">Available Balance</Text>
                <Text className="text-white text-4xl font-bold">₹{mockWalletData.availableBalance.toLocaleString()}</Text>
              </View>
              <View className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Entypo name="wallet" size={24} color="#000" />
              </View>
            </View>
            <Text className="text-white text-xs opacity-75 mb-4">Ready to withdraw • Tap request cashout below</Text>

            {/* Quick Action Button */}
            <TouchableOpacity
              onPress={() => setCashoutModalVisible(true)}
              className="bg-white rounded-xl px-4 py-3 items-center justify-center"
            >
              <Text className="text-emerald-600 font-bold text-base">Request Cashout</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Secondary Balance Cards Row */}
          <View className="flex-row gap-3">
            {/* Pending Balance */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Pending Balance</Text>
              <Text className="text-orange-600 text-2xl font-bold">₹{mockWalletData.pendingBalance.toLocaleString()}</Text>
              <Text className="text-gray-500 text-xs mt-2">Awaiting admin approval</Text>
            </View>

            {/* Lifetime Earnings */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-600 text-xs font-semibold mb-2">Lifetime Earnings</Text>
              <Text className="text-emerald-600 text-2xl font-bold">₹{mockWalletData.lifetimeEarnings.toLocaleString()}</Text>
              <Text className="text-gray-500 text-xs mt-2">Total earned</Text>
            </View>
          </View>
        </View>

        {/* Settlement Status Tracker */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Settlement Status</Text>
            <TouchableOpacity onPress={handleSettlementHistory}>
              <Text className="text-emerald-600 font-semibold text-sm">History</Text>
            </TouchableOpacity>
          </View>

          {/* Cashout Request Card */}
          {mockWalletData.recentCashouts[0] && (
            <View className="bg-gray-50 rounded-xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 font-bold text-base">₹{mockWalletData.recentCashouts[0].amount.toLocaleString()}</Text>
                <View className={`px-3 py-1 rounded-full ${mockWalletData.recentCashouts[0].status === 'completed' ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  <Text className={`text-xs font-semibold ${mockWalletData.recentCashouts[0].status === 'completed' ? 'text-emerald-700' : 'text-orange-700'}`}>
                    {mockWalletData.recentCashouts[0].status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>

              {/* Timeline */}
              <View className="flex-row justify-between items-start">
                <View className="flex-row justify-between">
                  <View className="flex-row justify-between">
                    {[
                      { label: 'Requested', key: 'requested' },
                      { label: 'Approved', key: 'approved' },
                      { label: 'Transferred', key: 'transferred' },
                      { label: 'Completed', key: 'completed' },
                    ].map((step) => (
                      <View key={step.key} className="flex-1 items-center">
                        <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center mb-2">
                          <Feather name="check-square" size={16} color="#fff" />
                        </View>
                        <Text className="text-xs text-gray-600 text-center">
                          {step.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>
            </View>
          )}

          <Text className="text-xs text-gray-600 mt-2">
            Settlement Cycle: T+2 days | Minimum: ₹1,000 | Admin approval required
          </Text>
        </View>

        {/* Earnings Breakdown */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Earnings Breakdown</Text>

          {/* Filter Tabs */}
          <View className="flex-row gap-2 mb-4">
            {[
              { label: 'Today', value: 'today' },
              { label: 'This Week ', value: 'week' },
              { label: 'This Month', value: 'month' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setActiveEarningsFilter(filter.value as any)}
                className={`px-3 py-2 rounded-lg ${activeEarningsFilter === filter.value ? 'bg-emerald-500' : 'bg-gray-100 border border-gray-200'}`}
              >
                <Text className={`text-sm font-semibold ${activeEarningsFilter === filter.value ? 'text-white' : 'text-gray-700'}`}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Earnings Display */}
          <View className="bg-emerald-50 rounded-xl p-4 items-center">
            <Text className="text-gray-600 text-sm mb-2">{getEarningsLabel()} Earnings</Text>
            <Text className="text-3xl font-bold text-emerald-600">₹{getEarningsAmount().toLocaleString()}</Text>
          </View>
        </View>

        {/* Bank Account Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-3">Bank Account</Text>

          <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-3">
              <View>
                <Text className="text-gray-600 text-xs mb-1">Bank Name</Text>
                <Text className="text-gray-900 font-bold text-base">{mockWalletData.bankAccount.name}</Text>
              </View>
              <View className="bg-emerald-100 px-2 py-1 rounded-full">
                <Text className="text-emerald-700 text-xs font-semibold">Verified</Text>
              </View>
            </View>

            <View className="mb-3 pb-3 border-b border-blue-200">
              <Text className="text-gray-600 text-xs mb-1">Account Number</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold text-sm">
                  {showBankNumber ? mockWalletData.bankAccount.accountNumber : '••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowBankNumber(!showBankNumber)}>
                  {showBankNumber ? (
                    <Feather name="eye-off" size={16} color="#6b7280" />
                  ) : (
                    <Feather name="eye" size={16} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-gray-600 text-xs mb-1">IFSC Code</Text>
              <Text className="text-gray-900 font-semibold text-sm">{mockWalletData.bankAccount.ifsc}</Text>
            </View>
          </View>

          {/* Bank Account Actions */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleViewBankAccount}
              className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-2.5 items-center justify-center"
            >
              <Text className="text-blue-700 font-semibold text-sm">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditBankAccount}
              className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2.5 items-center justify-center"
            >
              <Text className="text-emerald-700 font-semibold text-sm">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Transaction History */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Transaction History</Text>

          {mockWalletData.transactions.map((transaction) => (
            <View key={transaction.id} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">{transaction.description}</Text>
                <Text className="text-gray-500 text-xs mt-1">{transaction.date}</Text>
              </View>
              <Text className={`text-base font-bold ${transaction.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
              </Text>
            </View>
          ))}
        </View>

        {/* Info & Rules */}
        <View className="bg-blue-50 mx-4 my-4 rounded-xl p-4 border border-blue-200">
          <Text className="text-blue-900 font-semibold text-sm mb-2">Settlement Information</Text>
          <Text className="text-blue-800 text-xs leading-5">
            • Settlement cycle: T+2 business days{'\n'}
            • Minimum cashout: ₹1,000{'\n'}
            • Admin approval required for all withdrawals{'\n'}
            • Funds transferred to your verified bank account
          </Text>
        </View>
      </ScrollView>

      {cashoutModalVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}


      {/* Cashout Modal */}
      <Modal
        visible={cashoutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCashoutModalVisible(false)}
      >
        <View className="flex-1 bg-transparent bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Request Cashout</Text>
              <TouchableOpacity onPress={() => setCashoutModalVisible(false)}>
                <Text className="text-gray-600 text-2xl">×</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-emerald-50 rounded-xl p-3 mb-4 border border-emerald-200">
              <Text className="text-emerald-700 text-xs font-semibold mb-1">Available to Withdraw</Text>
              <Text className="text-emerald-600 text-3xl font-bold">₹{mockWalletData.availableBalance.toLocaleString()}</Text>
            </View>

            <Text className="text-gray-600 text-sm font-medium mb-2">Enter Amount</Text>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
              <Text className="text-2xl text-gray-900 font-bold">₹</Text>
              <TextInput
                placeholder="0"
                value={cashoutAmount}
                onChangeText={setCashoutAmount}
                keyboardType="numeric"
                className="flex-1 ml-2 text-2xl text-gray-900 font-bold"
                placeholderTextColor="#d1d5db"
              />
            </View>

            <Text className="text-gray-500 text-xs mb-6">Minimum: ₹1,000 | Maximum: ₹{mockWalletData.availableBalance.toLocaleString()}</Text>

            {/* Breakdown */}
            {cashoutAmount && (
              <View className="bg-gray-50 rounded-xl p-3 mb-6">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600 text-sm">Cashout Amount</Text>
                  <Text className="text-gray-900 font-semibold">₹{parseInt(cashoutAmount).toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 text-sm">Processing Time</Text>
                  <Text className="text-gray-900 font-semibold">2 business days</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleRequestCashout}
              disabled={cashoutLoading}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${cashoutLoading ? 'opacity-50' : ''}`}
            >
              {cashoutLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Request Cashout</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCashoutModalVisible(false)}
              className="mt-3 py-3 items-center"
            >
              <Text className="text-gray-600 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}