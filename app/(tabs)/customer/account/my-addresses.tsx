import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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
import Toast from "react-native-toast-message"

// ---------------------------------------------------------------------------
// Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmStyle?: "danger" | "primary"
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  confirmStyle = "primary",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg = confirmStyle === "danger" ? "bg-red-500" : "bg-emerald-500"
  const accentBg = confirmStyle === "danger" ? "bg-red-500" : "bg-emerald-500"

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View className={`h-1 w-full ${accentBg}`} />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? "opacity-60" : ""}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function MyAddressesScreen() {
  const { data: addresses, isLoading } = useCustomerAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deletingAddress, setDeletingAddress] = useState<CustomerAddress | null>(null)

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddNew = () => {
    setEditingAddress(null)
    setBottomSheetVisible(true)
  }

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address)
    setBottomSheetVisible(true)
  }

  const handleSave = async (formData: CustomerAddressInsert) => {
    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          updates: {
            ...formData,
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
          },
        })
        Toast.show({
          type: "success",
          text1: "Address updated successfully",
          position: "top",
        })
      } else {
        await createAddress.mutateAsync({
          ...formData,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        })
        Toast.show({
          type: "success",
          text1: "Address added successfully",
          position: "top",
        })
      }
      setBottomSheetVisible(false)
      setEditingAddress(null)
    } catch (error) {
      console.error("Address operation error:", error)
      Toast.show({
        type: "error",
        text1: "Failed to save address. Please try again.",
        position: "top",
      })
      throw error
    }
  }

  const handleDelete = (address: CustomerAddress) => {
    setDeletingAddress(address)
    setDeleteModalVisible(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingAddress) return
    try {
      await deleteAddress.mutateAsync(deletingAddress.id)
      setDeleteModalVisible(false)
      setDeletingAddress(null)
      Toast.show({
        type: "success",
        text1: "Address deleted successfully",
        position: "top",
      })
    } catch (error) {
      console.error("Delete error:", error)
      setDeleteModalVisible(false)
      setDeletingAddress(null)
      Toast.show({
        type: "error",
        text1: "Failed to delete address",
        position: "top",
      })
    }
  }

  const handleSetDefault = async (address: CustomerAddress) => {
    if (address.is_default) return
    try {
      await setDefaultAddress.mutateAsync(address.id)
      Toast.show({
        type: "success",
        text1: "Default address updated",
        position: "top",
      })
    } catch (error) {
      console.error("Set default error:", error)
      Toast.show({
        type: "error",
        text1: "Failed to set default address",
        position: "top",
      })
    }
  }

  const handleCloseBottomSheet = () => {
    setBottomSheetVisible(false)
    setEditingAddress(null)
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Stats */}
            {addresses && addresses.length > 0 && (
              <View className="flex-row items-center bg-green-50 rounded-xl p-3 mb-4 border border-green-100">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Feather name="map-pin" size={18} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-900 font-semibold text-sm">
                    {addresses.length} {addresses.length === 1 ? "Address" : "Addresses"} Saved
                  </Text>
                  <Text className="text-green-600 text-xs">
                    {addresses.filter((a) => a.is_default).length > 0
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
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                          address.is_default ? "bg-green-100" : "bg-gray-100"
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
                          <View className="bg-green-100 px-2.5 py-1 rounded-full self-start">
                            <Text className="text-xs font-bold text-green-700">✓ Default</Text>
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
                        className="flex-1 flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-green-50 border border-green-200"
                        activeOpacity={0.7}
                      >
                        <Feather name="check-circle" size={16} color="#10b981" />
                        <Text className="text-sm font-semibold text-green-700 ml-2">
                          Set Default
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => handleEdit(address)}
                      className={`flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-200 ${
                        !address.is_default ? "flex-1" : "flex-[1.5]"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={16} color="#2563eb" />
                      <Text className="text-sm font-semibold text-blue-700 ml-2">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(address)}
                      disabled={deleteAddress.isPending}
                      className={`flex-row items-center justify-center py-2.5 px-3 rounded-xl bg-red-50 border border-red-200 ${
                        !address.is_default ? "flex-1" : "flex-[1.5]"
                      }`}
                      activeOpacity={0.7}
                    >
                      {deleteAddress.isPending && deletingAddress?.id === address.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <>
                          <Feather name="trash-2" size={16} color="#ef4444" />
                          <Text className="text-sm font-semibold text-red-700 ml-2">Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View className="flex-1 items-center justify-center py-20">
                <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Feather name="map-pin" size={40} color="#9ca3af" />
                </View>
                <Text className="text-gray-900 text-lg font-bold mb-2">No addresses yet</Text>
                <Text className="text-gray-500 text-sm text-center px-8 mb-6">
                  Add your first address to get started with faster checkouts
                </Text>
                <TouchableOpacity
                  onPress={handleAddNew}
                  className="flex-row items-center bg-green-500 rounded-full px-6 py-3"
                  style={{
                    shadowColor: "#10b981",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Feather name="plus" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Add Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {/* Floating Add Button */}
        {addresses && addresses.length > 0 && (
          <View className="absolute bottom-6 right-6">
            <TouchableOpacity
              onPress={handleAddNew}
              className="w-16 h-16 rounded-full bg-green-500 items-center justify-center"
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

      {/* Blur backdrop */}
      {bottomSheetVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
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

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Address"
        message={
          deletingAddress?.label
            ? `Are you sure you want to delete "${deletingAddress.label}"? This action cannot be undone.`
            : "Are you sure you want to delete this address? This action cannot be undone."
        }
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteAddress.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false)
          setDeletingAddress(null)
        }}
      />
    </SafeAreaView>
  )
}