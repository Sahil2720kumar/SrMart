import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ---------------- ERROR TYPES ---------------- */

const errorExamples = [
  {
    code: '404',
    title: 'Page Not Found',
    message: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
    icon: 'search',
    action: 'Go to Homepage',
  },
  {
    code: '500',
    title: 'Server Error',
    message: 'Something went wrong on our end. Our team has been notified and is working on a fix. Please try again later.',
    icon: 'alert-octagon',
    action: 'Try Again',
  },
  {
    code: '403',
    title: 'Access Denied',
    message: "You don't have permission to access this resource. Please contact support if you believe this is an error.",
    icon: 'lock',
    action: 'Contact Support',
  },
  {
    code: '408',
    title: 'Request Timeout',
    message: 'The request took too long to process. Please check your internet connection and try again.',
    icon: 'clock',
    action: 'Retry',
  },
  {
    code: 'NET001',
    title: 'No Internet Connection',
    message: 'Please check your internet connection and try again. Make sure you are connected to Wi-Fi or mobile data.',
    icon: 'wifi-off',
    action: 'Retry',
  },
  {
    code: 'AUTH001',
    title: 'Session Expired',
    message: 'Your session has expired for security reasons. Please log in again to continue.',
    icon: 'log-out',
    action: 'Login Again',
  },
  {
    code: 'PAY001',
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please check your payment details and try again.',
    icon: 'credit-card',
    action: 'Update Payment Method',
  },
  {
    code: 'ORD001',
    title: 'Order Not Found',
    message: 'We couldn\'t find the order you\'re looking for. It may have been cancelled or completed.',
    icon: 'package',
    action: 'View Orders',
  },
];

const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
  '404': 'search',
  '500': 'alert-octagon',
  '403': 'lock',
  '408': 'clock',
  'NET001': 'wifi-off',
  'AUTH001': 'log-out',
  'PAY001': 'credit-card',
  'ORD001': 'package',
  'default': 'alert-circle',
};

/* ------------------------------------------------------- */

interface ErrorProps {
  code: string;
  title?: string;
  message?: string;
  action?: string;
  onActionPress?: () => void;
  onDismiss?: () => void;
}

