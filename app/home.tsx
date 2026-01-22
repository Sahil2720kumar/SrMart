import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Fresh groceries,\nright to your door',
    description: 'Daily essentials delivered fast with care',
    icon: 'shopping-bag',
  },
  {
    title: 'Trusted quality\nfrom verified sellers',
    description: 'Handpicked products you can rely on',
    icon: 'award',
  },
  {
    title: 'Save more\neveryday',
    description: 'Exclusive deals and smart prices',
    icon: 'gift',
  },
];

export default function WelcomeScreen() {
  const [index, setIndex] = useState(0);
  const ref = useRef<ScrollView>(null);

  const next = () => {
    if (index < onboardingData.length - 1) {
      ref.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      setIndex(onboardingData.length);
    }
  };

  if (index < onboardingData.length) {
    return (
      <LinearGradient
        colors={['#f0fdf4', '#ffffff']}
        className="flex-1"
      >
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView className="flex-1">
          {/* Skip */}

          <ScrollView
            ref={ref}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) =>
              setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            scrollEventThrottle={16}
          >
            {onboardingData.map((item, i) => (
              <View
                key={i}
                style={{ width }}
                className="flex-1 items-center justify-center px-8"
              >
                {/* Icon */}
                <View className="mb-10">
                  <Feather name={item.icon as any} size={64} color="#16a34a" />
                </View>

                {/* Text */}
                <Text className="text-4xl font-extrabold text-gray-900 text-center leading-tight mb-4">
                  {item.title}
                </Text>
                <Text className="text-base text-gray-500 text-center leading-6 max-w-sm">
                  {item.description}
                </Text>

                {/* Card */}
                <View className="mt-14 w-full rounded-3xl bg-green-50 h-40 shadow-sm items-center justify-center">
                  <Text className="text-green-700 font-semibold">
                    Beautiful illustration here 🌿
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          <View className="flex-row justify-center mb-6">
            {onboardingData.map((_, i) => (
              <View
                key={i}
                className={`mx-1 rounded-full ${i === index ? 'w-6 bg-green-600' : 'w-2 bg-gray-300'
                  } h-2`}
              />
            ))}
          </View>

          {/* CTA */}
          <View className="px-6 pb-10">
            <TouchableOpacity
              onPress={next}
              className="bg-green-600 rounded-2xl py-4 flex-row justify-center items-center"
            >
              <Text className="text-white font-bold text-lg mr-2">
                {index === onboardingData.length - 1
                  ? 'Get Started'
                  : 'Next'}
              </Text>
              <Feather name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-green-600 justify-between px-6 py-12">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Top Section */}
      <View className="items-center mt-12">
        <View className="bg-white/20 p-6 rounded-full mb-6">
          <Feather name="shopping-bag" size={48} color="white" />
        </View>

        <Text className="text-5xl font-extrabold text-white mb-3 text-center">
          FreshMart
        </Text>
        <Text className="text-green-100 text-center max-w-xs text-base leading-6">
          Groceries delivered fresh & fast, straight to your door
        </Text>
      </View>

      {/* Middle Section: CTA */}
      <View>
        <TouchableOpacity onPress={() => router.push("/auth/sign-up")} className="bg-white rounded-2xl py-4 mb-6 flex-row justify-center items-center shadow-lg">
          <Text className="text-green-600 font-bold text-lg mr-2">
            Continue as Customer
          </Text>
          <Feather name="chevron-right" size={22} color="#16a34a" />
        </TouchableOpacity>

        {/* Features Cards */}
        {['Fast delivery', 'Secure payments', 'Fresh quality'].map((t, i) => (
          <View
            key={i}
            className="flex-row items-center mb-3 bg-white/10 p-4  rounded-2xl"
          >
            <Feather name="check-circle" size={20} color="white" />
            <Text className="text-white ml-3 bg-transparent font-medium">{t}</Text>
          </View>
        ))}

        {/* Sign In */}
        <TouchableOpacity onPress={() => router.push("/auth/login")} className="mt-8 items-center">
          <Text className="text-white/80">
            Already have an account?{' '}
            <Text className="font-bold text-white">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
