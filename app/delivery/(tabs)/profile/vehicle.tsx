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
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type VehicleStatus = 'not_added' | 'pending' | 'approved' | 'rejected';
type VehicleType = 'bike' | 'scooter' | 'car' | 'bicycle';
type FuelType = 'petrol' | 'electric' | 'cng';

interface VehicleData {
  type: VehicleType;
  number: string;
  brand: string;
  color: string;
  fuelType: FuelType;
  rcNumber: string;
  rcImage: string | null;
  status: VehicleStatus;
  rejectionReason?: string;
}

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  // Example: Existing vehicle (change to null for "no vehicle" state)
  const [vehicle, setVehicle] = useState<VehicleData | null>({
    type: 'bike',
    number: 'MH12AB1234',
    brand: 'Honda Activa',
    color: 'Black',
    fuelType: 'petrol',
    rcNumber: 'RC1234567890',
    rcImage: 'https://via.placeholder.com/400x300',
    status: 'rejected',
    rejectionReason: 'RC number does not match vehicle number. Please verify and update.',
  });

  const [formData, setFormData] = useState<Omit<VehicleData, 'status' | 'rejectionReason'>>(
    vehicle || {
      type: 'bike',
      number: '',
      brand: '',
      color: '',
      fuelType: 'petrol',
      rcNumber: '',
      rcImage: null,
    }
  );

  const vehicleTypes = [
    { value: 'bike', label: 'Bike', icon: <MaterialCommunityIcons name="motorbike"size={20} color="#4f46e5" /> },
    { value: 'scooter', label: 'Scooter', icon: <MaterialCommunityIcons name="motorbike" size={20} color="#4f46e5" /> },
    { value: 'car', label: 'Car', icon: <AntDesign name="car" size={20} color="#4f46e5" /> },
    { value: 'bicycle', label: 'Bicycle', icon: <MaterialCommunityIcons name="bicycle" size={20} color="#4f46e5" /> },
  ];

  const fuelTypes = [
    { value: 'petrol', label: 'Petrol' },
    { value: 'electric', label: 'Electric' },
    { value: 'cng', label: 'CNG' },
  ];

  const getStatusBadge = (status: VehicleStatus) => {
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

  const getStatusMessage = (status: VehicleStatus) => {
    const messages = {
      not_added: 'Add your vehicle details to start deliveries.',
      pending: 'Vehicle details are under admin review.',
      approved: "Vehicle verified. You're eligible for delivery.",
      rejected: 'Please update vehicle details.',
    };
    return messages[status];
  };

  const getVehicleIcon = (type: VehicleType) => {
    const icons = {
      bike:<MaterialCommunityIcons name="motorbike" size={32} color="#4f46e5" />,
      scooter:<MaterialCommunityIcons name="motorbike" size={32} color="#4f46e5" />,
      car:<AntDesign name="car"size={32} color="#4f46e5" />,
      bicycle: <MaterialCommunityIcons name="bicycle" size={32} color="#4f46e5" />,
    };
    return icons[type];
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

      if (!result.canceled) {
        setFormData({ ...formData, rcImage: result.assets[0].uri });
        setUploadModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.number || !formData.brand || !formData.color || !formData.rcNumber) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    if (!formData.rcImage) {
      Alert.alert('Validation Error', 'Please upload RC image');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setVehicle({
        ...formData,
        status: 'pending',
      });
      setLoading(false);
      Alert.alert('Success', vehicle ? 'Vehicle details updated successfully' : 'Vehicle added successfully');
    }, 1500);
  };

  const handleDelete = () => {
    if (vehicle?.status === 'approved') {
      Alert.alert(
        'Cannot Delete',
        'Approved vehicles cannot be deleted. You can edit to update details.'
      );
      return;
    }

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVehicle(null);
            setFormData({
              type: 'bike',
              number: '',
              brand: '',
              color: '',
              fuelType: 'petrol',
              rcNumber: '',
              rcImage: null,
            });
            setDeleteModal(false);
          },
        },
      ]
    );
  };

  const currentStatus = vehicle?.status || 'not_added';
  const isFormValid =
    formData.number &&
    formData.brand &&
    formData.color &&
    formData.rcNumber &&
    formData.rcImage;

  return (
    <SafeAreaView className="flex-1 bg-[#4f46e5]">
      {/* Header */}
      <View className="bg-[#4f46e5] px-4 pt-4 pb-6">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name='arrow-left' size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Vehicle Details</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 bg-gray-50 rounded-t-3xl px-4 py-6">
        {/* Vehicle Status Banner */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <View className="flex-row items-start gap-3">
            <View className={`p-3 rounded-xl ${getStatusBadge(currentStatus).bg}`}>
              {getStatusBadge(currentStatus).icon}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 text-base mb-1">
                Vehicle Verification Status
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
                  className={`text-xs font-medium ${getStatusBadge(currentStatus).text}`}
                >
                  {getStatusBadge(currentStatus).label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rejection Reason */}
        {vehicle?.status === 'rejected' && vehicle.rejectionReason && (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Feather name='alert-circle' size={20} color="#dc2626" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-900 mb-1">
                  Admin Feedback
                </Text>
                <Text className="text-sm text-red-800">{vehicle.rejectionReason}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Vehicle Form */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-bold text-gray-900 text-lg mb-4">
            {vehicle ? 'Update Vehicle Information' : 'Add Vehicle Information'}
          </Text>

          {/* Vehicle Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Vehicle Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <View className="flex-row items-center gap-2">
                {getVehicleIcon(formData.type)}
                <Text className="text-gray-900">
                  {vehicleTypes.find((v) => v.value === formData.type)?.label}
                </Text>
              </View>
              <Feather name='chevron-down' size={20} color="#6b7280" />
            </TouchableOpacity>

            {showTypeDropdown && (
              <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                {vehicleTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    className="px-4 py-3 border-b border-gray-100 flex-row items-center gap-2 active:bg-gray-50"
                    onPress={() => {
                      setFormData({ ...formData, type: type.value as VehicleType });
                      setShowTypeDropdown(false);
                    }}
                  >
                    {type.icon}
                    <Text className="text-gray-900">{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Vehicle Number */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Vehicle Number <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., MH12AB1234"
              value={formData.number}
              onChangeText={(text) =>
                setFormData({ ...formData, number: text.toUpperCase() })
              }
              autoCapitalize="characters"
              maxLength={15}
            />
          </View>

          {/* Brand / Model */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Brand / Model <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., Honda Activa"
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
            />
          </View>

          {/* Color */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Color <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., Black"
              value={formData.color}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
            />
          </View>

          {/* Fuel Type */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Fuel Type <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
              onPress={() => setShowFuelDropdown(!showFuelDropdown)}
            >
              <Text className="text-gray-900">
                {fuelTypes.find((f) => f.value === formData.fuelType)?.label}
              </Text>
              <Feather name='chevron-down' size={20} color="#6b7280" />
            </TouchableOpacity>

            {showFuelDropdown && (
              <View className="border border-gray-200 rounded-xl mt-2 overflow-hidden">
                {fuelTypes.map((fuel) => (
                  <TouchableOpacity
                    key={fuel.value}
                    className="px-4 py-3 border-b border-gray-100 active:bg-gray-50"
                    onPress={() => {
                      setFormData({ ...formData, fuelType: fuel.value as FuelType });
                      setShowFuelDropdown(false);
                    }}
                  >
                    <Text className="text-gray-900">{fuel.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* RC Number */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              RC Number <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="e.g., RC1234567890"
              value={formData.rcNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, rcNumber: text.toUpperCase() })
              }
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* RC Image Upload */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-900 text-base mb-2">
            RC Document <Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-sm text-gray-600 mb-3">
            Upload a clear image of your RC.
          </Text>

          {formData.rcImage ? (
            <View>
              <Image
                source={{ uri: formData.rcImage }}
                className="w-full h-48 rounded-xl mb-3"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="bg-indigo-50 py-3 rounded-xl flex-row items-center justify-center gap-2"
                onPress={() => setUploadModal(true)}
              >
                <Feather name='upload' size={18} color="#4f46e5" />
                <Text className="text-[#4f46e5] font-semibold">Replace Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl py-8 flex items-center justify-center gap-2"
              onPress={() => setUploadModal(true)}
            >
              <Feather name='upload' size={32} color="#6b7280" />
              <Text className="text-gray-600 font-medium">Upload RC Image</Text>
              <Text className="text-sm text-gray-500">Max size: 5MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="mb-6">
          <TouchableOpacity
            className={`py-4 rounded-xl flex-row items-center justify-center gap-2 ${
              isFormValid && !loading
                ? 'bg-[#4f46e5]'
                : 'bg-gray-300'
            }`}
            onPress={handleSave}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {vehicle ? 'Save Changes' : 'Add Vehicle'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {vehicle && (
            <TouchableOpacity
              className="mt-3 py-4 rounded-xl border-2 border-red-500 flex-row items-center justify-center gap-2"
              onPress={handleDelete}
            >
              <Feather name='trash-2' size={20} color="#dc2626" />
              <Text className="text-red-600 font-semibold text-base">
                Remove Vehicle
              </Text>
            </TouchableOpacity>
          )}
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
              <Text className="text-xl font-bold text-gray-900">Upload RC Image</Text>
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
              <Text className="text-white font-semibold text-base">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-indigo-100 py-4 rounded-xl flex-row items-center justify-center gap-3 mb-3"
              onPress={() => handleImagePicker('gallery')}
            >
              <Feather  name='image' size={24} color="#4f46e5" />
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