import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phone, isNewUser } = params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const verifyOTP = async (otpCode: string) => {
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      
      if (otpCode === '123456') {
        if (isNewUser === 'true') {
          router.replace('/delivery/profile');
        } else {
          router.replace('/delivery/home');
        }
      } else {
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        triggerShake();
        inputRefs.current[0]?.focus();
      }
    }, 1500);
  };

  const handleResendOTP = () => {
    setTimer(30);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedPhone = phone ? phone.replace(/(\d{3})\d{4}(\d{3})/, '$1XXXX$2') : '';

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      <View className="flex-1 px-6">
        <TouchableOpacity 
          className="mt-4 mb-8"
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <Text className="text-white text-3xl font-bold mb-2">Verify OTP</Text>
          <Text className="text-indigo-200 text-base">OTP sent to {maskedPhone}</Text>
        </View>

        <Animated.View 
          className="bg-white rounded-3xl p-6 shadow-lg"
          style={{ transform: [{ translateX: shakeAnimation }] }}
        >
          <Text className="text-gray-700 font-semibold mb-4 text-center">Enter 6-digit OTP</Text>

          <View className="flex-row justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                  error ? 'border-red-400 bg-red-50' : digit ? 'border-[#4f46e5] bg-indigo-50' : 'border-gray-300'
                }`}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
              />
            ))}
          </View>

          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-center">
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text className="text-red-600 text-sm ml-2">{error}</Text>
            </View>
          ) : null}

          <View className="items-center mb-4">
            {canResend ? (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text className="text-[#4f46e5] font-semibold text-base">Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-500 text-sm">
                Resend OTP in {formatTime(timer)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 items-center justify-center ${
              otp.every(d => d !== '') && !isLoading ? 'bg-[#4f46e5]' : 'bg-gray-300'
            }`}
            disabled={!otp.every(d => d !== '') || isLoading}
            onPress={() => verifyOTP(otp.join(''))}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Verify & Continue</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View className="mt-6 bg-white/10 rounded-xl p-4">
          <View className="flex-row items-center">
            <Feather name="info" size={16} color="white" />
            <Text className="text-white text-sm ml-2">
              Use OTP: <Text className="font-bold">123456</Text> for demo
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}