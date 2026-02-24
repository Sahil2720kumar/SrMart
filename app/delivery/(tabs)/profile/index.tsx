import { AntDesign, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

// ==========================================
// ONLY IMPORT EXISTING HOOKS - NO NEW ONES
// ==========================================
import {
  useDeliveryBoyProfile,
  useDeliveryBoyKycDocuments,
  useDeliveryBoyKycSummary,
  useDeliveryBoyBankDetails,
  useUpdateDeliveryBoyProfile
} from '@/hooks/queries/useDeliveryBoy';
import { useDeliveryBoyStats } from '@/hooks/queries/useDeliveryOrders';
import { Image } from 'expo-image';
import { blurhash } from '@/types/categories-products.types';

// ==========================================
// KYC DOCUMENT TYPES (matching documents screen)
// ==========================================
const KYC_DOCUMENTS = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  driving_license: 'Driving License',
  bank_passbook: 'Bank Passbook',
  profile_photo: 'Profile Photo',
} as const;

type KycDocumentType = keyof typeof KYC_DOCUMENTS;

const ProfileScreen = () => {
  const { setSession } = useAuthStore();
  const { setUser, setDeliveryBoyProfile } = useProfileStore();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ==========================================
  // USE EXISTING HOOKS DIRECTLY
  // ==========================================

  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;

  // Profile data
  const profile = useDeliveryBoyProfile(userId);
  const deliveryBoyId = profile.data?.id;

  // KYC data
  const kycDocuments = useDeliveryBoyKycDocuments(userId || '');
  const kycSummary = useDeliveryBoyKycSummary(userId || '');

  // Bank data
  const bankDetails = useDeliveryBoyBankDetails(deliveryBoyId || '');

  // Performance stats
  const stats = useDeliveryBoyStats();

  // Mutation for updating profile
  const updateProfile = useUpdateDeliveryBoyProfile();

  // ==========================================
  // EXTRACT DATA FROM HOOKS
  // ==========================================

  const name = profile.data
    ? `${profile.data.first_name || ''} ${profile.data.last_name || ''}`.trim()
    : 'User';

  const phone = profile.data?.phone || '';
  const profileId = profile.data?.id || '';
    
  const isOnline = profile.data?.is_online || false;
  const adminStatus = profile.data?.admin_verification_status || 'pending';

  // ==========================================
  // BUILD KYC STEPS FROM ACTUAL DOCUMENTS
  // ==========================================

  // Helper to check if document is verified
  const isDocumentVerified = (docType: KycDocumentType) => {
    const doc = kycDocuments.data?.find(d => d.document_type === docType);
    return doc?.status === 'verified' || doc?.status === 'approved';
  };

  // Build KYC steps based on actual KYC documents
  const kycSteps = [
    {
      id: 'aadhaar',
      title: KYC_DOCUMENTS.aadhaar,
      status: isDocumentVerified('aadhaar') ? 'completed' : 'pending'
    },
    {
      id: 'pan',
      title: KYC_DOCUMENTS.pan,
      status: isDocumentVerified('pan') ? 'completed' : 'pending'
    },
    {
      id: 'driving_license',
      title: KYC_DOCUMENTS.driving_license,
      status: isDocumentVerified('driving_license') ? 'completed' : 'pending'
    },
    {
      id: 'bank_passbook',
      title: KYC_DOCUMENTS.bank_passbook,
      status: isDocumentVerified('bank_passbook') ? 'completed' : 'pending'
    },
    {
      id: 'profile_photo',
      title: KYC_DOCUMENTS.profile_photo,
      status: isDocumentVerified('profile_photo') ? 'completed' : 'pending'
    }
  ];

  const kycProgress = kycSteps.filter(s => s.status === 'completed').length;
  const totalKycSteps = kycSteps.length;
  const kycPercentage = (kycProgress / totalKycSteps) * 100;

  // Performance data
  const performanceData = {
    totalDeliveries: stats.data?.completedOrders || 0,
    rating: profile.data?.rating || 0, // This would come from delivery_boys.average_rating
    totalEarnings: stats.data?.totalEarnings || 0
  };

  // Bank data for display
  const bankAccountDisplay = {
    accountNumber: bankDetails.data?.account_number
      ? `****${bankDetails.data.account_number.slice(-4)}`
      : '****1234',
    ifsc: bankDetails.data?.ifsc_code || 'HDFC0001234',
    verified: bankDetails.data?.is_verified || false
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getVerificationStatusInfo = () => {
    switch (adminStatus) {
      case 'approved':
        return {
          badge: 'bg-green-500',
          text: 'Approved',
          subtext: 'Orders enabled',
          showAction: false
        };
      case 'pending':
        return {
          badge: 'bg-yellow-500',
          text: 'Pending',
          subtext: 'Verification in progress',
          showAction: false
        };
      case 'rejected':
        return {
          badge: 'bg-red-500',
          text: 'Rejected',
          subtext: 'Action required',
          showAction: true
        };
      default:
        return {
          badge: 'bg-gray-500',
          text: 'Unknown',
          subtext: '',
          showAction: false
        };
    }
  };

  const handleToggleOnline = async () => {
    try {      
      const data=await updateProfile.mutateAsync({
        is_online: !isOnline,
        is_available: !isOnline,
      });      
      // Automatically refetches profile
    } catch (error) {
      console.error('Error toggling online status:', error);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setSession(null);
      setDeliveryBoyProfile(null);
      setUser(null);
      router.replace('/auth/login');
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  const isLoading = profile.isLoading || stats.isLoading || kycDocuments.isLoading;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5] items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  const verificationStatusInfo = getVerificationStatusInfo();

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="px-4 py-4">
        <Text className="text-white text-3xl font-bold">Profile</Text>
        <Text className="text-indigo-100 text-sm mt-1">Manage your account and settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4">
          {/* Profile Header Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                {/* Avatar */}
                <View className="w-16 h-16 bg-indigo-500 rounded-full items-center justify-center mr-4">
                  {profile?.data?.profile_photo ? (
                    <Image
                      source={{ uri: profile.data.profile_photo }}
                      placeholder={{ blurhash: blurhash }}
                      contentFit="cover"
                      transition={1000}
                      style={{ width: '100%', height: '100%', borderRadius: 999 }}
                    />
                  ) : (
                    <Text className="text-white text-xl font-bold">
                      {getInitials(name)}
                    </Text>
                  )}
                </View>

                {/* Info */}
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 mb-1">
                    {name}
                  </Text>
                  <Text className="text-xs text-gray-500 mb-1">ID: {profileId}</Text>
                  <Text className="text-sm text-gray-600">{phone}</Text>
                </View>
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                activeOpacity={0.8}
                onPress={() => router.push('/delivery/profile/edit')}
              >
                <Feather name="edit-2" size={18} color="#4f46e5" />
              </TouchableOpacity>
            </View>

            {/* Online Status */}
            <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
              <Text className="text-sm font-semibold text-gray-700">Status</Text>
              <TouchableOpacity
                onPress={handleToggleOnline}
                className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                activeOpacity={0.8}
                disabled={updateProfile.isPending}
              >
                <View className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-500'
                  }`} />
                <Text className={`font-bold text-sm ${isOnline ? 'text-white' : 'text-gray-700'
                  }`}>
                  {updateProfile.isPending?"Loading...":isOnline ? 'Online' : 'Offline'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Verification Status Section */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <Text className="text-lg font-bold text-gray-900 mb-4">Verification Status</Text>

            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-700">Admin Approval</Text>
                <View className={`px-3 py-1.5 rounded-full ${verificationStatusInfo.badge}`}>
                  <Text className="text-white text-xs font-bold">
                    {verificationStatusInfo.text}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500">{verificationStatusInfo.subtext}</Text>

              {verificationStatusInfo.showAction && (
                <TouchableOpacity
                  className="bg-red-50 border border-red-200 py-3 rounded-xl mt-3"
                  activeOpacity={0.8}
                  onPress={() => router.push('/delivery/profile/documents')}
                >
                  <Text className="text-red-600 font-bold text-center">
                    Fix & Resubmit Details
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!kycSummary.isComplete && (
              <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex-row items-start">
                <Feather name="alert-circle" size={20} color="#ea580c" />
                <Text className="text-orange-800 text-sm ml-2 flex-1">
                  Complete KYC verification to start accepting orders
                </Text>
              </View>
            )}
          </View>

          {/* KYC Progress Card */}
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Identity Verification</Text>
              <Text className="text-sm font-bold text-indigo-600">
                {kycProgress}/{totalKycSteps}
              </Text>
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <View
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${kycPercentage}%` }}
              />
            </View>

            {/* KYC Steps - Using actual document types */}
            <View className="gap-y-3 mb-4">
              {kycSteps.map((step) => (
                <View key={step.id} className="flex-row items-center">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`}>
                    {step.status === 'completed' ? (
                      <Feather name="check" size={14} color="white" />
                    ) : (
                      <View className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </View>
                  <Text className={`font-semibold ${step.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-xl"
              activeOpacity={0.8}
              onPress={() => router.push("/delivery/profile/documents")}
            >
              <Text className="text-white font-bold text-center">
                {kycSummary.isComplete ? 'View Documents' : 'Complete Verification'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bank & Payout Details */}
          <TouchableOpacity
            onPress={() => router.push('/delivery/profile/bank')}
            className="bg-white rounded-3xl p-5 mb-4 shadow-lg flex-row items-center justify-between"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                <Feather name="credit-card" size={24} color="#22c55e" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-lg font-bold text-gray-900 mr-2">Bank Account</Text>
                  {bankAccountDisplay.verified && (
                    <View className="bg-green-100 px-2 py-0.5 rounded">
                      <Text className="text-xs font-bold text-green-700">Verified</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-600">Used for payouts</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>

          {/* Performance Snapshot */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-white mb-3">Performance</Text>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
                <View className="w-10 h-10 bg-indigo-500 rounded-xl items-center justify-center mb-3">
                  <Feather name="package" size={20} color="white" />
                </View>
                <Text className="text-xs text-gray-500 mb-1 font-semibold">Deliveries</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {performanceData.totalDeliveries}
                </Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
                <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center mb-3">
                  <Feather name="star" size={20} color="white" />
                </View>
                <Text className="text-xs text-gray-500 mb-1 font-semibold">Rating</Text>
                <View className='flex-row gap-2 items-center '>
                  <AntDesign name="star" size={18} color="#6366f1" />
                  <Text className="text-2xl font-bold text-gray-900 ">
                    {performanceData.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 shadow-md">
                <View className="w-10 h-10 bg-green-500 rounded-xl items-center justify-center mb-3">
                  <Feather name="dollar-sign" size={20} color="white" />
                </View>
                <Text className="text-xs text-gray-500 mb-1 font-semibold">Earned</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ₹{performanceData.totalEarnings > 999 ? ((performanceData.totalEarnings / 1000).toFixed(0)) + "k" : performanceData.totalEarnings}
                </Text>
              </View>
            </View>
          </View>

          {/* Support & Legal */}
          <View className="bg-white rounded-3xl overflow-hidden mb-4 shadow-lg">
            <TouchableOpacity
              className="flex-row items-center justify-between p-5 border-b border-gray-100"
              activeOpacity={0.8}
              onPress={() => router.push('/delivery/profile/support')}
            >
              <View className="flex-row items-center">
                <Feather name="help-circle" size={24} color="#4f46e5" />
                <Text className="text-base font-semibold text-gray-900 ml-3">
                  Help & Support
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-5 border-b border-gray-100"
              activeOpacity={0.8}
              onPress={() => router.push('/delivery/profile/terms-and-conditions')}
            >
              <View className="flex-row items-center">
                <Feather name="file-text" size={24} color="#4f46e5" />
                <Text className="text-base font-semibold text-gray-900 ml-3">
                  Terms & Conditions
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-between p-5"
              activeOpacity={0.8}
              onPress={() => router.push('/delivery/profile/privacy-policy')}
            >
              <View className="flex-row items-center">
                <Feather name="shield" size={24} color="#4f46e5" />
                <Text className="text-base font-semibold text-gray-900 ml-3">
                  Privacy Policy
                </Text>
              </View>
              <Feather name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            className="bg-white rounded-3xl p-5 shadow-lg flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold text-base ml-2">Logout</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text className="text-center text-indigo-100 text-xs mt-4">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-3xl w-full max-w-md p-6">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Feather name="log-out" size={32} color="#ef4444" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">Logout</Text>
              <Text className="text-sm text-gray-600 text-center">
                Are you sure you want to logout?
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="font-bold text-gray-700 text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="flex-1 bg-red-500 py-3 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="font-bold text-white text-center">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;