// Full Page Error Component
export const FullPageError = ({ code, title, message, action = 'Try Again', onActionPress }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;
  
  return (
    <View className="bg-emerald-500 flex-1 p-12 shadow-lg">
      <View className="items-center">
        <View className="w-28 h-28 bg-emerald-600 rounded-full items-center justify-center mb-6">
          <View className="w-24 h-24 bg-emerald-700 rounded-full items-center justify-center">
            <Feather name={iconName} size={52} color="white" />
          </View>
        </View>

        <View className="bg-emerald-600 px-5 py-2.5 rounded-full mb-5">
          <Text className="text-white font-bold text-sm tracking-wider">
            ERROR {code}
          </Text>
        </View>

        <Text className="text-3xl font-bold text-white mb-4 text-center">
          {errorExamples.find((item) => item.code === code)?.title}
        </Text>

        <Text className="text-emerald-100 text-center leading-7 mb-10 text-lg" style={{ maxWidth: 448 }}>
          {errorExamples.find((item) => item.code === code)?.message}
        </Text>

        <TouchableOpacity
          onPress={onActionPress}
          className="bg-white px-10 py-4 rounded-full shadow-md w-full"
          style={{ maxWidth: 384 }}
          activeOpacity={0.8}
        >
          <Text className="text-emerald-600 font-bold text-center text-base">
            {action}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-4 px-8 py-2 rounded-lg"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-center text-sm">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Compact Card Error Component
export const CompactCardError = ({ code, title, message, action = 'Try Again', onActionPress }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;

  return (
    <View className="bg-emerald-500 rounded-2xl p-6 shadow-md">
      <View className="flex-row items-start gap-5">
        <View className="w-14 h-14 bg-emerald-600 rounded-full items-center justify-center">
          <Feather name={iconName} size={28} color="white" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-xs text-emerald-100 font-bold">
              ERROR {code}
            </Text>
            <View className="w-1 h-1 bg-emerald-300 rounded-full" />
            <Text className="text-xs text-emerald-100">
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-white mb-2">
            {title}
          </Text>
          <Text className="text-sm text-emerald-100 leading-6 mb-5">
            {message}
          </Text>
          <TouchableOpacity
            onPress={onActionPress}
            className="bg-white py-3.5 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-emerald-600 font-semibold text-center">
              {action}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Toast/Banner Error Component
export const ToastError = ({ code, title, message, onDismiss }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;

  return (
    <View className="bg-emerald-500 rounded-2xl p-5 shadow-lg border-l-4 border-emerald-700">
      <View className="flex-row items-center gap-4">
        <View className="w-12 h-12 bg-emerald-600 rounded-full items-center justify-center">
          <Feather name={iconName} size={24} color="white" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-bold text-white">
              {title}
            </Text>
            <Text className="text-xs text-emerald-100">
              • {code}
            </Text>
          </View>
          <Text className="text-sm text-emerald-100">
            {message.substring(0, 80)}...
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          className="p-1 rounded-lg"
          activeOpacity={0.7}
        >
          <Feather name="x" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Minimal Error Component
export const MinimalError = ({ code, title, message, action = 'Try Again', onActionPress }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;

  return (
    <View className="bg-emerald-500 rounded-2xl p-8 shadow-sm">
      <View className="items-center">
        <Feather name={iconName} size={56} color="white" />
        <Text className="text-xs text-emerald-100 font-bold mb-2 mt-5">
          ERROR {code}
        </Text>
        <Text className="text-2xl font-bold text-white mb-3 text-center">
          {title}
        </Text>
        <Text className="text-sm text-emerald-100 text-center mb-8" style={{ maxWidth: 448 }}>
          {message}
        </Text>
        <View className="flex-row gap-3 w-full" style={{ maxWidth: 448 }}>
          <TouchableOpacity
            className="flex-1 border-2 border-white py-3 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold text-center">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onActionPress}
            className="flex-1 bg-white py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-emerald-600 font-semibold text-center">
              {action}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Detailed Card Error Component
export const DetailedCardError = ({ code, title, message, action = 'Try Again', onActionPress }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;

  return (
    <View className="bg-emerald-500 rounded-2xl shadow-md overflow-hidden">
      <View className="bg-emerald-600 p-5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <Feather name={iconName} size={24} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">
              {title}
            </Text>
            <Text className="text-emerald-100 text-xs">
              Error Code: {code}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        <View className="bg-emerald-600 rounded-xl p-5 mb-5">
          <Text className="text-xs text-emerald-100 font-bold mb-3">
            ERROR DETAILS
          </Text>
          <Text className="text-sm text-white leading-6">
            {message}
          </Text>
        </View>

        <View className="bg-emerald-600 rounded-xl p-5 mb-5">
          <Text className="text-xs text-emerald-100 font-bold mb-3">
            WHAT YOU CAN DO
          </Text>
          <View className="gap-2">
            <View className="flex-row items-start gap-2">
              <Text className="text-white mt-0.5">•</Text>
              <Text className="text-sm text-white flex-1">
                Check your internet connection
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-white mt-0.5">•</Text>
              <Text className="text-sm text-white flex-1">
                Clear your app cache and data
              </Text>
            </View>
            <View className="flex-row items-start gap-2">
              <Text className="text-white mt-0.5">•</Text>
              <Text className="text-sm text-white flex-1">
                Contact our support team if the issue persists
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={onActionPress}
          className="bg-white py-4 rounded-xl mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-emerald-600 font-bold text-center">
            {action}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border-2 border-white py-4 rounded-xl"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold text-center">
            Contact Support
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Alert Box Error Component
export const AlertBoxError = ({ code, title, message, action = 'Try Again', onActionPress }: ErrorProps) => {
  const iconName = iconMap[code] || iconMap.default;

  return (
    <View className="bg-emerald-500 border-2 border-emerald-700 rounded-2xl overflow-hidden shadow-lg">
      <View className="bg-emerald-600 px-5 py-2.5">
        <Text className="text-white font-bold text-xs tracking-wider">
          ERROR {code}
        </Text>
      </View>
      <View className="p-6">
        <View className="flex-row items-start gap-5 mb-5">
          <Feather name={iconName} size={32} color="white" />
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white mb-3">
              {title}
            </Text>
            <Text className="text-sm text-emerald-100 leading-6">
              {message}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onActionPress}
          className="bg-white py-3.5 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-emerald-600 font-bold text-center">
            {action}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Demo Component
const ErrorComponents = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedError = errorExamples[selectedIndex];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 py-8">

          <View className="mb-8">
            <Text className="text-4xl font-bold text-gray-900 mb-3">
              Error Components
            </Text>
            <Text className="text-gray-600 text-lg">
              Beautiful emerald error designs for better UX
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-8"
            contentContainerStyle={{ gap: 8 }}
          >
            {errorExamples.map((error, index) => (
              <TouchableOpacity
                key={error.code}
                onPress={() => setSelectedIndex(index)}
                className={`px-5 py-2.5 rounded-full border-2 ${selectedIndex === index
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-300'
                  }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-semibold text-sm ${selectedIndex === index ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {error.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View className="gap-8">
            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Full Page Style</Text>
              <FullPageError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
                action={selectedError.action}
              />
            </View>

            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Compact Card Style</Text>
              <CompactCardError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
                action={selectedError.action}
              />
            </View>

            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Toast/Banner Style</Text>
              <ToastError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
              />
            </View>

            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Minimal Style</Text>
              <MinimalError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
                action={selectedError.action}
              />
            </View>

            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Detailed Card Style</Text>
              <DetailedCardError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
                action={selectedError.action}
              />
            </View>

            <View>
              <Text className="text-xl font-bold text-gray-900 mb-4">Alert Box Style</Text>
              <AlertBoxError
                code={selectedError.code}
                title={selectedError.title}
                message={selectedError.message}
                action={selectedError.action}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ErrorComponents;