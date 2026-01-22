import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyOTPScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone as string || '9876543210';
  const type = params.type as string || 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Timer countdown
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] OTP verification:', { phone, otp: otpCode, type });
      
      Alert.alert('Success', 'Phone number verified successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate based on type
            if (type === 'signup') {
              router.replace('/vendor/(tabs)/profile/privacy-policy'); // Navigate to main app
            } else {
              router.replace('/vendor/auth/reset-password'); // Navigate to reset password
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[v0] Resending OTP to:', phone);
      Alert.alert('OTP Sent', 'A new OTP has been sent to your phone number');
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-emerald-50 to-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-8">
            {/* Header */}
            <View className="flex-row items-center mb-12">
              <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
                <Feather name="chevron-left" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>

            {/* Icon */}
            <View className="items-center mb-8">
              <View className="bg-emerald-100 w-24 h-24 rounded-full items-center justify-center mb-6">
                <Feather name="smartphone" size={48} color="#10b981" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 text-center">
                Verify Your Number
              </Text>
              <Text className="text-gray-600 text-base mt-3 text-center px-4">
                We've sent a 6-digit code to
              </Text>
              <Text className="text-gray-900 font-bold text-lg mt-1">
                +91 {phone}
              </Text>
            </View>

            {/* OTP Input */}
            <View className="mb-8">
              <Text className="text-gray-700 font-semibold text-sm mb-4 text-center">
                Enter OTP Code
              </Text>
              <View className="flex-row justify-between px-4">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    maxLength={1}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    className="bg-white border-2 border-gray-300 rounded-xl w-12 h-14 text-center text-xl font-bold text-gray-900 shadow-sm"
                    style={{
                      borderColor: digit ? '#10b981' : '#d1d5db',
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Timer / Resend */}
            <View className="items-center mb-8">
              {!canResend ? (
                <View className="flex-row items-center gap-2">
                  <Feather name="clock" size={18} color="#6b7280" />
                  <Text className="text-gray-600 text-sm">
                    Resend code in{' '}
                    <Text className="font-bold text-emerald-600">{formatTime(timer)}</Text>
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={isLoading}
                  className="flex-row items-center gap-2"
                >
                  <Feather name="refresh-cw" size={18} color="#10b981" />
                  <Text className="text-emerald-600 font-bold text-base">Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={isLoading || otp.some(d => !d)}
              className={`bg-emerald-500 rounded-xl py-4 items-center justify-center shadow-md ${
                (isLoading || otp.some(d => !d)) ? 'opacity-50' : ''
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-white font-bold text-base">Verify & Continue</Text>
                  <Feather name="check-circle" size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Help Section */}
            <View className="mt-auto pt-8 pb-6">
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="help-circle" size={20} color="#d97706" />
                  <View className="flex-1">
                    <Text className="text-amber-900 font-semibold text-sm mb-1">
                      Didn't receive the code?
                    </Text>
                    <Text className="text-amber-800 text-xs leading-5">
                      Check your phone's messages. If you still haven't received it, tap "Resend OTP" above or contact support.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Edit Phone Number */}
              <TouchableOpacity
                onPress={handleGoBack}
                className="mt-4 items-center py-3"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="edit-2" size={16} color="#6b7280" />
                  <Text className="text-gray-600 font-semibold text-sm">
                    Change Phone Number
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}