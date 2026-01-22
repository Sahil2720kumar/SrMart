import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeliveryStore } from '@/store/useDeliveryStore';


/* ---------------- MOCK INITIAL DATA ---------------- */
const initialProfileData = {
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  phone: '+91 98765 43210',
  partnerId: 'P001',
  address: {
    street: 'B-204, Green Valley Apartments',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301'
  },
  emergencyContact: {
    name: 'Priya Sharma',
    phone: '+91 98765 12345'
  }
};

/* ---------------- MAIN COMPONENT ---------------- */
const EditProfileScreen = () => {
  const router = useRouter();
  const store = useDeliveryStore();

  const [formData, setFormData] = useState(initialProfileData);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInputChange = (field: string, value: string, nestedField?: string) => {
    if (nestedField) {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nestedField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setHasChanges(true);

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.address.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.address.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.address.pincode.trim() || !/^\d{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = 'Valid 6-digit pincode is required';
    }

    if (!formData.emergencyContact.name.trim()) {
      newErrors.emergencyName = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact.phone.trim() || !/^[+]?[\d\s-]{10,}$/.test(formData.emergencyContact.phone)) {
      newErrors.emergencyPhone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        'Success',
        store.adminVerificationStatus === 'approved'
          ? 'Profile updated successfully. Changes may require admin review.'
          : 'Profile updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => { } },
        { text: 'Choose from Gallery', onPress: () => { } },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          <View className="flex-1  justify-between">
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

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom:30}}>
              <View className="px-4">
                {/* Verification Warning */}
                {store.adminVerificationStatus === 'approved' && (
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

                {(store.adminVerificationStatus === 'pending' || store.adminVerificationStatus === 'rejected') && (
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
                    <View className="w-24 h-24 bg-indigo-500 rounded-full items-center justify-center">
                      <Text className="text-white text-3xl font-bold">
                        {getInitials(formData.name)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleChangePhoto}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full items-center justify-center border-2 border-white"
                      activeOpacity={0.8}
                    >
                      <Feather name="camera" size={16} color="white" />
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

                  {/* Full Name */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Full Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.name}
                      onChangeText={(text) => handleInputChange('name', text)}
                      placeholder="Enter your full name"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.name && (
                      <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
                    )}
                  </View>

                  {/* Email */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </Text>
                    <TextInput
                      value={formData.email}
                      onChangeText={(text) => handleInputChange('email', text)}
                      placeholder="email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.email && (
                      <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>
                    )}
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

                  {/* Street Address */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Street Address <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.address.street}
                      onChangeText={(text) => handleInputChange('address', text, 'street')}
                      placeholder="House no, Building name, Street"
                      multiline
                      numberOfLines={2}
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.street && (
                      <Text className="text-red-500 text-xs mt-1">{errors.street}</Text>
                    )}
                  </View>

                  {/* City */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      City <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.address.city}
                      onChangeText={(text) => handleInputChange('address', text, 'city')}
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
                        value={formData.address.state}
                        onChangeText={(text) => handleInputChange('address', text, 'state')}
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
                        value={formData.address.pincode}
                        onChangeText={(text) => handleInputChange('address', text, 'pincode')}
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
                      value={formData.emergencyContact.name}
                      onChangeText={(text) => handleInputChange('emergencyContact', text, 'name')}
                      placeholder="Full name"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.emergencyName && (
                      <Text className="text-red-500 text-xs mt-1">{errors.emergencyName}</Text>
                    )}
                  </View>

                  {/* Contact Phone */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      value={formData.emergencyContact.phone}
                      onChangeText={(text) => handleInputChange('emergencyContact', text, 'phone')}
                      placeholder="+91 00000 00000"
                      keyboardType="phone-pad"
                      className="border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                      placeholderTextColor="#9ca3af"
                    />
                    {errors.emergencyPhone && (
                      <Text className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</Text>
                    )}
                  </View>
                </View>

                <View className="  bg-white border-t border-gray-200 rounded-2xl px-4 py-4 shadow-lg">
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
                      disabled={!hasChanges || isSaving}
                      className={`flex-1 py-4 rounded-xl ${hasChanges && !isSaving ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      activeOpacity={0.8}
                    >
                      {isSaving ? (
                        <Text className="text-white font-bold text-center">Saving...</Text>
                      ) : (
                        <Text className="text-white font-bold text-center">Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Sticky Bottom Actions */}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;