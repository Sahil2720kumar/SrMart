import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const mockBankAccount = {
  bankName: 'HDFC Bank',
  accountNumber: '****5678',
  ifscCode: 'HDFC0001234',
  accountHolder: 'Rajesh Kumar',
  verificationStatus: 'verified',
  lastUpdated: '15 Jan 2025',
};

export default function BankDetailsScreen() {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const handleAddBankAccount = async () => {
    setProcessingAction('add');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[v0] Navigating to Add Bank Account screen');
      router.push("/vendor/profile/documents/bank/add")
    } catch (error) {
      Alert.alert('Error', 'Failed to open add bank account');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleEditBankAccount = async () => {
    setProcessingAction('edit');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[v0] Navigating to Edit Bank Account screen');
      router.push("/vendor/profile/documents/bank/update")
    } catch (error) {
      Alert.alert('Error', 'Failed to open edit bank account');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleViewDetails = () => {
    Alert.alert(
      'Bank Account Details',
      `Bank: ${mockBankAccount.bankName}\nAccount Holder: ${mockBankAccount.accountHolder}\nAccount Number: ${mockBankAccount.accountNumber}\nIFSC Code: ${mockBankAccount.ifscCode}\nStatus: ${mockBankAccount.verificationStatus}`
    );
  };

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back()
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Bank & Payout</Text>
          <Text className="text-sm text-gray-600 mt-1">Manage your bank details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Current Bank Account Card */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Current Bank Account</Text>

          <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200 mb-4">
            {/* Bank Details */}
            <View className="mb-4">
              <Text className="text-gray-600 text-xs font-semibold mb-1">BANK NAME</Text>
              <Text className="text-gray-900 font-bold text-lg">{mockBankAccount.bankName}</Text>
            </View>

            <View className="mb-4 pb-4 border-b border-blue-300">
              <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT HOLDER</Text>
              <Text className="text-gray-900 font-semibold text-base">{mockBankAccount.accountHolder}</Text>
            </View>

            <View className="mb-4 pb-4 border-b border-blue-300">
              <Text className="text-gray-600 text-xs font-semibold mb-1">ACCOUNT NUMBER</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold text-base">
                  {showAccountNumber ? mockBankAccount.accountNumber : '••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowAccountNumber(!showAccountNumber)}>
                  {showAccountNumber ? (
                    <Feather name='eye-off' size={18} color="#6b7280" />
                  ) : (
                    <Feather name='eye' size={18} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-gray-600 text-xs font-semibold mb-1">IFSC CODE</Text>
              <Text className="text-gray-900 font-semibold text-base">{mockBankAccount.ifscCode}</Text>
            </View>

            {/* Verification Status */}
            <View className="bg-white bg-opacity-60 rounded-lg p-3 flex-row items-center justify-between">
              <Text className="text-gray-600 text-xs font-semibold">Verification Status</Text>
              <View className="bg-emerald-100 px-3 py-1.5 rounded-full">
                <Text className="text-emerald-700 text-xs font-bold">Verified</Text>
              </View>
            </View>

            <Text className="text-gray-500 text-xs mt-3">
              Last updated: {mockBankAccount.lastUpdated}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleViewDetails}
              className="flex-1 bg-blue-50 border border-blue-200 rounded-xl py-3 items-center justify-center active:opacity-70"
            >
              <Text className="text-blue-700 font-bold text-sm">View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEditBankAccount}
              disabled={processingAction === 'edit'}
              className={`flex-1 bg-emerald-500 rounded-xl py-3 items-center justify-center active:opacity-70 ${processingAction === 'edit' ? 'opacity-50' : ''}`}
            >
              {processingAction === 'edit' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Feather name='edit-3' size={16} color="#fff" />
                  <Text className="text-white font-bold text-sm">Edit</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Banner */}
        <View className="px-4 mb-6">
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Text className="text-blue-900 text-sm font-semibold mb-1">Payout Information</Text>
            <Text className="text-blue-800 text-xs leading-5">
              Payouts are credited to your bank account after admin verification and approval. Settlement cycle is T+2 business days.
            </Text>
          </View>
        </View>

        {/* Add Bank Account Section */}
        <View className="px-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Add Another Account</Text>
          
          <TouchableOpacity
            onPress={handleAddBankAccount}
            disabled={processingAction === 'add'}
            className={`bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl py-6 items-center justify-center active:opacity-70 ${processingAction === 'add' ? 'opacity-50' : ''}`}
          >
            {processingAction === 'add' ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <View className="items-center gap-2">
                <Feather name='plus' size={28} color="#059669" />
                <Text className="text-emerald-700 font-bold text-base">Add Bank Account</Text>
                <Text className="text-emerald-600 text-xs">Requires admin verification</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
