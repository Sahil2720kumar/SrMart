import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVendorDetail, useUpdateVendorProfile } from '@/hooks/queries';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { FullPageError } from '@/components/ErrorComp';

type DaySchedule = {
  open: string;
  close: string;
  isClosed: boolean;
};

type WeekSchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS: Record<typeof DAYS[number], string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_HOURS: DaySchedule = {
  open: '09:00',
  close: '21:00',
  isClosed: false,
};

export default function EditProfileScreen() {
  const { user } = useProfileStore();
  const { session } = useAuthStore();

  // Fetch vendor data
  const {
    data: vendorData,
    isLoading: isLoadingVendor,
    isError,
    error,
    refetch
  } = useVendorDetail(session?.user?.id || '');

  // console.log(vendorData);
  

  // Update mutation
  const updateVendorMutation = useUpdateVendorProfile();

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [businessHours, setBusinessHours] = useState<WeekSchedule>({
    monday: { ...DEFAULT_HOURS },
    tuesday: { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday: { ...DEFAULT_HOURS },
    friday: { ...DEFAULT_HOURS },
    saturday: { ...DEFAULT_HOURS },
    sunday: { ...DEFAULT_HOURS, isClosed: true },
  });
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with vendor data
  useEffect(() => {
    if (vendorData) {
      setStoreName(vendorData.store_name || '');
      setStoreDescription(vendorData.store_description || '');
      setAddress(vendorData.address || '');
      setCity(vendorData.city || '');
      setState(vendorData.state || '');
      setPincode(vendorData.pincode || '');

      // Parse business hours
      if (vendorData.business_hours && Object.keys(vendorData.business_hours).length > 0) {
        const parsedHours: Partial<WeekSchedule> = {};
        DAYS.forEach(day => {
          const dayHours = vendorData.business_hours[day];
          if (dayHours) {
            parsedHours[day] = {
              open: dayHours.open || DEFAULT_HOURS.open,
              close: dayHours.close || DEFAULT_HOURS.close,
              isClosed: false,
            };
          } else {
            parsedHours[day] = { ...DEFAULT_HOURS, isClosed: true };
          }
        });
        setBusinessHours(parsedHours as WeekSchedule);
      }
    }
  }, [vendorData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    // Validate business hours
    DAYS.forEach(day => {
      const schedule = businessHours[day];
      if (!schedule.isClosed) {
        if (!schedule.open || !schedule.close) {
          newErrors[`${day}_hours`] = 'Operating hours are required for open days';
        } else if (schedule.open >= schedule.close) {
          newErrors[`${day}_hours`] = 'Closing time must be after opening time';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix all errors before saving');
      return;
    }

    try {
      // Format business hours for database (remove isClosed flag and closed days)
      const formattedBusinessHours: Record<string, { open: string; close: string }> = {};
      DAYS.forEach(day => {
        if (!businessHours[day].isClosed) {
          formattedBusinessHours[day] = {
            open: businessHours[day].open,
            close: businessHours[day].close,
          };
        }
      });

      const updates = {
        store_name: storeName.trim(),
        store_description: storeDescription.trim() || null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        business_hours: formattedBusinessHours,
        updated_at: new Date().toISOString(),
      };

      await updateVendorMutation.mutateAsync(updates);

      Alert.alert('Success', 'Your profile has been updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const updateDaySchedule = (day: typeof DAYS[number], field: keyof DaySchedule, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const toggleDayClosed = (day: typeof DAYS[number]) => {
    updateDaySchedule(day, 'isClosed', !businessHours[day].isClosed);
  };

  const copyToAllDays = (sourceDay: typeof DAYS[number]) => {
    Alert.alert(
      'Copy to All Days',
      `Copy ${DAY_LABELS[sourceDay]}'s hours to all other days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const sourceDaySchedule = businessHours[sourceDay];
            const updatedSchedule: Partial<WeekSchedule> = {};
            DAYS.forEach(day => {
              updatedSchedule[day] = { ...sourceDaySchedule };
            });
            setBusinessHours(updatedSchedule as WeekSchedule);
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoadingVendor) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (isError || !vendorData) {
    return (
      <FullPageError
        code='500'
        message={error?.message || "Failed to load profile"}
        onActionPress={refetch}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
          <TouchableOpacity onPress={handleGoBack} className="p-2 -ml-2">
            <Feather name='chevron-left' size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">Edit Profile</Text>
            <Text className="text-sm text-gray-600 mt-1">Update your store details</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Section */}
          <View className="px-4 pt-6 pb-8">
            {/* Store Name */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Store Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Enter your store name"
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.storeName && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.storeName}</Text>
                </View>
              )}
            </View>

            {/* Store Description */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">Store Description</Text>
              <TextInput
                value={storeDescription}
                onChangeText={setStoreDescription}
                placeholder="Brief description of your store"
                multiline
                numberOfLines={3}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />
            </View>

            {/* Phone (Read-only) */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Phone Number (Read-only)
              </Text>
              <View className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 opacity-60">
                <Text className="text-gray-600 font-medium">
                  {vendorData?.users?.phone || 'Not set'}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1">
                Phone number cannot be changed
              </Text>
            </View>

            {/* Email (Read-only) */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Email (Read-only)
              </Text>
              <View className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 opacity-60">
                <Text className="text-gray-600 font-medium">
                  {vendorData.users?.email || 'Not set'}
                </Text>
              </View>
            </View>

            {/* Address */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Street Address <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your street address"
                multiline
                numberOfLines={2}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
                textAlignVertical="top"
              />
              {errors.address && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.address}</Text>
                </View>
              )}
            </View>

            {/* City & State Row */}
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold text-sm mb-2">
                  City <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                  placeholderTextColor="#9ca3af"
                />
                {errors.city && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name='alert-circle' size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.city}</Text>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-semibold text-sm mb-2">
                  State <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                  placeholderTextColor="#9ca3af"
                />
                {errors.state && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <Feather name='alert-circle' size={16} color="#dc2626" />
                    <Text className="text-red-600 text-xs font-medium">{errors.state}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Pincode */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold text-sm mb-2">
                Pincode <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={pincode}
                onChangeText={setPincode}
                placeholder="6-digit pincode"
                keyboardType="number-pad"
                maxLength={6}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 font-medium"
                placeholderTextColor="#9ca3af"
              />
              {errors.pincode && (
                <View className="flex-row items-center gap-2 mt-2">
                  <Feather name='alert-circle' size={16} color="#dc2626" />
                  <Text className="text-red-600 text-xs font-medium">{errors.pincode}</Text>
                </View>
              )}
            </View>

            {/* Business Hours Section */}
            <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
              <TouchableOpacity
                onPress={() => setShowBusinessHours(!showBusinessHours)}
                className="flex-row items-center justify-between p-4 bg-gray-50"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="time-outline" size={24} color="#059669" />
                  <View>
                    <Text className="text-gray-900 font-bold text-base">Business Hours</Text>
                    <Text className="text-gray-600 text-xs">Set your operating schedule</Text>
                  </View>
                </View>
                <Feather
                  name={showBusinessHours ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>

              {showBusinessHours && (
                <View className="p-4">
                  {DAYS.map((day, index) => (
                    <View key={day}>
                      <View className="mb-4">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-3 flex-1">
                            <Text className="text-gray-900 font-semibold text-sm w-24">
                              {DAY_LABELS[day]}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              <Text className="text-gray-600 text-xs">Closed</Text>
                              <Switch
                                value={!businessHours[day].isClosed}
                                onValueChange={() => toggleDayClosed(day)}
                                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                                thumbColor="#fff"
                              />
                            </View>
                          </View>

                          {!businessHours[day].isClosed && (
                            <TouchableOpacity
                              onPress={() => copyToAllDays(day)}
                              className="ml-2"
                            >
                              <Ionicons name="copy-outline" size={18} color="#059669" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {!businessHours[day].isClosed && (
                          <View className="flex-row items-center gap-2 ml-24">
                            <TextInput
                              value={businessHours[day].open}
                              onChangeText={(value) => updateDaySchedule(day, 'open', value)}
                              placeholder="09:00"
                              keyboardType="numbers-and-punctuation"
                              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                              placeholderTextColor="#9ca3af"
                            />
                            <Text className="text-gray-500">to</Text>
                            <TextInput
                              value={businessHours[day].close}
                              onChangeText={(value) => updateDaySchedule(day, 'close', value)}
                              placeholder="21:00"
                              keyboardType="numbers-and-punctuation"
                              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                              placeholderTextColor="#9ca3af"
                            />
                          </View>
                        )}

                        {errors[`${day}_hours`] && (
                          <View className="flex-row items-center gap-2 mt-2 ml-24">
                            <Feather name='alert-circle' size={14} color="#dc2626" />
                            <Text className="text-red-600 text-xs">{errors[`${day}_hours`]}</Text>
                          </View>
                        )}
                      </View>

                      {index < DAYS.length - 1 && (
                        <View className="h-px bg-gray-200 mb-4" />
                      )}
                    </View>
                  ))}

                  <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <Text className="text-blue-900 text-xs">
                      💡 Tip: Use 24-hour format (e.g., 09:00, 21:00). Click the copy icon to apply hours to all days.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Info Banner */}
            <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-start gap-3">
                <Ionicons name="information-circle" size={20} color="#f59e0b" />
                <Text className="text-amber-900 text-sm flex-1">
                  Changes will be reflected immediately. Ensure all information is accurate.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Save Button */}
        <View className="bg-white px-4 py-4 border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={updateVendorMutation.isPending}
            className={`bg-emerald-500 rounded-xl py-4 items-center justify-center ${updateVendorMutation.isPending ? 'opacity-50' : ''
              }`}
          >
            {updateVendorMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Feather name="check" size={20} color="#fff" />
                <Text className="text-white font-bold text-base">Save Changes</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}