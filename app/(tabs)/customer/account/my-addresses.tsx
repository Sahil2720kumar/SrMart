import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Stack } from "expo-router"
import Feather from "@expo/vector-icons/Feather"
import {
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/queries"
import AddressBottomSheet from "@/components/Addressbottomsheet"
import { CustomerAddress, CustomerAddressInsert } from "@/types/users.types"
import { BlurView } from "expo-blur"



export default function MyAddressesScreen() {
  const { data: addresses, isLoading } = useCustomerAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

  // Open bottom sheet for adding new address
  const handleAddNew = () => {
    setEditingAddress(null)
    setBottomSheetVisible(true)
  }

  // Open bottom sheet for editing existing address
  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address)
    setBottomSheetVisible(true)
  }

  // Handle save from bottom sheet
  const handleSave = async (formData: CustomerAddressInsert) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          updates: {
            ...formData,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
          },
        })
        Alert.alert("Success", "Address updated successfully")
      } else {
        // Create new address
        await createAddress.mutateAsync({
          ...formData,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        })
        Alert.alert("Success", "Address added successfully")
      }
      setBottomSheetVisible(false)
      setEditingAddress(null)
    } catch (error) {
      console.error("Address operation error:", error)
      Alert.alert("Error", "Failed to save address. Please try again.")
      throw error
    }
  }

  // Handle delete with confirmation
  const handleDelete = (address: CustomerAddress) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(address.id)
              Alert.alert("Success", "Address deleted successfully")
            } catch (error) {
              console.error("Delete error:", error)
              Alert.alert("Error", "Failed to delete address")
            }
          },
        },
      ]
    )
  }

  // Handle set as default
  const handleSetDefault = async (address: CustomerAddress) => {
    if (address.is_default) return // Already default

    try {
      await setDefaultAddress.mutateAsync(address.id)
      Alert.alert("Success", "Default address updated")
    } catch (error) {
      console.error("Set default error:", error)
      Alert.alert("Error", "Failed to set default address")
    }
  }

  const handleCloseBottomSheet = () => {
    setBottomSheetVisible(false)
    setEditingAddress(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Addresses",
          headerTitleAlign:"center"
        }}
      />

      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Stats */}
            {addresses && addresses.length > 0 && (
              <View className="flex-row items-center bg-emerald-50 rounded-xl p-3 mb-4 border border-emerald-100">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                  <Feather name="map-pin" size={18} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-emerald-900 font-semibold text-sm">
                    {addresses.length} {addresses.length === 1 ? "Address" : "Addresses"} Saved
                  </Text>
                  <Text className="text-emerald-600 text-xs">
                    {addresses.filter(a => a.is_default).length > 0
                      ? "Default address is set"
                      : "No default address yet"}
                  </Text>
                </View>
              </View>
            )}

            {/* Addresses List */}
            {addresses && addresses.length > 0 ? (
              addresses.map((address) => (
                <View
                  key={address.id}
                  className="bg-white rounded-2xl p-4 mb-4"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderWidth: address.is_default ? 2 : 0,
                    borderColor: address.is_default ? "#10b981" : "transparent",
                  }}
                >
                  {/* Header with label and default badge */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${address.is_default ? "bg-emerald-100" : "bg-gray-100"
                          }`}
                      >
                        <Feather
                          name="map-pin"
                          size={20}
                          color={address.is_default ? "#10b981" : "#6b7280"}
                        />
                      </View>
                      <View className="flex-1">
                        {address.label && (
                          <Text className="text-base font-bold text-gray-900 mb-0.5">
                            {address.label}
                          </Text>
                        )}
                        {address.is_default && (
                          <View className="bg-emerald-100 px-2.5 py-1 rounded-full self-start">
                            <Text className="text-xs font-bold text-emerald-700">
                              ✓ Default
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Address details */}
                  <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <Text className="text-sm text-gray-800 leading-5 mb-1">
                      {address.address_line1}
                    </Text>
                    {address.address_line2 && (
                      <Text className="text-sm text-gray-800 leading-5 mb-1">
                        {address.address_line2}
                      </Text>
                    )}
                    <Text className="text-sm font-medium text-gray-900">
                      {address.city}, {address.state} - {address.pincode}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row items-center gap-x-2">
                    {!address.is_default && (
                      <TouchableOpacity
                        onPress={() => handleSetDefault(address)}
                        disabled={setDefaultAddress.isPending}
                        className="flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200"
                        activeOpacity={0.7}
                      >
                        <Feather name="check-circle" size={16} color="#10b981" />
                        <Text className="text-sm font-semibold text-emerald-700 ml-2">
                          Set Default
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => handleEdit(address)}
                      className={`flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-200 ${!address.is_default ? "flex-1" : "flex-[1.5]"
                        }`}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={16} color="#2563eb" />
                      <Text className="text-sm font-semibold text-blue-700 ml-2">
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(address)}
                      disabled={deleteAddress.isPending}
                      className={`flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-red-50 border border-red-200 ${!address.is_default ? "flex-1" : "flex-[1.5]"
                        }`}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={16} color="#ef4444" />
                      <Text className="text-sm font-semibold text-red-700 ml-2">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Feather name="map-pin" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-900 text-lg font-bold mb-2">
                  No addresses yet
                </Text>
                <Text className="text-gray-500 text-sm text-center px-8 mb-6">
                  Add your first address to get started with faster checkouts
                </Text>
                <TouchableOpacity
                  onPress={handleAddNew}
                  className="flex-row items-center bg-emerald-500 rounded-full px-6 py-3"
                  style={{
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Feather name="plus" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Add Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating Add Button - Only show if addresses exist */}
        {addresses && addresses.length > 0 && (
          <View className="absolute bottom-6 right-6">
            <TouchableOpacity
              onPress={handleAddNew}
              className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center"
              activeOpacity={0.8}
              style={{
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Feather name="plus" size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {bottomSheetVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Address Bottom Sheet */}
      <AddressBottomSheet
        isVisible={bottomSheetVisible}
        editingAddress={editingAddress}
        isLoading={createAddress.isPending || updateAddress.isPending}
        onSave={handleSave}
        onClose={handleCloseBottomSheet}
      />
    </SafeAreaView>
  )
}