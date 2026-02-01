import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function Index() {
  const { initialized } = useAuthStore();
  const { user } = useProfileStore();

  

  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);

  // ✅ Always run hooks first
  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then(value => {
      setOnboardingDone(value === 'true');
      setLoading(false);
    });
  }, []);

  // ⏳ Wait for auth + onboarding check
  if (loading || !initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#16a34a' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>FreshMart</Text>
        <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // ✅ Redirects AFTER hooks
  if (onboardingDone) {
    if (!user) return <Redirect href="/auth/login" />;
    if (user.role === 'customer') return <Redirect href="/(tabs)/customer" />;
    if (user.role === 'vendor') return <Redirect href="/vendor/dashboard" />;
    if (user.role === 'delivery_boy') return <Redirect href="/delivery/home" />;
  }

  // 👋 Onboarding screens
  if (index < 3) {
    const next = async () => {
      if (index < 2) {
        ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
        setIndex(prev => prev + 1);
      } else {
        await AsyncStorage.setItem('onboarding_done', 'true');
        setOnboardingDone(true);
      }
    };

    return (
      <LinearGradient colors={['#f0fdf4', '#ffffff']} style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={{ flex: 1 }}>
          {/* onboarding UI unchanged */}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // 👇 Role selection screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#16a34a', padding: 24 }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* CTA buttons unchanged */}
    </SafeAreaView>
  );
}
