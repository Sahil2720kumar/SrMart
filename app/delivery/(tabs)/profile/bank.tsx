import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { File } from 'expo-file-system';
import {
  useDeliveryBoyBankDetails,
  useAddDeliveryBoyBankDetails,
  useUpdateDeliveryBoyBankDetails,
  useDeleteDeliveryBoyBankDetails,
  useKycBankPassbook,
  useUploadBankProof,
  useValidateIFSC,
  BankDetailsInput,
} from '@/hooks/queries/useDeliveryBoy';
import { BankAccountType, BankVerificationStatus } from '@/types/payments-wallets.types';

export default function DeliveryBoyBankDetailsScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;
  const userType = 'delivery_boy'; // Delivery boy user type

  // Queries
  const { data: bankDetails, isLoading: isBankLoading } = useDeliveryBoyBankDetails(userId || '');
  const { data: kycPassbook, isLoading: isPassbookLoading } = useKycBankPassbook(userId || '');

  // console.log('bankDetails',bankDetails?.proof_image);
  // console.log("kyc ",kycPassbook.document_url);
   
  // Mutations
  const addBankMutation = useAddDeliveryBoyBankDetails();
  const updateBankMutation = useUpdateDeliveryBoyBankDetails();
  const deleteBankMutation = useDeleteDeliveryBoyBankDetails();
  const uploadProofMutation = useUploadBankProof();

  // State
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [formData, setFormData] = useState<BankDetailsInput>({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings',
    branch: '',
    upi_id: '',
    proof_image: '',
  });

  const validateIFSC = useValidateIFSC();

  // Initialize form data when bank details are loaded
  useEffect(() => {
    if (bankDetails) {
      setFormData({
        account_holder_name: bankDetails.account_holder_name,
        bank_name: bankDetails.bank_name,
        account_number: bankDetails.account_number,
        ifsc_code: bankDetails.ifsc_code,
        account_type: bankDetails.account_type || 'savings',
        branch: bankDetails.branch || '',
        upi_id: bankDetails.upi_id || '',
        proof_image: bankDetails.proof_image || kycPassbook?.document_url || '',
      });
    } else if (kycPassbook?.document_url) {
      // If no bank details but passbook exists, set the image
      setFormData((prev) => ({
        ...prev,
        proof_image: kycPassbook.document_url,
      }));
    }
  }, [bankDetails, kycPassbook]);

  const accountTypes = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'current', label: 'Current Account' },
  ];

  const getStatusBadge = (status: BankVerificationStatus) => {
    const badges = {
      not_added: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Not Added',
        icon: <Feather name="clock" size={24} color="#6b7280" />,
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending',
        icon: <Feather name="clock" size={24} color="#ca8a04" />,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Approved',
        icon: <Feather name="check-circle" size={24} color="#16a34a" />,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Rejected',
        icon: <Feather name="alert-circle" size={24} color="#dc2626" />,
      },
    };
    return badges[status];
  };

  const getStatusMessage = (status: BankVerificationStatus) => {
    const messages = {
      not_added: 'Add your bank details to receive payouts.',
      pending: 'Bank details are under admin verification.',
      approved: 'Bank account verified. Withdrawals enabled.',
      rejected: 'Please update your bank details.',
    };
    return messages[status];
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    if (showAccountNumber) return accountNumber;
    const length = accountNumber.length;
    if (length <= 4) return accountNumber;
    return 'X'.repeat(length - 4) + accountNumber.slice(-4);
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera permission is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Gallery permission is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Read file as base64
        const localFile = new File(imageUri);
        const base64 = await localFile.base64();

        // Upload to storage - will replace existing KYC document if exists
        uploadProofMutation.mutate(
          {
            imageUri,
            base64,
            userId: userId || '',
            userType: userType, // Pass delivery_boy user type
          },
          {
            onSuccess: (data) => {
              setFormData({ ...formData, proof_image: data.documentUrl });
              setUploadModal(false);
              Alert.alert(
                'Success',
                data.isUpdate
                  ? 'Bank proof updated successfully'
                  : 'Bank proof uploaded successfully'
              );
            },
            onError: (error: any) => {
              Alert.alert('Upload Failed', error.message);
            },
          }
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (
      !formData.account_holder_name ||
      !formData.bank_name ||
      !formData.account_number ||
      !formData.ifsc_code
    ) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    if (!validateIFSC(formData.ifsc_code)) {
      Alert.alert('Validation Error', 'Invalid IFSC code format');
      return;
    }

    if (formData.account_number.length < 8 || formData.account_number.length > 18) {
      Alert.alert('Validation Error', 'Account number must be between 8 and 18 digits');
      return;
    }

    if (!formData.proof_image) {
      Alert.alert('Validation Error', 'Please upload bank proof document');
      return;
    }

    // Add or Update
    if (bankDetails) {
      // Update existing
      updateBankMutation.mutate(
        {
          id: bankDetails.id,
          delivery_boy_id: userId || '',
          bankDetails: formData,
        },
        {
          onSuccess: () => {
            Alert.alert('Success', 'Bank details updated successfully');
          },
          onError: (error: any) => {
            Alert.alert('Update Failed', error.message);
          },
        }
      );
    } else {
      // Add new
      addBankMutation.mutate(
        {
          delivery_boy_id: userId || '',
          bankDetails: formData,
        },
        {
          onSuccess: () => {
            Alert.alert('Success', 'Bank account added successfully');
          },
          onError: (error: any) => {
            Alert.alert('Add Failed', error.message);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!bankDetails) return;

    Alert.alert(
      'Confirm Delete',
      'Removing your bank account will disable payouts until a new account is verified. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBankMutation.mutate(
              {
                id: bankDetails.id,
                delivery_boy_id: userId || '',
              },
              {
                onSuccess: () => {
                  setFormData({
                    account_holder_name: '',
                    bank_name: '',
                    account_number: '',
                    ifsc_code: '',
                    account_type: 'savings',
                    branch: '',
                    upi_id: '',
                    proof_image: '',
                  });
                  Alert.alert('Success', 'Bank account removed successfully');
                },
                onError: (error: any) => {
                  Alert.alert('Delete Failed', error.message);
                },
              }
            );
          },
        },
      ]
    );
  };

  const currentStatus = bankDetails?.status || 'not_added';
  const isFormValid =
    formData.account_holder_name &&
    formData.bank_name &&
    formData.account_number &&
    formData.ifsc_code &&
    validateIFSC(formData.ifsc_code) &&
    formData.proof_image;

  const isSaving =
    addBankMutation.isPending || updateBankMutation.isPending || uploadProofMutation.isPending;

  if (isBankLoading || isPassbookLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5] items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="bg-[#4f46e5] px-4 pt-4 pb-6">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Bank Details</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6">
        {/* Bank Verification Status Card */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-start gap-3">
            <View className={`p-3 rounded-xl ${getStatusBadge(currentStatus).bg}`}>
              {getStatusBadge(currentStatus).icon}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-base mb-1">
                Bank Verification Status
              </Text>
              <Text className="text-sm text-gray-600 mb-2">
                {getStatusMessage(currentStatus)}
              </Text>
              <View
                className={`self-start px-3 py-1 rounded-full ${
                  getStatusBadge(currentStatus).bg
                }`}
              >
                <Text className={`text-xs font-medium ${getStatusBadge(currentStatus).text}`}>
                  {getStatusBadge(currentStatus).label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rejection Reason */}
        {bankDetails?.status === 'rejected' && bankDetails.rejection_reason && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-900 mb-1">Admin Feedback</Text>
                <Text className="text-sm text-red-800">{bankDetails.rejection_reason}</Text>
              </View>
            </View>
          </View>
        )}

      {/* Bank Account Form */}
      <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-gray-900 text-lg mb-4">
            {bankDetails ? 'Update Bank Account' : 'Add Bank Account'}
          </Text>

          {/* Account Holder Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="As per bank records"
              value={formData.account_holder_name}
              onChangeText={(text) => setFormData({ ...formData, account_holder_name: text })}
            />
            <Text className="text-xs text-gray-500 mt-1">Must match your KYC documents</Text>
          </View>

          {/* Bank Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Bank Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., State Bank of India"
              value={formData.bank_name}
              onChangeText={(text) => setFormData({ ...formData, bank_name: text })}
            />
          </View>

          {/* Account Number */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Account Number <Text className="text-red-500">*</Text>
            </Text>
            <View className="relative">
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 pr-12 text-gray-900"
                placeholder="Enter account number"
                value={
                  showAccountNumber
                    ? formData.account_number
                    : maskAccountNumber(formData.account_number)
                }
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    account_number: text.replace(/[^0-9]/g, ''),
                  })
                }
                keyboardType="numeric"
                maxLength={18}
                secureTextEntry={!showAccountNumber}
              />
              <TouchableOpacity
                className="absolute right-4 top-3"
                onPress={() => setShowAccountNumber(!showAccountNumber)}
              >
                {showAccountNumber ? (
                  <Feather name="eye-off" size={20} color="#6b7280" />
                ) : (
                  <Feather name="eye" size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* IFSC Code */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              IFSC Code <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., SBIN0001234"
              value={formData.ifsc_code}
              onChangeText={(text) => setFormData({ ...formData, ifsc_code: text.toUpperCase() })}
              autoCapitalize="characters"
              maxLength={11}
            />
            {formData.ifsc_code && !validateIFSC(formData.ifsc_code) && (
              <Text className="text-xs text-red-600 mt-1">Invalid IFSC code format</Text>
            )}
          </View>

          {/* Account Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Account Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
            >
              <Text className="text-gray-900">
                {accountTypes.find((a) => a.value === formData.account_type)?.label}
              </Text>
              <Feather name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>

            {showAccountTypeDropdown && (
              <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                {accountTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                    onPress={() => {
                      setFormData({
                        ...formData,
                        account_type: type.value as BankAccountType,
                      });
                      setShowAccountTypeDropdown(false);
                    }}
                  >
                    <Text className="text-gray-900">{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Branch Name (Optional) */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Branch Name <Text className="text-gray-500">(Optional)</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., MG Road Branch"
              value={formData.branch}
              onChangeText={(text) => setFormData({ ...formData, branch: text })}
            />
          </View>

          {/* UPI ID (Optional) */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              UPI ID <Text className="text-gray-500">(Optional)</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., yourname@paytm"
              value={formData.upi_id}
              onChangeText={(text) => setFormData({ ...formData, upi_id: text.toLowerCase() })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Bank Proof Upload */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-900 text-base mb-2">
            Bank Proof Document <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Upload cancelled cheque or bank passbook front page.
          </Text>

          {/* Show info if using KYC passbook */}
          {kycPassbook?.document_url && formData.proof_image === kycPassbook.document_url && (
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 flex-row items-center gap-2">
              <Feather name="info" size={16} color="#3b82f6" />
              <Text className="text-xs text-blue-800 flex-1">
                Using bank passbook from KYC documents
              </Text>
            </View>
          )}

          {formData.proof_image ? (
            <View>
              <Image
                source={{ uri: formData.proof_image }}
                className="w-full h-48 rounded-xl mb-3"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="bg-indigo-50 py-3 rounded-xl flex-row items-center justify-center gap-2"
                onPress={() => setUploadModal(true)}
                disabled={uploadProofMutation.isPending}
              >
                {uploadProofMutation.isPending ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <>
                    <Feather name="upload" size={18} color="#4f46e5" />
                    <Text className="text-[#4f46e5] font-semibold">Replace Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl py-8 flex items-center justify-center gap-2"
              onPress={() => setUploadModal(true)}
              disabled={uploadProofMutation.isPending}
            >
              {uploadProofMutation.isPending ? (
                <ActivityIndicator size="large" color="#6b7280" />
              ) : (
                <>
                  <Feather name="upload" size={32} color="#6b7280" />
                  <Text className="text-gray-600 font-medium">Upload Bank Proof</Text>
                  <Text className="text-sm text-gray-500">Max size: 5MB</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="mb-6">
          <TouchableOpacity
            className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${
              isFormValid && !isSaving ? 'bg-[#4f46e5]' : 'bg-gray-300'
            }`}
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {bankDetails ? 'Save Changes' : 'Add Bank Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {bankDetails && (
            <TouchableOpacity
              className="mt-3 py-4 rounded-xl border-2 border-red-500 flex-row items-center justify-center gap-2"
              onPress={handleDelete}
              disabled={deleteBankMutation.isPending}
            >
              {deleteBankMutation.isPending ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <>
                  <Feather name="trash-2" size={20} color="#dc2626" />
                  <Text className="text-red-600 font-semibold text-base">Remove Bank Account</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row gap-3">
            <Feather name="alert-circle" size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm text-blue-900 font-medium mb-1">Important</Text>
              <Text className="text-sm text-blue-800">
                Bank verification takes 24-48 hours. Withdrawals will be enabled only after
                verification is complete.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModal(false)}
      >
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setUploadModal(false)}>
          <Pressable className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Upload Bank Proof</Text>
              <TouchableOpacity onPress={() => setUploadModal(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Choose how you'd like to upload. Max file size: 5MB
            </Text>

            <TouchableOpacity
              className="bg-[#4f46e5] py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('camera')}
            >
              <Feather name="camera" size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-100 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('gallery')}
            >
              <Feather name="image" size={24} color="#4f46e5" />
              <Text className="text-[#4f46e5] font-semibold text-base">Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-4 rounded-xl flex-row items-center justify-center"
              onPress={() => setUploadModal(false)}
            >
              <Text className="text-gray-600 font-medium">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}