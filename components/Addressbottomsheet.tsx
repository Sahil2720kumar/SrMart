import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from "@gorhom/bottom-sheet"
import { useEffect, useMemo, useRef, useState } from "react"
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native"
import { Feather } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { CustomerAddress, CustomerAddressInsert } from "@/types/users.types"
import Toast from "react-native-toast-message"


const INITIAL_FORM_DATA: CustomerAddressInsert = {
  label: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  latitude: null,
  longitude: null,
  is_default: false,
}

const AddressBottomSheet = ({
  isVisible,
  editingAddress,
  isLoading,
  onSave,
  onClose,
}: {
  isVisible: boolean
  editingAddress: CustomerAddress | null
  isLoading: boolean
  onSave: (data: CustomerAddressInsert) => Promise<void>
  onClose: () => void
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["90%"], [])

  const [formData, setFormData] = useState<CustomerAddressInsert>(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerAddressInsert, string>>>({})
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Load editing address data
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        label: editingAddress.label || "",
        address_line1: editingAddress.address_line1,
        address_line2: editingAddress.address_line2 || "",
        city: editingAddress.city,
        state: editingAddress.state,
        pincode: editingAddress.pincode,
        latitude: editingAddress.latitude,
        longitude: editingAddress.longitude,
        is_default: editingAddress.is_default || false,
      })
    } else {
      setFormData(INITIAL_FORM_DATA)
    }
    setErrors({})
  }, [editingAddress])

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isVisible])

  // Get current location
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        Toast.show({
          type: "error",
          text1: "Permission Required",
          text2: "Please grant location permission to use this feature.",
          position: "top",
        })
        setIsGettingLocation(false)
        return
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setFormData({
        ...formData,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      // Clear location error if it was set
      if (errors.latitude) {
        setErrors({ ...errors, latitude: undefined })
      }

      Toast.show({
        type: "success",
        text1: "Location captured successfully!",
        position: "top",
      })
    } catch (error) {
      console.error('Location error:', error)
      Toast.show({
        type: "error",
        text1: "Failed to get location. Please try again.",
        position: "top",
      })
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Clear location
  const handleClearLocation = () => {
    setFormData({
      ...formData,
      latitude: null,
      longitude: null,
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerAddressInsert, string>> = {}

    if (!formData.address_line1.trim()) {
      newErrors.address_line1 = "Address is required"
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required"
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required"
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required"
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits"
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.latitude = "Location coordinates are required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      await onSave(formData)
      setFormData(INITIAL_FORM_DATA)
      setErrors({})
    } catch (error) {
      console.error("Save error:", error)
    }
  }

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA)
    setErrors({})
    onClose()
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      backgroundStyle={{
        backgroundColor: "#fff",
      }}
      index={-1}
      onClose={handleClose}
      style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {editingAddress ? "Edit Address" : "Add New Address"}
            </Text>
            <Text className="text-sm text-gray-500">
              {editingAddress ? "Update your delivery address" : "Add a new delivery location"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Feather name="x" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Label (Optional) */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-2">
              <Feather name="tag" size={12} color="#7c3aed" />
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              Label <Text className="text-gray-400 font-normal">(Optional)</Text>
            </Text>
          </View>
          <BottomSheetTextInput
            className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-200 text-gray-900 text-base"
            placeholder="e.g., Home, Office, etc."
            placeholderTextColor="#9ca3af"
            value={formData.label || ""}
            onChangeText={(text) => setFormData({ ...formData, label: text })}
            autoCapitalize="words"
          />
        </View>

        {/* Address Line 1 */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-2">
              <Feather name="map-pin" size={12} color="#2563eb" />
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              Address Line 1 <Text className="text-red-500">*</Text>
            </Text>
          </View>
          <BottomSheetTextInput
            className={`bg-gray-50 rounded-xl px-4 py-3.5 border text-gray-900 text-base ${
              errors.address_line1 ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="House/Flat No., Building Name"
            placeholderTextColor="#9ca3af"
            value={formData.address_line1}
            onChangeText={(text) => {
              setFormData({ ...formData, address_line1: text })
              if (errors.address_line1) {
                setErrors({ ...errors, address_line1: undefined })
              }
            }}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          {errors.address_line1 && (
            <View className="flex-row items-center mt-1 ml-1">
              <Feather name="alert-circle" size={12} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.address_line1}</Text>
            </View>
          )}
        </View>

        {/* Address Line 2 */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-2">
              <Feather name="navigation" size={12} color="#4f46e5" />
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              Address Line 2 <Text className="text-gray-400 font-normal">(Optional)</Text>
            </Text>
          </View>
          <BottomSheetTextInput
            className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-200 text-gray-900 text-base"
            placeholder="Street, Area, Landmark"
            placeholderTextColor="#9ca3af"
            value={formData.address_line2 || ""}
            onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
          />
        </View>

        {/* City and State Row */}
        <View className="flex-row gap-x-3 mb-4">
          {/* City */}
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-2">
                <Feather name="home" size={12} color="#10b981" />
              </View>
              <Text className="text-sm font-semibold text-gray-900">
                City <Text className="text-red-500">*</Text>
              </Text>
            </View>
            <BottomSheetTextInput
              className={`bg-gray-50 rounded-xl px-4 py-3.5 border text-gray-900 text-base ${
                errors.city ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="City"
              placeholderTextColor="#9ca3af"
              value={formData.city}
              onChangeText={(text) => {
                setFormData({ ...formData, city: text })
                if (errors.city) {
                  setErrors({ ...errors, city: undefined })
                }
              }}
              autoCapitalize="words"
            />
            {errors.city && (
              <View className="flex-row items-center mt-1 ml-1">
                <Feather name="alert-circle" size={12} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.city}</Text>
              </View>
            )}
          </View>

          {/* State */}
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-2">
                <Feather name="flag" size={12} color="#f59e0b" />
              </View>
              <Text className="text-sm font-semibold text-gray-900">
                State <Text className="text-red-500">*</Text>
              </Text>
            </View>
            <BottomSheetTextInput
              className={`bg-gray-50 rounded-xl px-4 py-3.5 border text-gray-900 text-base ${
                errors.state ? "border-red-400" : "border-gray-200"
              }`}
              placeholder="State"
              placeholderTextColor="#9ca3af"
              value={formData.state}
              onChangeText={(text) => {
                setFormData({ ...formData, state: text })
                if (errors.state) {
                  setErrors({ ...errors, state: undefined })
                }
              }}
              autoCapitalize="words"
            />
            {errors.state && (
              <View className="flex-row items-center mt-1 ml-1">
                <Feather name="alert-circle" size={12} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1">{errors.state}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pincode */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-rose-100 items-center justify-center mr-2">
              <Feather name="hash" size={12} color="#e11d48" />
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              Pincode <Text className="text-red-500">*</Text>
            </Text>
          </View>
          <BottomSheetTextInput
            className={`bg-gray-50 rounded-xl px-4 py-3.5 border text-gray-900 text-base ${
              errors.pincode ? "border-red-400" : "border-gray-200"
            }`}
            placeholder="6-digit pincode"
            placeholderTextColor="#9ca3af"
            value={formData.pincode}
            onChangeText={(text) => {
              setFormData({ ...formData, pincode: text })
              if (errors.pincode) {
                setErrors({ ...errors, pincode: undefined })
              }
            }}
            keyboardType="number-pad"
            maxLength={6}
          />
          {errors.pincode && (
            <View className="flex-row items-center mt-1 ml-1">
              <Feather name="alert-circle" size={12} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.pincode}</Text>
            </View>
          )}
        </View>

        {/* Location Section - Now Mandatory */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-cyan-100 items-center justify-center mr-2">
              <Feather name="crosshair" size={12} color="#06b6d4" />
            </View>
            <Text className="text-sm font-semibold text-gray-900">
              Location Coordinates <Text className="text-red-500">*</Text>
            </Text>
          </View>

          {formData.latitude && formData.longitude ? (
            // Show captured coordinates
            <View className={`bg-green-50 rounded-xl p-4 border ${errors.latitude ? "border-red-400" : "border-green-200"}`}>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Feather name="check-circle" size={16} color="#10b981" />
                  </View>
                  <Text className="text-green-900 font-semibold text-sm">
                    Location Captured
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleClearLocation}
                  className="px-3 py-1.5 bg-white rounded-lg border border-green-300"
                >
                  <Text className="text-green-700 font-medium text-xs">Clear</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-2">
                <View className="flex-row items-center bg-white rounded-lg p-2.5">
                  <Text className="text-gray-500 text-xs font-medium w-20">Latitude:</Text>
                  <Text className="text-gray-900 text-xs font-semibold flex-1">
                    {formData.latitude.toFixed(6)}
                  </Text>
                </View>
                <View className="flex-row items-center bg-white rounded-lg p-2.5">
                  <Text className="text-gray-500 text-xs font-medium w-20">Longitude:</Text>
                  <Text className="text-gray-900 text-xs font-semibold flex-1">
                    {formData.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Show capture button
            <TouchableOpacity
              onPress={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className={`rounded-xl p-4 border ${errors.latitude ? "bg-red-50 border-red-400" : "bg-cyan-50 border-cyan-200"}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${errors.latitude ? "bg-red-100" : "bg-cyan-100"}`}>
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color="#06b6d4" />
                    ) : (
                      <Feather name="map-pin" size={18} color={errors.latitude ? "#ef4444" : "#06b6d4"} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold text-sm mb-0.5 ${errors.latitude ? "text-red-900" : "text-cyan-900"}`}>
                      {isGettingLocation ? "Getting location..." : "Use Current Location"}
                    </Text>
                    <Text className={`text-xs ${errors.latitude ? "text-red-500" : "text-cyan-600"}`}>
                      {errors.latitude ? "Required for accurate delivery" : "Required for accurate delivery"}
                    </Text>
                  </View>
                </View>
                {!isGettingLocation && (
                  <Feather name="chevron-right" size={20} color={errors.latitude ? "#ef4444" : "#06b6d4"} />
                )}
              </View>
            </TouchableOpacity>
          )}

          {errors.latitude && (
            <View className="flex-row items-center mt-1 ml-1">
              <Feather name="alert-circle" size={12} color="#ef4444" />
              <Text className="text-red-500 text-xs ml-1">{errors.latitude}</Text>
            </View>
          )}
        </View>

        {/* Set as Default Toggle */}
        <TouchableOpacity
          onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
          className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200"
          activeOpacity={0.7}
        >
          <View
            className={`w-12 h-7 rounded-full mr-3 ${
              formData.is_default ? "bg-green-500" : "bg-gray-300"
            }`}
            style={{
              justifyContent: "center",
              alignItems: formData.is_default ? "flex-end" : "flex-start",
            }}
          >
            <View
              className="w-5 h-5 rounded-full bg-white mx-1"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-0.5">
              Set as default address
            </Text>
            <Text className="text-xs text-gray-500">
              This will be your primary delivery location
            </Text>
          </View>
          {formData.is_default && (
            <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
              <Feather name="check" size={16} color="#10b981" />
            </View>
          )}
        </TouchableOpacity>

        {/* Info Banner */}
        <View className="flex-row items-start bg-blue-50 rounded-xl p-3 mb-6 border border-blue-100">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3 mt-0.5">
            <Feather name="info" size={16} color="#2563eb" />
          </View>
          <View className="flex-1">
            <Text className="text-blue-900 font-semibold text-sm mb-1">Quick Tip</Text>
            <Text className="text-blue-700 text-xs leading-5">
              Location coordinates are required to ensure delivery partners can find you accurately and on time.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-y-3">
          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className={`rounded-full py-4 items-center justify-center flex-row ${
              isLoading ? "bg-gray-300" : "bg-green-500"
            }`}
            style={{
              shadowColor: isLoading ? "#000" : "#10b981",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isLoading ? 0 : 0.2,
              shadowRadius: 8,
              elevation: isLoading ? 0 : 4,
            }}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text className="font-bold text-base text-white ml-2">Saving...</Text>
              </>
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text className="font-bold text-base text-white ml-2">
                  {editingAddress ? "Update Address" : "Save Address"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleClose}
            disabled={isLoading}
            className="rounded-full py-4 items-center justify-center bg-gray-100"
          >
            <Text className="font-semibold text-base text-gray-700">Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

export default AddressBottomSheet