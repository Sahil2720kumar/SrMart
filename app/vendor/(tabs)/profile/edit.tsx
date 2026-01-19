import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockProfileData = {
  vendorName: 'Rajesh Kumar',
  shopName: 'Green Mart Grocery',
  phone: '+91 98765 43210',
  shopAddress: '123 Market Street, Downtown, City',
  operatingHours: '9:00 AM - 10:00 PM',
};

export default function EditProfileScreen() {
  const [vendorName, setVendorName] = useState(mockProfileData.vendorName);
  const [shopName, setShopName] = useState(mockProfileData.shopName);
  const [shopAddress, setShopAddress] = useState(mockProfileData.shopAddress);
  const [operatingHours, setOperatingHours] = useState(mockProfileData.operatingHours);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }
    if (!shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    }
    if (!shopAddress.trim()) {
      newErrors.shopAddress = 'Shop address is required';
    }
    if (!operatingHours.trim()) {
      newErrors.operatingHours = 'Operating hours are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[v0] Profile updated:', { vendorName, shopName, shopAddress, operatingHours });
      Alert.alert('Success', 'Your profile has been updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    console.log('[v0] Going back to profile overview');
    router.back()
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1 pb-8">
            {/* Header */}
            <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
              <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
                <Feather name='chevron-left' size={24} color="#1f2937" />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold text-gray-900">Edit Profile</Text>
                <Text className="text-sm text-gray-600 mt-1">Update your details</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {/* Form Section */}
              <View className="px-4 pt-6 pb-8">
                {/* Vendor Name */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold text-sm mb-2">Vendor Name</Text>
                  <TextInput
                    value={vendorName}
                    onChangeText={setVendorName}
                    placeholder="Enter your name"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  {errors.vendorName && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" />
                      <Text className="text-red-600 text-xs font-medium">{errors.vendorName}</Text>
                    </View>
                  )}
                </View>

                {/* Shop Name */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold text-sm mb-2">Shop Name</Text>
                  <TextInput
                    value={shopName}
                    onChangeText={setShopName}
                    placeholder="Enter your shop name"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  {errors.shopName && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" />
                      <Text className="text-red-600 text-xs font-medium">{errors.shopName}</Text>
                    </View>
                  )}
                </View>

                {/* Phone (Read-only) */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold text-sm mb-2">Phone Number (Read-only)</Text>
                  <View className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 opacity-60">
                    <Text className="text-gray-600 font-medium">{mockProfileData.phone}</Text>
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">Phone number cannot be changed</Text>
                </View>

                {/* Shop Address */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold text-sm mb-2">Shop Address</Text>
                  <TextInput
                    value={shopAddress}
                    onChangeText={setShopAddress}
                    placeholder="Enter your full shop address"
                    multiline
                    numberOfLines={3}
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                    textAlignVertical="top"
                  />
                  {errors.shopAddress && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" />
                      <Text className="text-red-600 text-xs font-medium">{errors.shopAddress}</Text>
                    </View>
                  )}
                </View>

                {/* Operating Hours */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-semibold text-sm mb-2">Operating Hours</Text>
                  <TextInput
                    value={operatingHours}
                    onChangeText={setOperatingHours}
                    placeholder="e.g., 9:00 AM - 10:00 PM"
                    className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                    placeholderTextColor="#9ca3af"
                  />
                  {errors.operatingHours && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Feather name='alert-circle' size={16} color="#dc2626" />
                      <Text className="text-red-600 text-xs font-medium">{errors.operatingHours}</Text>
                    </View>
                  )}
                </View>

                {/* Info Banner */}
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <Text className="text-blue-900 text-sm font-medium">
                    Changes will be reflected immediately in your shop profile.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Sticky Save Button */}
            <View className="bg-white px-4 py-4 border-t border-gray-100 safe-area-bottom">
              <TouchableOpacity
                onPress={handleSaveProfile}
                disabled={isLoading}
                className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${isLoading ? 'opacity-50' : ''}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
