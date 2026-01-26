import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

export default function DeliverySignupScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const { setUser, setDeliveryBoyProfile } = useProfileStore();

  /* ---------------- FORM STATE ---------------- */
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */
  const isValidName = fullName.trim().length >= 3;
  const isValidPhone = /^\d{10}$/.test(phoneNumber);
  const canContinueStep1 = isValidName && isValidPhone && termsAccepted;

  /* ---------------- STEP HANDLERS ---------------- */
  const handleContinue = () => {
    if (!canContinueStep1) return;
    setStep(2);
  };

  const handleDeliveryBoySignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      /* ---------------- AUTH SIGNUP ---------------- */
      const { data: signupData, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              role: 'delivery_boy',
              phone: phoneNumber,
              name: fullName,
            },
          },
        });

      if (signupError) throw signupError;
      if (!signupData.user) throw new Error('Signup failed');

      // Email confirmation
      if (!signupData.session) {
        Alert.alert(
          'Check Your Email',
          'Please verify your email to activate your delivery partner account.',
          [{ text: 'OK', onPress: () => router.replace('/delivery/auth/login') }]
        );
        return;
      }

      const authUserId = signupData.user.id;

      /* -------- WAIT FOR TRIGGERS -------- */
      await new Promise((r) => setTimeout(r, 1000));

      /* ---------------- FETCH USER ---------------- */
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUserId)
        .maybeSingle();

      if (!userData || userData.role !== 'delivery_boy') {
        throw new Error('Invalid role detected');
      }

      /* ---------------- FETCH DELIVERY PROFILE ---------------- */
      const { data: deliveryData } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (!deliveryData) {
        throw new Error('Delivery profile not created');
      }

      /* ---------------- COMMIT STATE ---------------- */
      setSession(signupData.session);
      setUser(userData);
      setDeliveryBoyProfile(deliveryData);

      Alert.alert(
        'Success',
        'Your delivery partner account has been created! Please complete KYC.',
        [{ text: 'OK', onPress: () => router.replace('/delivery/profile') }]
      );
    } catch (error: any) {
      console.error('Delivery signup error:', error?.message);
      Alert.alert(
        'Signup Failed',
        error?.message || 'Unable to create delivery partner account'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
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
            <Text className="text-white text-3xl font-bold mb-2">
              Join as Delivery Partner
            </Text>
            <Text className="text-indigo-200 text-base text-center">
              Earn money by delivering grocery orders
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            {step === 1 ? (
              <>
                {/* STEP 1 */}
                <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text className="text-gray-700 font-semibold mb-2">
                  Mobile Number
                </Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />

                <TouchableOpacity
                  className="flex-row items-center mb-6"
                  onPress={() => setTermsAccepted(!termsAccepted)}
                >
                  <View
                    className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                      termsAccepted
                        ? 'bg-[#4f46e5] border-[#4f46e5]'
                        : 'border-gray-400'
                    }`}
                  >
                    {termsAccepted && (
                      <Feather name="check" size={14} color="white" />
                    )}
                  </View>
                  <Text className="text-gray-600 text-sm">
                    I agree to Terms & Privacy Policy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={!canContinueStep1}
                  onPress={handleContinue}
                  className={`rounded-xl py-4 items-center ${
                    canContinueStep1 ? 'bg-[#4f46e5]' : 'bg-gray-300'
                  }`}
                >
                  <Text className="text-white font-bold">Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* STEP 2 */}
                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
                  placeholder="Email"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
                  placeholder="Password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-6"
                  placeholder="Confirm Password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  onPress={handleDeliveryBoySignUp}
                  disabled={isLoading}
                  className="bg-[#4f46e5] rounded-xl py-4 items-center"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold">
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View className="items-center mb-6">
            <Text className="text-indigo-200 mb-2">Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/delivery/auth/login')}
            >
              <Text className="text-white font-bold underline">Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
