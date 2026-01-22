import React, { useState } from 'react';
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

type BankStatus = 'not_added' | 'pending' | 'approved' | 'rejected';
type AccountType = 'savings' | 'current';

interface BankData {
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: AccountType;
  branchName: string;
  upiId: string;
  proofImage: string | null;
  status: BankStatus;
  rejectionReason?: string;
}

export default function BankDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Example: Existing bank (change to null for "no bank" state)
  const [bank, setBank] = useState<BankData | null>({
    holderName: 'Rajesh Kumar',
    bankName: 'State Bank of India',
    accountNumber: '1234567890123456',
    ifscCode: 'SBIN0001234',
    accountType: 'savings',
    branchName: 'MG Road Branch',
    upiId: 'rajesh@paytm',
    proofImage: 'https://via.placeholder.com/400x300',
    status: 'rejected',
    rejectionReason:
      'Account holder name does not match KYC records. Please ensure the name matches your Aadhaar card.',
  });

  const [formData, setFormData] = useState<
    Omit<BankData, 'status' | 'rejectionReason'>
  >(
    bank || {
      holderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'savings',
      branchName: '',
      upiId: '',
      proofImage: null,
    }
  );

  const accountTypes = [
    { value: 'savings', label: 'Savings Account' },
    { value: 'current', label: 'Current Account' },
  ];

  const getStatusBadge = (status: BankStatus) => {
    const badges = {
      not_added: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        label: 'Not Added',
        icon: <Feather name='clock' size={24} color="#6b7280" />,
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: 'Pending',
        icon: <Feather name='clock' size={24} color="#ca8a04" />,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: 'Approved',
        icon: <Feather name='check-circle' size={24} color="#16a34a" />,
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: 'Rejected',
        icon: <Feather name='alert-circle' size={24} color="#dc2626" />,
      },
    };
    return badges[status];
  };

  const getStatusMessage = (status: BankStatus) => {
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
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
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

      if (!result.canceled) {
        setFormData({ ...formData, proofImage: result.assets[0].uri });
        setUploadModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const validateIFSC = (code: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(code);
  };

  const handleSave = async () => {
    // Validation
    if (
      !formData.holderName ||
      !formData.bankName ||
      !formData.accountNumber ||
      !formData.ifscCode
    ) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    if (!validateIFSC(formData.ifscCode)) {
      Alert.alert('Validation Error', 'Invalid IFSC code format');
      return;
    }

    if (formData.accountNumber.length < 8 || formData.accountNumber.length > 18) {
      Alert.alert(
        'Validation Error',
        'Account number must be between 8 and 18 digits'
      );
      return;
    }

    if (!formData.proofImage) {
      Alert.alert('Validation Error', 'Please upload bank proof document');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBank({
        ...formData,
        status: 'pending',
      });
      setLoading(false);
      Alert.alert(
        'Success',
        bank
          ? 'Bank details updated successfully'
          : 'Bank account added successfully'
      );
    }, 1500);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Removing your bank account will disable payouts until a new account is verified. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBank(null);
            setFormData({
              holderName: '',
              bankName: '',
              accountNumber: '',
              ifscCode: '',
              accountType: 'savings',
              branchName: '',
              upiId: '',
              proofImage: null,
            });
          },
        },
      ]
    );
  };

  const currentStatus = bank?.status || 'not_added';
  const isFormValid =
    formData.holderName &&
    formData.bankName &&
    formData.accountNumber &&
    formData.ifscCode &&
    validateIFSC(formData.ifscCode) &&
    formData.proofImage;

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="bg-[#4f46e5] px-4 pt-4 pb-6">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name='arrow-left' size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Bank Details</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6">
        {/* Bank Verification Status Card */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-start gap-3">
            <View
              className={`p-3 rounded-xl ${getStatusBadge(currentStatus).bg}`}
            >
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
                <Text
                  className={`text-xs font-medium ${
                    getStatusBadge(currentStatus).text
                  }`}
                >
                  {getStatusBadge(currentStatus).label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rejection Reason */}
        {bank?.status === 'rejected' && bank.rejectionReason && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Feather name='alert-circle' size={20} color="#dc2626" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-900 mb-1">
                  Admin Feedback
                </Text>
                <Text className="text-sm text-red-800">
                  {bank.rejectionReason}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bank Account Form */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-gray-900 text-lg mb-4">
            {bank ? 'Update Bank Account' : 'Add Bank Account'}
          </Text>

          {/* Account Holder Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="As per bank records"
              value={formData.holderName}
              onChangeText={(text) =>
                setFormData({ ...formData, holderName: text })
              }
            />
            <Text className="text-xs text-gray-500 mt-1">
              Must match your KYC documents
            </Text>
          </View>

          {/* Bank Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Bank Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., State Bank of India"
              value={formData.bankName}
              onChangeText={(text) =>
                setFormData({ ...formData, bankName: text })
              }
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
                    ? formData.accountNumber
                    : maskAccountNumber(formData.accountNumber)
                }
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    accountNumber: text.replace(/[^0-9]/g, ''),
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
                  <Feather name='eye-off' size={20} color="#6b7280" />
                ) : (
                  <Feather name='eye' size={20} color="#6b7280" />
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
              value={formData.ifscCode}
              onChangeText={(text) =>
                setFormData({ ...formData, ifscCode: text.toUpperCase() })
              }
              autoCapitalize="characters"
              maxLength={11}
            />
            {formData.ifscCode && !validateIFSC(formData.ifscCode) && (
              <Text className="text-xs text-red-600 mt-1">
                Invalid IFSC code format
              </Text>
            )}
          </View>

          {/* Account Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Account Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() =>
                setShowAccountTypeDropdown(!showAccountTypeDropdown)
              }
            >
              <Text className="text-gray-900">
                {
                  accountTypes.find((a) => a.value === formData.accountType)
                    ?.label
                }
              </Text>
              <Feather name='chevron-down' size={20} color="#6b7280" />
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
                        accountType: type.value as AccountType,
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
              value={formData.branchName}
              onChangeText={(text) =>
                setFormData({ ...formData, branchName: text })
              }
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
              value={formData.upiId}
              onChangeText={(text) =>
                setFormData({ ...formData, upiId: text.toLowerCase() })
              }
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

          {formData.proofImage ? (
            <View>
              <Image
                source={{ uri: formData.proofImage }}
                className="w-full h-48 rounded-xl mb-3"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="bg-indigo-50 py-3 rounded-xl flex-row items-center justify-center gap-2"
                onPress={() => setUploadModal(true)}
              >
                <Feather name='upload' size={18} color="#4f46e5" />
                <Text className="text-[#4f46e5] font-semibold">
                  Replace Image
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl py-8 flex items-center justify-center gap-2"
              onPress={() => setUploadModal(true)}
            >
              <Feather name='upload' size={32} color="#6b7280" />
              <Text className="text-gray-600 font-medium">
                Upload Bank Proof
              </Text>
              <Text className="text-sm text-gray-500">Max size: 5MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="mb-6">
          <TouchableOpacity
            className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${
              isFormValid && !loading ? 'bg-[#4f46e5]' : 'bg-gray-300'
            }`}
            onPress={handleSave}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name='check-circle' size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {bank ? 'Save Changes' : 'Add Bank Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {bank && (
            <TouchableOpacity
              className="mt-3 py-4 rounded-xl border-2 border-red-500 flex-row items-center justify-center gap-2"
              onPress={handleDelete}
            >
              <Feather name='trash-2' size={20} color="#dc2626" />
              <Text className="text-red-600 font-semibold text-base">
                Remove Bank Account
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Banner */}
        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <View className="flex-row gap-3">
            <Feather name='alert-circle' size={20} color="#3b82f6" />
            <View className="flex-1">
              <Text className="text-sm text-blue-900 font-medium mb-1">
                Important
              </Text>
              <Text className="text-sm text-blue-800">
                Bank verification takes 24-48 hours. Withdrawals will be enabled
                only after verification is complete.
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
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setUploadModal(false)}
        >
          <Pressable className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Upload Bank Proof
              </Text>
              <TouchableOpacity onPress={() => setUploadModal(false)}>
                <Feather name='x' size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Choose how you'd like to upload. Max file size: 5MB
            </Text>

            <TouchableOpacity
              className="bg-[#4f46e5] py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('camera')}
            >
              <Feather name='camera' size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-base">
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-100 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('gallery')}
            >
              <Feather name='image' size={24} color="#4f46e5" />
              <Text className="text-[#4f46e5] font-semibold text-base">
                Choose from Gallery
              </Text>
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