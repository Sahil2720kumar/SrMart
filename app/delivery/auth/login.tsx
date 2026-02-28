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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import Toast from 'react-native-toast-message';
import { setupOneSignalUser } from '@/services/onesignal';

export default function DeliveryLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setSession } = useAuthStore();
  const { setUser, setDeliveryBoyProfile } = useProfileStore();

  const isValidEmail = /^\S+@\S+\.\S+$/.test(email);
  const canLogin = isValidEmail && password.length >= 6;

  const handleLoginSuccess = (user) => {
    setupOneSignalUser({ id: user.auth_id, role: user.role });
  };

  const handleLogin = async () => {
    if (!canLogin) {
      setError('Enter valid email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;
      if (!data.session) throw new Error('Login failed');

      const authUserId = data.user.id;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUserId)
        .single();

      if (userError) throw userError;

      if (userData.role !== 'delivery_boy') {
        throw new Error('This account is not a delivery partner');
      }

      const { data: deliveryProfile, error: deliveryError } = await supabase
        .from('delivery_boys')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (deliveryError) throw deliveryError;

      setSession(data.session);
      setUser(userData);
      setDeliveryBoyProfile(deliveryProfile);
      handleLoginSuccess(userData)
      Toast.show({
        type: 'success',
        text1: 'Welcome back! 👋',
        text2: 'Signed in successfully.',
        position: 'top',
      });

      router.replace('/delivery/home');
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: err?.message || 'Invalid email or password.',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="items-center mt-12 mb-8">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4">
              <Feather name="package" size={40} color="#4f46e5" />
            </View>
            <Text className="text-white text-3xl font-bold mb-2">Delivery Login</Text>
            <Text className="text-indigo-200">Sign in to start delivering</Text>
          </View>

          {/* Form */}
          <View className="bg-white rounded-3xl p-6 shadow-lg">
            <Text className="text-gray-700 font-semibold mb-2">Email</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
              placeholder="Enter email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => { setEmail(text); setError(''); }}
            />

            <Text className="text-gray-700 font-semibold mb-2">Password</Text>
            <TextInput
              className="border-2 border-gray-200 rounded-xl px-4 py-4 mb-4"
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setError(''); }}
            />

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-center">
                <Feather name="alert-circle" size={16} color="#ef4444" />
                <Text className="text-red-600 text-sm ml-2">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${canLogin && !isLoading ? 'bg-[#4f46e5]' : 'bg-gray-300'}`}
              disabled={!canLogin || isLoading}
              onPress={handleLogin}
            >
              {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Login</Text>}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="items-center mt-8">
            <Text className="text-indigo-200 mb-2">New delivery partner?</Text>
            <TouchableOpacity onPress={() => router.push('/delivery/auth/signup')}>
              <Text className="text-white font-bold underline">Create account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}