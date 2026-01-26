import { FullPageError } from '@/components/ErrorComp';
import { useCustomerProfile, useFetchUser, useVendorProfile } from '@/hooks/queries';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockVendorData = {
  vendorName: 'Rajesh Kumar',
  shopName: 'Green Mart Grocery',
  phone: '+91 98765 43210',
  status: 'Active',
  shopAddress: '123 Market Street, Downtown, City',
  businessHours: '9:00 AM - 10:00 PM',
  avatar: '🏪',
};

export default function ProfileOverviewScreen() {
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { setVendorProfile, setUser } = useProfileStore()
  const {setSession}=useAuthStore()
  // Verification status - you can fetch this from your backend
  const [verificationStatus, setVerificationStatus] = useState({
    isAdminVerified: true,  // Change to false to see unverified state
    isKycVerified: true,     // Change to false to see unverified state
  });

  const handleEditProfile = () => {
    console.log('[v0] Navigating to Edit Profile screen');
    router.push("/vendor/profile/edit")
  };

  const handleBankDetails = () => {
    console.log('[v0] Navigating to Bank Details screen');
    router.push('/vendor/profile/documents/bank')
  };

  const handleDocuments = () => {
    console.log('[v0] Navigating to Documents & KYC screen');
    router.push("/vendor/profile/documents")
  };

  const handleSettings = () => {
    console.log('[v0] Navigating to Settings screen');
    router.push("/vendor/profile/settings")
  };

  const handleSupport = () => {
    console.log('[v0] Navigating to Support screen');
    router.push("/vendor/(tabs)/profile/support")
  };
  const handleTermsAndConditions = () => {
    console.log('[v0] Navigating to Support screen');
    router.push("/vendor/(tabs)/profile/terms-and-conditions")
  };
  const handlePrivacyPolicy = () => {
    console.log('[v0] Navigating to Support screen');
    router.push("/vendor/(tabs)/profile/privacy-policy")
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => { } },
        {
          text: 'Logout',
          onPress: async () => {
            setLogoutLoading(true);
            try {
              const { error } = await supabase.auth.signOut()
              if (error) throw error
            } catch (err) {
              console.error("Logout error:", err)
            } finally {
              // Clear local state no matter what
              setSession(null)
              setVendorProfile(null)
              setUser(null)
              // router.dismissAll()
              router.replace('/auth/login')
              setLogoutLoading(false)
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 ">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        <Text className="text-sm text-gray-600 mt-1">Manage your account & settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Profile Header Card */}
        <LinearGradient
          colors={['#ecfdf5', '#f0fdfa']}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 mx-4 mt-4 rounded-2xl p-6 border border-emerald-100"
          style={{ borderRadius: 16 }}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center gap-4 flex-1">
              <View className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl items-center justify-center">
                <Text className="text-4xl">{mockVendorData.avatar}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-xs font-semibold mb-1">VENDOR NAME</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold text-gray-900">{mockVendorData.vendorName}</Text>
                  {verificationStatus.isAdminVerified && (
                    <View className=" rounded-full p-1 ">
                      <MaterialIcons name="verified" size={24} color="#10b981" />
                    </View>
                  )}
                </View>
                <View className="flex-row items-center gap-2 mt-2">
                  <View className="bg-emerald-100 px-2.5 py-1 rounded-full">
                    <Text className="text-emerald-700 text-xs font-semibold">{mockVendorData.status}</Text>
                  </View>
                </View>
                {/* Quick Contact */}
                <View className="flex-row items-center gap-2 mt-2">
                  <Text className="text-gray-600 text-sm">{mockVendorData.phone}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* VERIFICATION STATUS BANNER */}
        {(!verificationStatus.isAdminVerified || !verificationStatus.isKycVerified) && (
          <View className="mx-4 mt-4">
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <View className="flex-row items-start gap-3">
                <View className="bg-amber-100 rounded-full p-2">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-amber-900 mb-1">
                    Verification Required
                  </Text>
                  <Text className="text-xs text-amber-700 mb-3">
                    Complete verification to unlock all features
                  </Text>
                  <View className="gap-2">
                    {!verificationStatus.isAdminVerified && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-gray-700">Admin verification pending</Text>
                      </View>
                    )}
                    {!verificationStatus.isKycVerified && (
                      <TouchableOpacity
                        onPress={handleDocuments}
                        className="flex-row items-center gap-2"
                      >
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text className="text-xs text-blue-600 underline">
                          Complete KYC verification →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* VERIFICATION STATUS CARDS */}
        <View className="mx-4 mt-4">
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
              <Text className="text-base font-bold text-gray-900">Verification Status</Text>
            </View>

            <View className="gap-3">
              {/* Admin Verification */}
              <View className={`flex-row items-center justify-between p-3 rounded-lg border ${verificationStatus.isAdminVerified
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <View className="flex-row items-center gap-3 flex-1">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${verificationStatus.isAdminVerified ? 'bg-blue-100' : 'bg-gray-200'
                    }`}>
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color={verificationStatus.isAdminVerified ? '#3b82f6' : '#9ca3af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold ${verificationStatus.isAdminVerified ? 'text-blue-900' : 'text-gray-700'
                      }`}>
                      Admin Verification
                    </Text>
                    <Text className={`text-xs ${verificationStatus.isAdminVerified ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                      {verificationStatus.isAdminVerified
                        ? 'Your account is verified'
                        : 'Awaiting admin approval'}
                    </Text>
                  </View>
                </View>
                {verificationStatus.isAdminVerified ? (
                  <View className="bg-blue-500 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">Verified</Text>
                  </View>
                ) : (
                  <View className="bg-gray-400 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">Pending</Text>
                  </View>
                )}
              </View>

              {/* KYC Verification */}
              <View className={`flex-row items-center justify-between p-3 rounded-lg border ${verificationStatus.isKycVerified
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <View className="flex-row items-center gap-3 flex-1">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${verificationStatus.isKycVerified ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={verificationStatus.isKycVerified ? '#10b981' : '#9ca3af'}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm font-semibold ${verificationStatus.isKycVerified ? 'text-green-900' : 'text-gray-700'
                      }`}>
                      KYC Verification
                    </Text>
                    <Text className={`text-xs ${verificationStatus.isKycVerified ? 'text-green-600' : 'text-gray-500'
                      }`}>
                      {verificationStatus.isKycVerified
                        ? 'Documents verified'
                        : 'Documents pending review'}
                    </Text>
                  </View>
                </View>
                {verificationStatus.isKycVerified ? (
                  <View className="bg-green-500 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleDocuments}
                    className="bg-amber-500 rounded-full px-3 py-1"
                  >
                    <Text className="text-white text-xs font-bold">Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Shop Info Card */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Shop Information</Text>

          <View className="gap-3 mb-4">
            <View>
              <Text className="text-gray-600 text-xs font-semibold mb-1">Shop Name</Text>
              <Text className="text-gray-900 font-semibold text-base">{mockVendorData.shopName}</Text>
            </View>

            <View className="flex-row items-start gap-2">
              <Feather name='map-pin' size={16} color="#6b7280" style={{ marginTop: 4 }} />
              <View className="flex-1">
                <Text className="text-gray-600 text-xs font-semibold mb-1">Shop Address</Text>
                <Text className="text-gray-900 font-medium text-sm">{mockVendorData.shopAddress}</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2">
              <Feather name='clock' size={16} color="#6b7280" style={{ marginTop: 4 }} />
              <View className="flex-1">
                <Text className="text-gray-600 text-xs font-semibold mb-1">Business Hours</Text>
                <Text className="text-gray-900 font-medium text-sm">{mockVendorData.businessHours}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleEditProfile}
            className="bg-emerald-500 rounded-lg py-3 items-center justify-center active:opacity-80"
          >
            <View className="flex-row items-center gap-2">
              <Feather name='edit-3' size={18} color="#fff" />
              <Text className="text-white font-bold text-base">Edit Profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Management List */}
        <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-100">
          <MenuItemButton
            icon={<Feather name='credit-card' size={20} color="#059669" />}
            label="Bank & Payout Details"
            onPress={handleBankDetails}
          />
          <MenuItemButton
            icon={<Feather name='file' size={20} color="#3b82f6" />}
            label="Documents & KYC"
            badge={!verificationStatus.isKycVerified ? "Action Required" : undefined}
            onPress={handleDocuments}
          />
          <MenuItemButton
            icon={<Feather name='settings' size={20} color="#8b5cf6" />}
            label="Settings"
            onPress={handleSettings}
          />
          <MenuItemButton
            icon={<Feather name='help-circle' size={20} color="#f59e0b" />}
            label="Help & Support"
            onPress={handleSupport}
          />
          <MenuItemButton
            icon={<Feather name='shield' size={20} color="#f59e0b" />}
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
          />
          <MenuItemButton
            icon={<Feather name='file-text' size={20} color="#f59e0b" />}
            label="Terms & Conditions"
            onPress={handleTermsAndConditions}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          disabled={logoutLoading}
          className={`bg-red-50 mx-4 mt-4 mb-6 rounded-xl py-4 items-center justify-center border border-red-200 ${logoutLoading ? 'opacity-50' : ''}`}
        >
          <View className="flex-row items-center gap-2">
            <Feather name='log-out' size={20} color="#dc2626" />
            <Text className="text-red-700 font-bold text-base">Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItemButton({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 last:border-b-0 active:bg-gray-50"
    >
      <View className="flex-row items-center gap-3 flex-1">
        {icon}
        <Text className="text-gray-900 font-semibold text-base">{label}</Text>
        {badge && (
          <View className="bg-amber-100 px-2 py-0.5 rounded-full">
            <Text className="text-amber-700 text-xs font-bold">{badge}</Text>
          </View>
        )}
      </View>
      <Feather name='chevron-right' size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}