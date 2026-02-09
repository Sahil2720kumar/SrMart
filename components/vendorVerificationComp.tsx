import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { KycDocumentStatus } from '@/types/documents-kyc.types';

const { width, height } = Dimensions.get('window');

interface VerificationGateProps {
  isAdminVerified: boolean;
  isKycVerified: boolean;
  kycStatus?: KycDocumentStatus;
  storeName?: string;
  onKycPress?: () => void;
}

export default function VerificationGate({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  storeName = 'Your Store',
  onKycPress,
}: VerificationGateProps) {
  const isFullyVerified = isAdminVerified && isKycVerified;

 

  // Get KYC status details
  const getKycStatusInfo = () => {
    switch (kycStatus) {
      case 'approved':
        return {
          color: '#10b981',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: 'checkmark-circle',
          text: 'KYC Approved',
          subtext: 'Your documents have been verified',
        };
      case 'pending':
        return {
          color: '#f59e0b',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: 'time',
          text: 'KYC Under Review',
          subtext: 'Your documents are being verified',
        };
      case 'rejected':
        return {
          color: '#ef4444',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: 'close-circle',
          text: 'KYC Rejected',
          subtext: 'Please resubmit your documents',
        };
      default:
        return {
          color: '#6b7280',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: 'document-text-outline',
          text: 'KYC Not Submitted',
          subtext: 'Complete your KYC verification',
        };
    }
  };

  const kycInfo = getKycStatusInfo();

  return (
    <SafeAreaView className="flex-1 bg-[#10b981]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#10b981', '#059669', '#047857']}
          className="pt-8 pb-16 px-6"
          style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View className="items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="shield-checkmark-outline" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-white text-center mb-2">
              Verification Required
            </Text>
            <Text className="text-sm text-white/80 text-center max-w-xs">
              Complete verification to unlock all features
            </Text>
          </View>
        </LinearGradient>

        {/* Store Info Card */}
        <View className="px-6 -mt-8 mb-6">
          <View className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-12 h-12 bg-emerald-100 rounded-xl items-center justify-center">
                <Ionicons name="storefront" size={24} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  {storeName}
                </Text>
                <Text className="text-xs text-gray-500">Vendor Account</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-semibold text-gray-600">
                  Verification Progress
                </Text>
                <Text className="text-xs font-bold text-emerald-600">
                  {isAdminVerified && isKycVerified
                    ? '100%'
                    : isAdminVerified || isKycVerified
                    ? '50%'
                    : '0%'}
                </Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  style={{
                    width: `${
                      isAdminVerified && isKycVerified
                        ? 100
                        : isAdminVerified || isKycVerified
                        ? 50
                        : 0
                    }%`,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Verification Steps */}
        <View className="px-6 gap-4">
          {/* Admin Verification Card */}
          <View
            className={`rounded-2xl border-2 overflow-hidden ${
              isAdminVerified
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <View className="p-6">
              <View className="flex-row items-start gap-4">
                {/* Icon */}
                <View
                  className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    isAdminVerified ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  {isAdminVerified ? (
                    <Ionicons name="checkmark" size={28} color="white" />
                  ) : (
                    <Ionicons name="shield-checkmark" size={28} color="white" />
                  )}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text
                      className={`text-lg font-bold ${
                        isAdminVerified ? 'text-blue-900' : 'text-gray-700'
                      }`}
                    >
                      Admin Verification
                    </Text>
                    {isAdminVerified && (
                      <View className="bg-blue-500 rounded-full px-2 py-0.5">
                        <Text className="text-white text-[10px] font-bold">
                          ✓ VERIFIED
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    className={`text-sm mb-4 ${
                      isAdminVerified ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {isAdminVerified
                      ? 'Your store has been verified by our admin team'
                      : 'Your store is under review by our admin team'}
                  </Text>

                  {/* Details */}
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={isAdminVerified ? 'checkmark-circle' : 'time'}
                        size={16}
                        color={isAdminVerified ? '#3b82f6' : '#9ca3af'}
                      />
                      <Text
                        className={`text-xs ${
                          isAdminVerified ? 'text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        {isAdminVerified
                          ? 'Store details verified'
                          : 'Pending admin approval'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={isAdminVerified ? 'checkmark-circle' : 'time'}
                        size={16}
                        color={isAdminVerified ? '#3b82f6' : '#9ca3af'}
                      />
                      <Text
                        className={`text-xs ${
                          isAdminVerified ? 'text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        {isAdminVerified
                          ? 'Business information validated'
                          : 'Usually takes 24-48 hours'}
                      </Text>
                    </View>
                  </View>

                  {!isAdminVerified && (
                    <View className="mt-4 bg-gray-100 rounded-xl p-3">
                      <Text className="text-xs text-gray-600 text-center">
                        ⏱️ Please wait while we review your application
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* KYC Verification Card */}
          <View
            className={`rounded-2xl border-2 overflow-hidden ${
              isKycVerified
                ? 'bg-green-50 border-green-200'
                : `${kycInfo.bgColor} ${kycInfo.borderColor}`
            }`}
          >
            <View className="p-6">
              <View className="flex-row items-start gap-4">
                {/* Icon */}
                <View
                  className={`w-14 h-14 rounded-2xl items-center justify-center`}
                  style={{
                    backgroundColor: isKycVerified ? '#10b981' : kycInfo.color,
                  }}
                >
                  {isKycVerified ? (
                    <Ionicons name="checkmark" size={28} color="white" />
                  ) : (
                    <Ionicons name={kycInfo.icon as any} size={28} color="white" />
                  )}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text
                      className={`text-lg font-bold ${
                        isKycVerified ? 'text-green-900' : 'text-gray-700'
                      }`}
                    >
                      KYC Verification
                    </Text>
                    {isKycVerified && (
                      <View className="bg-green-500 rounded-full px-2 py-0.5">
                        <Text className="text-white text-[10px] font-bold">
                          ✓ VERIFIED
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    className={`text-sm mb-4 ${
                      isKycVerified ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    {isKycVerified ? kycInfo.subtext : kycInfo.subtext}
                  </Text>

                  {/* Details */}
                  <View className="gap-2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={isKycVerified ? 'checkmark-circle' : 'document-text'}
                        size={16}
                        color={isKycVerified ? '#10b981' : '#9ca3af'}
                      />
                      <Text
                        className={`text-xs ${
                          isKycVerified ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {isKycVerified
                          ? 'Identity documents verified'
                          : 'Upload identity documents'}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Ionicons
                        name={isKycVerified ? 'checkmark-circle' : 'business'}
                        size={16}
                        color={isKycVerified ? '#10b981' : '#9ca3af'}
                      />
                      <Text
                        className={`text-xs ${
                          isKycVerified ? 'text-green-700' : 'text-gray-500'
                        }`}
                      >
                        {isKycVerified
                          ? 'Business documents approved'
                          : 'Provide business documents'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Button */}
                  {!isKycVerified && (
                    <TouchableOpacity
                      onPress={
                        onKycPress ||
                        (() => router.push('/vendor/profile/documents' as any))
                      }
                      className="mt-4 rounded-xl p-4"
                      style={{ backgroundColor: kycInfo.color }}
                    >
                      <Text className="text-white text-sm font-bold text-center">
                        {kycStatus === 'rejected'
                          ? 'Resubmit Documents'
                          : kycStatus === 'pending'
                          ? 'View Status'
                          : 'Complete KYC Now'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View className="px-6 py-8">
          <View className="bg-white rounded-2xl p-6 border border-emerald-200">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="star" size={20} color="#059669" />
              <Text className="text-lg font-bold text-gray-900">
                Unlock After Verification
              </Text>
            </View>

            <View className="gap-3">
              {[
                'Accept and manage customer orders',
                'Access your earnings and wallet',
                'Add and manage product inventory',
                'Receive payments instantly',
                'Get featured in search results',
                'Access vendor analytics dashboard',
              ].map((benefit, index) => (
                <View key={index} className="flex-row items-start gap-3">
                  <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center mt-0.5">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                  <Text className="flex-1 text-sm text-gray-700">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer Help */}
        <View className="px-6 pb-8">
          <View className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-blue-900 mb-1">
                  Need Help?
                </Text>
                <Text className="text-xs text-blue-700 mb-3">
                  If you have any questions about the verification process, our
                  support team is here to help.
                </Text>
                <TouchableOpacity className="bg-blue-500 rounded-lg px-4 py-2 self-start">
                  <Text className="text-white text-xs font-bold">
                    Contact Support
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Optional: Overlay version that can be placed over existing content
export function VerificationOverlay({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  storeName = 'Your Store',
  onKycPress,
}: Omit<VerificationGateProps, 'children'>) {
  const isFullyVerified = isAdminVerified && isKycVerified;

  if (isFullyVerified) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <View className="flex-1 justify-center items-center p-6">
        <View
          className="bg-white rounded-3xl w-full max-w-md"
          style={{
            maxHeight: height * 0.8,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <VerificationGate
              isAdminVerified={isAdminVerified}
              isKycVerified={isKycVerified}
              kycStatus={kycStatus}
              storeName={storeName}
              onKycPress={onKycPress}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}




interface CompactVerificationProps {
  isAdminVerified: boolean;
  isKycVerified: boolean;
  kycStatus?:KycDocumentStatus;
  onKycPress?: () => void;
}

// DESIGN VARIANT 1: Compact Card Version (for embedding in screens)
// ------------------------------------------------------------------
export function CompactVerificationCard({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  onKycPress,
}: CompactVerificationProps) {
  const isFullyVerified = isAdminVerified && isKycVerified;

  if (isFullyVerified) {
    return null;
  }

  const completedSteps = [isAdminVerified, isKycVerified].filter(Boolean).length;
  const totalSteps = 2;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 bg-amber-500 rounded-full items-center justify-center">
            <Ionicons name="shield-checkmark" size={20} color="white" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900">
              Complete Verification
            </Text>
            <Text className="text-xs text-gray-600">
              {completedSteps} of {totalSteps} steps done
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-amber-600">{progress}%</Text>
      </View>

      {/* Progress Bar */}
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${progress}%`, height: '100%' }}
        />
      </View>

      {/* Steps */}
      <View className="gap-2 mb-4">
        {/* Admin Step */}
        <View className="flex-row items-center gap-2">
          <View
            className={`w-5 h-5 rounded-full items-center justify-center ${
              isAdminVerified ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            {isAdminVerified && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
          <Text
            className={`text-sm ${
              isAdminVerified ? 'text-gray-700 line-through' : 'text-gray-900'
            }`}
          >
            Admin approval
          </Text>
          {isAdminVerified && (
            <View className="bg-green-100 rounded-full px-2 py-0.5">
              <Text className="text-green-700 text-[10px] font-bold">Done</Text>
            </View>
          )}
        </View>

        {/* KYC Step */}
        <View className="flex-row items-center gap-2">
          <View
            className={`w-5 h-5 rounded-full items-center justify-center ${
              isKycVerified ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            {isKycVerified && (
              <Ionicons name="checkmark" size={12} color="white" />
            )}
          </View>
          <Text
            className={`text-sm ${
              isKycVerified ? 'text-gray-700 line-through' : 'text-gray-900'
            }`}
          >
            KYC verification
          </Text>
          {kycStatus === 'pending' && (
            <View className="bg-amber-100 rounded-full px-2 py-0.5">
              <Text className="text-amber-700 text-[10px] font-bold">
                Pending
              </Text>
            </View>
          )}
          {kycStatus === 'rejected' && (
            <View className="bg-red-100 rounded-full px-2 py-0.5">
              <Text className="text-red-700 text-[10px] font-bold">
                Rejected
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Button */}
      {!isKycVerified && (
        <TouchableOpacity
          onPress={onKycPress || (() => router.push('/vendor/profile/documents' as any))}
          className="bg-amber-500 rounded-xl py-3 px-4"
        >
          <Text className="text-white text-sm font-bold text-center">
            {kycStatus === 'rejected'
              ? 'Resubmit KYC Documents'
              : kycStatus === 'pending'
              ? 'Check KYC Status'
              : 'Complete KYC Now'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// DESIGN VARIANT 2: Banner Version (for top of screen)
// -----------------------------------------------------
export function VerificationBanner({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  onKycPress,
}: CompactVerificationProps) {
  const isFullyVerified = isAdminVerified && isKycVerified;

  if (isFullyVerified) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#fef3c7', '#fde68a']}
      className="px-4 py-3 border-b border-amber-300"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-8 h-8 bg-amber-500 rounded-full items-center justify-center">
          <Ionicons name="warning" size={18} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-amber-900">
            Verification Required
          </Text>
          <Text className="text-xs text-amber-700">
            {!isAdminVerified && !isKycVerified
              ? 'Complete admin & KYC verification'
              : !isAdminVerified
              ? 'Waiting for admin approval'
              : 'Complete KYC verification'}
          </Text>
        </View>
        {!isKycVerified && (
          <TouchableOpacity
            onPress={onKycPress || (() => router.push('/vendor/profile/documents' as any))}
            className="bg-amber-600 rounded-lg px-3 py-2"
          >
            <Text className="text-white text-xs font-bold">Verify</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

// DESIGN VARIANT 3: Modal/Dialog Version
// ---------------------------------------
export function VerificationDialog({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  onKycPress,
  onDismiss,
}: CompactVerificationProps & { onDismiss?: () => void }) {
  const isFullyVerified = isAdminVerified && isKycVerified;

  if (isFullyVerified) {
    return null;
  }

  return (
    <View className="bg-white rounded-3xl p-6 shadow-2xl mx-6" style={{ maxWidth: 400 }}>
      {/* Icon */}
      <View className="items-center mb-6">
        <LinearGradient
          colors={['#10b981', '#059669']}
          className="w-16 h-16 rounded-full items-center justify-center"
        >
          <Ionicons name="lock-closed" size={32} color="white" />
        </LinearGradient>
      </View>

      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        Verification Required
      </Text>
      <Text className="text-sm text-gray-600 text-center mb-6">
        Complete these steps to unlock all vendor features
      </Text>

      {/* Checklist */}
      <View className="gap-4 mb-6">
        <View className="flex-row items-center gap-3">
          <View
            className={`w-6 h-6 rounded-full items-center justify-center ${
              isAdminVerified ? 'bg-green-500' : 'bg-gray-200'
            }`}
          >
            {isAdminVerified && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
          <Text
            className={`flex-1 text-sm ${
              isAdminVerified ? 'text-gray-500' : 'text-gray-900'
            }`}
          >
            Admin verification
          </Text>
          {isAdminVerified ? (
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          ) : (
            <Ionicons name="time" size={20} color="#9ca3af" />
          )}
        </View>

        <View className="flex-row items-center gap-3">
          <View
            className={`w-6 h-6 rounded-full items-center justify-center ${
              isKycVerified ? 'bg-green-500' : 'bg-gray-200'
            }`}
          >
            {isKycVerified && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
          <Text
            className={`flex-1 text-sm ${
              isKycVerified ? 'text-gray-500' : 'text-gray-900'
            }`}
          >
            KYC verification
          </Text>
          {isKycVerified ? (
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          ) : kycStatus === 'pending' ? (
            <Ionicons name="time" size={20} color="#f59e0b" />
          ) : kycStatus === 'rejected' ? (
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          ) : (
            <Ionicons name="alert-circle" size={20} color="#9ca3af" />
          )}
        </View>
      </View>

      {/* Actions */}
      <View className="gap-3">
        {!isKycVerified && (
          <TouchableOpacity
            onPress={onKycPress || (() => router.push('/vendor/profile/documents' as any))}
            className="bg-emerald-500 rounded-xl py-3"
          >
            <Text className="text-white text-sm font-bold text-center">
              {kycStatus === 'rejected'
                ? 'Resubmit Documents'
                : kycStatus === 'pending'
                ? 'Check Status'
                : 'Complete KYC'}
            </Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            className="bg-gray-100 rounded-xl py-3"
          >
            <Text className="text-gray-700 text-sm font-semibold text-center">
              Remind Me Later
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// DESIGN VARIANT 4: Inline Alert Version
// ---------------------------------------
export function InlineVerificationAlert({
  isAdminVerified,
  isKycVerified,
  kycStatus = 'not_uploaded',
  onKycPress,
}: CompactVerificationProps) {
  const isFullyVerified = isAdminVerified && isKycVerified;

  if (isFullyVerified) {
    return null;
  }

  return (
    <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
      <View className="flex-row items-start gap-3">
        <Ionicons name="alert-circle" size={24} color="#ef4444" />
        <View className="flex-1">
          <Text className="text-sm font-bold text-red-900 mb-1">
            Action Required
          </Text>
          <Text className="text-xs text-red-700 mb-3">
            {!isAdminVerified && !isKycVerified
              ? 'Your account needs admin approval and KYC verification to access features.'
              : !isAdminVerified
              ? 'Your account is under admin review. KYC verified ✓'
              : 'Complete KYC verification to unlock all features.'}
          </Text>
          {!isKycVerified && (
            <TouchableOpacity
              onPress={onKycPress || (() => router.push('/vendor/profile/documents' as any))}
              className="self-start"
            >
              <Text className="text-xs text-red-600 font-bold underline">
                {kycStatus === 'rejected'
                  ? 'Resubmit KYC →'
                  : kycStatus === 'pending'
                  ? 'View Status →'
                  : 'Complete Now →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}