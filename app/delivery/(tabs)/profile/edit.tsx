import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useDeliveryStore } from '@/store/useDeliveryStore';
import { useDeliveryBoyProfile, useUpdateDeliveryBoyProfile, useUploadDeliveryBoyPhoto } from '@/hooks/queries/useDeliveryBoy';
import * as ImagePicker from 'expo-image-picker';

/* ---------------- TYPES ---------------- */
interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  partnerId: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  profile_photo: string;
}

interface ValidationErrors {
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  [key: string]: string | undefined;
}

/* ---------------- MAIN COMPONENT ---------------- */
const EditProfileScreen = () => {
  const router = useRouter();
  const store = useDeliveryStore();
 
  // Fetch delivery boy profile
  const { data: profileData, isLoading, error: fetchError } = useDeliveryBoyProfile();
  const updateProfile = useUpdateDeliveryBoyProfile();
  const uploadPhoto = useUploadDeliveryBoyPhoto();

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    partnerId: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    vehicle_type: '',
    vehicle_number: '',
    license_number: '',
    profile_photo: '',
  });
  
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Initialize form with fetched data
  useEffect(() => {
    if (profileData) {
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        partnerId: profileData.id || '',
        address_line1: profileData.address_line1 || '',
        address_line2: profileData.address_line2 || '',
        city: profileData.city || '',
        state: profileData.state || '',
        pincode: profileData.pincode || '',
        emergency_contact_name: profileData.emergency_contact_name || '',
        emergency_contact_phone: profileData.emergency_contact_phone || '',
        vehicle_type: profileData.vehicle_type || '',
        vehicle_number: profileData.vehicle_number || '',
        license_number: profileData.license_number || '',
        profile_photo: profileData.profile_photo || '',
      });
    }
  }, [profileData]);

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleInputChange = (
    field: keyof ProfileFormData, 
    value: string
  ): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);

    // Clear error for this field
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    }

    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = 'Emergency contact name is required';
    }

    if (!formData.emergency_contact_phone.trim() || !/^[+]?[\d\s-]{10,}$/.test(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors before saving.',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }

    try {
      await updateProfile.mutateAsync(formData);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2:
          profileData?.kyc_status === 'approved'
            ? 'Profile updated successfully. Changes may require admin review.'
            : 'Profile updated successfully.',
        position: 'top',
        visibilityTime: 4000,
      });
      setHasChanges(false);
      router.back();
    } catch (error) {
      console.error('Save error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile. Please try again.',
        position: 'top',
        visibilityTime: 4000,
      });
    }
  };

  const handleCancel = (): void => {
    if (hasChanges) {
      Toast.show({
        type: 'info',
        text1: 'Unsaved Changes',
        text2: 'Going back will discard your unsaved changes.',
        position: 'top',
        visibilityTime: 3000,
      });
      // Small delay so the toast is visible before navigating back
      setTimeout(() => router.back(), 300);
    } else {
      router.back();
    }
  };

  const handleChangePhoto = (): void => {
    Toast.show({
      type: 'info',
      text1: 'Change Profile Photo',
      text2: 'Opening photo options...',
      position: 'top',
      visibilityTime: 1500,
    });
    // Slight delay to let the toast show before launching picker choice
    setTimeout(() => handlePickImage(), 400);
  };

  const handleTakePhoto = async (): Promise<void> => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Camera permission is required to take photos.',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto.mutate(result.assets[0].uri);
    }
  };

  const handlePickImage = async (): Promise<void> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Gallery access permission is required.',
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadPhoto.mutate(result.assets[0].uri);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5] items-center justify-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <SafeAreaView className="flex-1 bg-[#4f46e5] items-center justify-center px-4">
        <Feather name="alert-circle" size={48} color="white" />
        <Text className="text-white text-lg mt-4 text-center">Failed to load profile</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-white px-6 py-3 rounded-xl"
        >
          <Text className="text-indigo-600 font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled" 
          showsVerticalScrollIndicator={false} 
          bounces={false}
        >
          <View className="flex-1 justify-between">
            {/* Header */}
            <View className="px-4 py-4 flex-row items-center">
              <TouchableOpacity
                onPress={handleCancel}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                activeOpacity={0.8}
              >
                <Feather name="arrow-left" size={20} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-bold flex-1">Edit Profile</Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
              <View className="px-4">
                {/* Verification Warning */}
                {profileData?.kyc_status === 'approved' && (
                  <View className="bg-blue-50 border-l-4 border-blue-500 rounded-2xl p-4 mb-4 flex-row">
                    <Feather name="info" size={20} color="#3b82f6" />
                    <View className="flex-1 ml-3">
                      <Text className="text-blue-900 font-semibold text-sm mb-1">
                        Note
                      </Text>
                      <Text className="text-blue-800 text-xs leading-5">
                        Editing profile may require admin re-approval.
                      </Text>
                    </View>
                  </View>
                )}

                {(profileData?.kyc_status === 'pending' || profileData?.kyc_status === 'rejected') && (
                  <View className="bg-orange-50 border-l-4 border-orange-500 rounded-2xl p-4 mb-4 flex-row">
                    <Feather name="alert-triangle" size={20} color="#ea580c" />
                    <View className="flex-1 ml-3">
                      <Text className="text-orange-900 font-semibold text-sm mb-1">
                        Review Required
                      </Text>
                      <Text className="text-orange-800 text-xs leading-5">
                        Your changes will be reviewed by admin.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Profile Photo Section */}
                <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg items-center">
                  <View className="relative mb-4">
                    {formData.profile_photo || profileData?.profile_photo ? (
                      <Image
                        source={{ uri: formData.profile_photo || profileData?.profile_photo }}
                        className="w-24 h-24 rounded-full"
                      />
                    ) : (
                      <View className="w-24 h-24 bg-indigo-500 rounded-full items-center justify-center">
                        <Text className="text-white text-3xl font-bold">
                          {getInitials(formData.first_name, formData.last_name)}
                        </Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={handleChangePhoto}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full items-center justify-center border-2 border-white"
                      activeOpacity={0.8}
                      disabled={uploadPhoto.isPending}
                    >
                      {uploadPhoto.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="camera" size={16} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.8}>
                    <Text className="text-indigo-600 font-semibold mb-1">
                      Change Profile Photo
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-xs text-gray-500">Clear face photo recommended</Text>
                </View>

                {/* Personal Details Form */}
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Personal Details</Text>

                  {/* First Name */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      First Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.first_name}
                      onChangeText={(text) => handleInputChange('first_name', text)}
                      placeholder="Enter your first name"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.first_name && (
                      <Text className="text-red-500 text-xs mt-1">{errors.first_name}</Text>
                    )}
                  </View>

                  {/* Last Name */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Last Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.last_name}
                      onChangeText={(text) => handleInputChange('last_name', text)}
                      placeholder="Enter your last name"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.last_name && (
                      <Text className="text-red-500 text-xs mt-1">{errors.last_name}</Text>
                    )}
                  </View>

                  {/* Email */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm font-semibold text-gray-700 mr-2">
                        Email Address
                      </Text>
                      <Feather name="lock" size={14} color="#9ca3af" />
                    </View>
                    <TextInput
                      value={formData.email}
                      editable={false}
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-500 bg-gray-50"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      To change email address, contact support.
                    </Text>
                  </View>

                  {/* Phone Number (Read-only) */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm font-semibold text-gray-700 mr-2">
                        Phone Number
                      </Text>
                      <Feather name="lock" size={14} color="#9ca3af" />
                    </View>
                    <TextInput
                      value={formData.phone}
                      editable={false}
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-500 bg-gray-50"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      To change phone number, contact support.
                    </Text>
                  </View>

                  {/* Partner ID (Read-only) */}
                  <View>
                    <View className="flex-row items-center mb-2">
                      <Text className="text-sm font-semibold text-gray-700 mr-2">
                        Partner ID
                      </Text>
                      <Feather name="lock" size={14} color="#9ca3af" />
                    </View>
                    <TextInput
                      value={formData.partnerId}
                      editable={false}
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-500 bg-gray-50"
                    />
                  </View>
                </View>

                {/* Address Information */}
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-900">Address</Text>
                    <TouchableOpacity
                      className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-lg"
                      activeOpacity={0.8}
                    >
                      <Feather name="map-pin" size={16} color="#4f46e5" />
                      <Text className="text-indigo-600 font-semibold text-xs ml-1">
                        Use GPS
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Street Address Line 1 */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Street Address <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.address_line1}
                      onChangeText={(text) => handleInputChange('address_line1', text)}
                      placeholder="House no, Building name, Street"
                      multiline
                      numberOfLines={2}
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.address_line1 && (
                      <Text className="text-red-500 text-xs mt-1">{errors.address_line1}</Text>
                    )}
                  </View>

                  {/* Street Address Line 2 */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Address Line 2 (Optional)
                    </Text>
                    <TextInput
                      value={formData.address_line2}
                      onChangeText={(text) => handleInputChange('address_line2', text)}
                      placeholder="Apartment, suite, etc."
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* City */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      City <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.city}
                      onChangeText={(text) => handleInputChange('city', text)}
                      placeholder="Enter city"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.city && (
                      <Text className="text-red-500 text-xs mt-1">{errors.city}</Text>
                    )}
                  </View>

                  {/* State & Pincode Row */}
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        State <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        value={formData.state}
                        onChangeText={(text) => handleInputChange('state', text)}
                        placeholder="State"
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9ca3af"
                      />
                      {errors.state && (
                        <Text className="text-red-500 text-xs mt-1">{errors.state}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">
                        Pincode <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        value={formData.pincode}
                        onChangeText={(text) => handleInputChange('pincode', text)}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                        placeholderTextColor="#9ca3af"
                      />
                      {errors.pincode && (
                        <Text className="text-red-500 text-xs mt-1">{errors.pincode}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Vehicle Information */}
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Vehicle Information</Text>

                  {/* Vehicle Type */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Type
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {['bike', 'scooter', 'bicycle', 'car', 'van'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => handleInputChange('vehicle_type', type)}
                          className={`px-4 py-2 rounded-xl border-2 ${
                            formData.vehicle_type === type
                              ? 'bg-indigo-100 border-indigo-600'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`font-semibold capitalize ${
                              formData.vehicle_type === type ? 'text-indigo-600' : 'text-gray-700'
                            }`}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Vehicle Number */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Vehicle Number
                    </Text>
                    <TextInput
                      value={formData.vehicle_number}
                      onChangeText={(text) => handleInputChange('vehicle_number', text.toUpperCase())}
                      placeholder="e.g., DL01AB1234"
                      autoCapitalize="characters"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* License Number */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      License Number
                    </Text>
                    <TextInput
                      value={formData.license_number}
                      onChangeText={(text) => handleInputChange('license_number', text.toUpperCase())}
                      placeholder="e.g., DL1234567890"
                      autoCapitalize="characters"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>

                {/* Emergency Contact */}
                <View className="bg-white rounded-3xl p-5 mb-4 shadow-lg">
                  <Text className="text-lg font-bold text-gray-900 mb-1">Emergency Contact</Text>
                  <Text className="text-xs text-gray-500 mb-4">Used only in emergencies.</Text>

                  {/* Contact Name */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Contact Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.emergency_contact_name}
                      onChangeText={(text) => handleInputChange('emergency_contact_name', text)}
                      placeholder="Full name"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.emergency_contact_name && (
                      <Text className="text-red-500 text-xs mt-1">{errors.emergency_contact_name}</Text>
                    )}
                  </View>

                  {/* Contact Phone */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.emergency_contact_phone}
                      onChangeText={(text) => handleInputChange('emergency_contact_phone', text)}
                      placeholder="+91 00000 00000"
                      keyboardType="phone-pad"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.emergency_contact_phone && (
                      <Text className="text-red-500 text-xs mt-1">{errors.emergency_contact_phone}</Text>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="bg-white border-t border-gray-200 rounded-2xl px-4 py-4 shadow-lg">
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={handleCancel}
                      className="flex-1 border-2 border-gray-300 py-4 rounded-xl"
                      activeOpacity={0.8}
                    >
                      <Text className="text-gray-700 font-bold text-center">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSave}
                      disabled={!hasChanges || updateProfile.isPending}
                      className={`flex-1 py-4 rounded-xl ${
                        hasChanges && !updateProfile.isPending ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                      activeOpacity={0.8}
                    >
                      {updateProfile.isPending ? (
                        <Text className="text-white font-bold text-center">Saving...</Text>
                      ) : (
                        <Text className="text-white font-bold text-center">Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;