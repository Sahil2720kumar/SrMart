import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+91');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  const handleSendOTP = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/delivery/auth/verify-otp',
        params: { phone: `${countryCode}${phoneNumber}`, isNewUser: 'false' }
      });
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mt-12 mb-8">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4">
              <Feather name="package" size={40} color="#4f46e5" />
            </View>
            <Text className="text-white text-3xl font-bold mb-2">DeliveryPro</Text>
            <Text className="text-indigo-200 text-base">Login to start delivering</Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-lg">
            <Text className="text-gray-700 font-semibold mb-2">Mobile Number</Text>
            
            <View className="flex-row items-center border-2 border-gray-200 rounded-xl mb-2">
              <View className="bg-gray-50 px-4 py-4 border-r border-gray-200">
                <Text className="text-gray-700 font-semibold">{countryCode}</Text>
              </View>
              <TextInput
                className="flex-1 px-4 py-4 text-gray-900 text-base"
                placeholder="Enter mobile number"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError('');
                }}
              />
            </View>

            <View className="flex-row items-center mb-4">
              <Feather name="info" size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-2">
                We'll send an OTP to this number
              </Text>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-center">
                <Feather name="alert-circle" size={16} color="#ef4444" />
                <Text className="text-red-600 text-sm ml-2">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center justify-center ${
                isValidPhone && !isLoading ? 'bg-[#4f46e5]' : 'bg-gray-300'
              }`}
              disabled={!isValidPhone || isLoading}
              onPress={handleSendOTP}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="items-center mt-8 mb-6">
            <View className="flex-row items-center mb-4 w-full">
              <View className="flex-1 h-px bg-indigo-300" />
              <Text className="text-indigo-200 mx-4">New to the app?</Text>
              <View className="flex-1 h-px bg-indigo-300" />
            </View>

            <TouchableOpacity
              className="bg-white/20 rounded-xl py-3 px-8 border-2 border-white/30"
              onPress={() => router.push('/delivery/auth/signup')}
            >
              <Text className="text-white font-semibold text-base">Create new account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}