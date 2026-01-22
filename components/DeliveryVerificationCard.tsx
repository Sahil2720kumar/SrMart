import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'

const DeliveryVerificationCard = () => {
  return (
    <View>
      {/* Welcome Header */}
      <View className="items-center mb-8 mt-4">
        <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
          <Feather name="package" size={40} color="white" />
        </View>
        <Text className="text-3xl font-bold text-white mb-2 text-center">
          Welcome Gandhiji
        </Text>
        <Text className="text-indigo-100 text-sm text-center">
          Complete verification to start earning
        </Text>
      </View>

      {/* Admin Verification Card */}
      <View className="bg-white rounded-3xl p-6 mb-5 shadow-lg">
        <View className="flex-row items-start justify-between mb-4">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              Admin Verification
            </Text>
            <Text className="text-sm text-gray-500">
              Your profile is under review
            </Text>
          </View>
          <View className="bg-indigo-600 p-3 rounded-2xl shadow-md">
            <Feather name="shield" size={24} color="white" />
          </View>
        </View>

        <View className="self-start flex-row items-center gap-2 px-4 py-2.5 rounded-full bg-amber-100 border border-amber-200 shadow-sm">
          <View className="w-2 h-2 rounded-full bg-amber-500" />
          <Text className="text-sm font-bold capitalize text-amber-700">
            pending
          </Text>
        </View>

        <View className="mt-5 p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <View className="flex-row gap-3">
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
              <Feather name="info" size={20} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                What's next?
              </Text>
              <Text className="text-xs text-gray-600 leading-5">
                Our team is reviewing your documents. You'll receive a notification once approved.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* KYC Progress Card */}
      <View className="bg-white rounded-3xl p-6 mb-5 shadow-lg">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-xl font-bold text-gray-900 mb-1">
              Identity Verification
            </Text>
            <Text className="text-sm text-gray-500">
              1 of 2 steps completed
            </Text>
          </View>
          <View>
            <Text className="text-3xl font-bold text-indigo-600">
              50%
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-4">
          <View className="w-12 h-12 bg-green-500 rounded-2xl items-center justify-center shadow-md">
            <Feather name="check" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Government ID</Text>
            <Text className="text-xs text-green-600 font-semibold">✓ Uploaded successfully</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-6">
          <View className="w-12 h-12 rounded-2xl items-center justify-center shadow-md bg-gray-200">
            <Feather name="camera" size={24} color="#9ca3af" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-500">
              Selfie Verification
            </Text>
            <Text className="text-xs text-gray-500">Pending</Text>
          </View>
        </View>

        <View className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
          <View className="h-full bg-indigo-600 rounded-full" style={{ width: '50%' }} />
        </View>

        <TouchableOpacity
          className="bg-indigo-600 py-4 rounded-2xl shadow-lg flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <Feather name="camera" size={20} color="white" />
          <Text className="text-white font-bold text-base">
            Complete Verification
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-orange-50 border-l-4 border-orange-400 p-5 rounded-2xl flex-row gap-4 shadow-sm">
        <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
          <Feather name="alert-circle" size={20} color="#ea580c" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-orange-900 mb-1">Important Notice</Text>
          <Text className="text-sm text-orange-800 leading-5">
            Orders will be assigned only after verification completion. Complete all steps to start earning.
          </Text>
        </View>
      </View>
    </View>

  )
}

export default DeliveryVerificationCard