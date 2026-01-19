import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [settlementNotifications, setSettlementNotifications] = useState(true);
  const [promotionalNotifications, setPromotionalNotifications] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back()
  };

  const handleOrderNotificationsChange = (value: boolean) => {
    setOrderNotifications(value);
    console.log('[v0] Order notifications:', value);
  };

  const handleSettlementNotificationsChange = (value: boolean) => {
    setSettlementNotifications(value);
    console.log('[v0] Settlement notifications:', value);
  };

  const handlePromotionalNotificationsChange = (value: boolean) => {
    setPromotionalNotifications(value);
    console.log('[v0] Promotional notifications:', value);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    console.log('[v0] Language changed to:', language);
    Alert.alert('Language Changed', `App language changed to ${language}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
          <Feather name='chevron-left' size={24} color="#1f2937" />
        </TouchableOpacity>
        <View>
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
          <Text className="text-sm text-gray-600 mt-1">Customize your experience</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Notifications Section */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Notifications</Text>

          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Order Notifications */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">Order Notifications</Text>
                <Text className="text-gray-600 text-xs mt-1">New orders and updates</Text>
              </View>
              <Switch
                value={orderNotifications}
                onValueChange={handleOrderNotificationsChange}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={orderNotifications ? '#059669' : '#f3f4f6'}
              />
            </View>

            {/* Settlement Notifications */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">Settlement Notifications</Text>
                <Text className="text-gray-600 text-xs mt-1">Payout and cashout updates</Text>
              </View>
              <Switch
                value={settlementNotifications}
                onValueChange={handleSettlementNotificationsChange}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={settlementNotifications ? '#059669' : '#f3f4f6'}
              />
            </View>

            {/* Promotional Notifications */}
            <View className="flex-row items-center justify-between px-5 py-4">
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">Promotional Notifications</Text>
                <Text className="text-gray-600 text-xs mt-1">Offers and announcements</Text>
              </View>
              <Switch
                value={promotionalNotifications}
                onValueChange={handlePromotionalNotificationsChange}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={promotionalNotifications ? '#059669' : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View className="px-4 pt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Language</Text>

          <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* English */}
            <TouchableOpacity
              onPress={() => handleLanguageChange('english')}
              className={`flex-row items-center justify-between px-5 py-4 border-b border-gray-100 ${selectedLanguage === 'english' ? 'bg-emerald-50' : ''}`}
            >
              <Text className={`font-semibold text-base ${selectedLanguage === 'english' ? 'text-emerald-700' : 'text-gray-900'}`}>
                English
              </Text>
              {selectedLanguage === 'english' && (
                <View className="w-5 h-5 bg-emerald-500 rounded-full" />
              )}
            </TouchableOpacity>

            {/* Hindi */}
            {/* <TouchableOpacity
              onPress={() => handleLanguageChange('hindi')}
              className={`flex-row items-center justify-between px-5 py-4 border-b border-gray-100 ${selectedLanguage === 'hindi' ? 'bg-emerald-50' : ''}`}
            >
              <Text className={`font-semibold text-base ${selectedLanguage === 'hindi' ? 'text-emerald-700' : 'text-gray-900'}`}>
                हिंदी (Hindi)
              </Text>
              {selectedLanguage === 'hindi' && (
                <View className="w-5 h-5 bg-emerald-500 rounded-full" />
              )}
            </TouchableOpacity> */}

            {/* Tamil */}
            {/* <TouchableOpacity
              onPress={() => handleLanguageChange('tamil')}
              className={`flex-row items-center justify-between px-5 py-4 ${selectedLanguage === 'tamil' ? 'bg-emerald-50' : ''}`}
            >
              <Text className={`font-semibold text-base ${selectedLanguage === 'tamil' ? 'text-emerald-700' : 'text-gray-900'}`}>
                தமிழ் (Tamil)
              </Text>
              {selectedLanguage === 'tamil' && (
                <View className="w-5 h-5 bg-emerald-500 rounded-full" />
              )}
            </TouchableOpacity> */}
          </View>
        </View>

        {/* App Info Section */}
        <View className="px-4 pt-6 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">About</Text>

          <View className="bg-white rounded-2xl border border-gray-100 p-5 gap-3">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <Text className="text-gray-600 text-sm">App Version</Text>
              <Text className="text-gray-900 font-semibold text-sm">2.4.1</Text>
            </View>
            <View>
              <Text className="text-gray-600 text-sm mb-2">Privacy Policy</Text>
              <TouchableOpacity onPress={()=>router.push("/vendor/profile/privacy-policy")} className="active:opacity-70">
                <Text className="text-emerald-600 font-semibold text-sm">Read Full Policy →</Text>
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-gray-600 text-sm mb-2">Privacy Policy</Text>
              <TouchableOpacity onPress={()=>router.push("/vendor/profile/terms-and-conditions")} className="active:opacity-70">
                <Text className="text-emerald-600 font-semibold text-sm">Read Full Terms And Conditions →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
