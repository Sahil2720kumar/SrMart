import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+91');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);
  const isValidName = fullName.trim().length >= 3;
  const canContinue = isValidName && isValidPhone && termsAccepted;

  const handleContinue = async () => {
    const newErrors = { name: '', phone: '' };

    if (!isValidName) {
      newErrors.name = 'Please enter your full name (min 3 characters)';
    }
    if (!isValidPhone) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);

    if (newErrors.name || newErrors.phone) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push({
        pathname: '/delivery/auth/verify-otp',
        params: { 
          phone: `${countryCode}${phoneNumber}`, 
          isNewUser: 'true',
          name: fullName 
        }
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
            <Text className="text-white text-3xl font-bold mb-2">Join as Delivery Partner</Text>
            <Text className="text-indigo-200 text-base text-center">
              Earn money by delivering grocery orders
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
            <View className={`border-2 rounded-xl mb-2 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}>
              <TextInput
                className="px-4 py-4 text-gray-900 text-base"
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setErrors(prev => ({ ...prev, name: '' }));
                }}
              />
            </View>
            {errors.name ? (
              <Text className="text-red-600 text-sm mb-4">{errors.name}</Text>
            ) : (
              <View className="mb-4" />
            )}

            <Text className="text-gray-700 font-semibold mb-2">Mobile Number</Text>
            <View className={`flex-row items-center border-2 rounded-xl mb-2 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}>
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
                  setErrors(prev => ({ ...prev, phone: '' }));
                }}
              />
            </View>
            {errors.phone ? (
              <Text className="text-red-600 text-sm mb-4">{errors.phone}</Text>
            ) : (
              <View className="mb-4" />
            )}

            <TouchableOpacity 
              className="flex-row items-start mb-6"
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                termsAccepted ? 'bg-[#4f46e5] border-[#4f46e5]' : 'border-gray-400'
              }`}>
                {termsAccepted && <Feather name="check" size={14} color="white" />}
              </View>
              <Text className="flex-1 text-gray-600 text-sm">
                I agree to the <Text className="text-[#4f46e5] font-semibold">Terms & Conditions</Text> and <Text className="text-[#4f46e5] font-semibold">Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`rounded-xl py-4 items-center justify-center ${
                canContinue && !isLoading ? 'bg-[#4f46e5]' : 'bg-gray-300'
              }`}
              disabled={!canContinue || isLoading}
              onPress={handleContinue}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="bg-white/10 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="clock" size={20} color="white" />
              <Text className="text-white ml-3 text-base">Flexible working hours</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Feather name="dollar-sign" size={20} color="white" />
              <Text className="text-white ml-3 text-base">Weekly payouts</Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="map-pin" size={20} color="white" />
              <Text className="text-white ml-3 text-base">Nearby deliveries</Text>
            </View>
          </View>

          <View className="items-center mb-6">
            <Text className="text-indigo-200 mb-2">Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/delivery/auth/login')}>
              <Text className="text-white font-bold text-base underline">Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}