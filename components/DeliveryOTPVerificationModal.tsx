import { View, Text, Modal, TextInput, TouchableOpacity } from 'react-native'
import React from 'react'
import { Feather } from '@expo/vector-icons'
import { Order } from '@/store/useDeliveryStore'

interface DeliveryOTPVerificationModalProps{
  showOtpModal:boolean
  setShowOtpModal:(showOtpModal:boolean)=>void
  selectedOrderForOtp:Order | null
  otpInput:string
  setOtpInput:(otpInput:string)=>void
  handleVerifyOtp:()=>void
}

const DeliveryOTPVerificationModal = ({showOtpModal,selectedOrderForOtp,setOtpInput,otpInput,setShowOtpModal,handleVerifyOtp}:DeliveryOTPVerificationModalProps) => {
  return (
    <Modal
    visible={showOtpModal}
    animationType="fade"
    transparent={true}
    onRequestClose={() => setShowOtpModal(false)}
  >
    <View className="flex-1 bg-black/50 items-center justify-center p-4">
      <View className="bg-white rounded-3xl w-full max-w-md p-6">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Feather name="lock" size={32} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Verify Delivery OTP</Text>
          <Text className="text-sm text-gray-600 text-center">
            Ask customer for OTP to complete delivery
          </Text>
        </View>

        {selectedOrderForOtp && (
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Customer: {selectedOrderForOtp?.customer?.name || "test name"}
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Order: {selectedOrderForOtp.id}
            </Text>

            <TextInput
              maxLength={4}
              value={otpInput}
              onChangeText={(text) => setOtpInput(text.replace(/\D/g, ''))}
              placeholder="Enter 4-digit OTP"
              keyboardType="number-pad"
              className="w-full text-center text-3xl font-bold tracking-widest border-2 border-gray-300 rounded-xl p-4 text-gray-900"
            />
          </View>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => {
              setShowOtpModal(false);
              setOtpInput('');
            }}
            className="flex-1 bg-gray-200 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="font-bold text-gray-700 text-center">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVerifyOtp}
            disabled={otpInput.length !== 4}
            className={`flex-1 py-3 rounded-xl ${otpInput.length === 4 ? 'bg-green-500' : 'bg-gray-300'
              }`}
            activeOpacity={0.8}
          >
            <Text className="font-bold text-white text-center">
              Verify & Complete
            </Text>
          </TouchableOpacity>
        </View>

        {selectedOrderForOtp && (
          <Text className="text-xs text-center text-gray-500 mt-4">
            For testing: OTP is {selectedOrderForOtp.deliveryOtp}
          </Text>
        )}
      </View>
    </View>
  </Modal>
  )
}

export default DeliveryOTPVerificationModal