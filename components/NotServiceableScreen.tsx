// components/NotServiceableScreen.tsx
import { useEffect, useState } from "react"
import { TouchableOpacity, Text, View, StatusBar, Pressable, ActivityIndicator } from "react-native"
import { BlurView } from "expo-blur"
import { Feather } from "@expo/vector-icons"  // ← changed
import { LocationIcon } from "@/assets/svgs/LocationIcon"
import { ChevronDownIcon } from "@/assets/svgs/ChevronDownIcon"
import SelectAddressBottomSheet from "@/components/SelectAddressBottomSheet"
import AddressBottomSheet from "@/components/Addressbottomsheet"
import {
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useSetDefaultAddress,
} from "@/hooks/queries"
import Toast from "react-native-toast-message"
import { ServiceRegion } from "@/utils/regionCheck"
import { CustomerAddress, CustomerAddressInsert } from "@/types/users.types"

// ── Props ──────────────────────────────────────────────────────────────────
interface NotServiceableScreenProps {
  serviceRegions: ServiceRegion[]
}

// ── Component ──────────────────────────────────────────────────────────────
export default function NotServiceableScreen({ serviceRegions }: NotServiceableScreenProps) {
  const { data: addresses = [] } = useCustomerAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const { mutate: setDefaultAddress, isPending: isSettingDefault } = useSetDefaultAddress()

  const [showAddressSheet, setShowAddressSheet] = useState(false)
  const [showAddBottomSheet, setShowAddBottomSheet] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null)

  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const defaultAddress = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddress(defaultAddress)
    }
  }, [addresses])

  const handleSelectAddress = (address: CustomerAddress) => {
    setDefaultAddress(address.id, {
      onSuccess: () => {
        setSelectedAddress(address)
        setShowAddressSheet(false)
      },
      onError: () => {
        Toast.show({ type: "error", text1: "Failed to switch address", position: "top" })
      },
    })
  }

  const handleSaveAddress = async (formData: CustomerAddressInsert) => {
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
        Toast.show({ type: "success", text1: "Address updated successfully", position: "top" })
      } else {
        await createAddress.mutateAsync({
          ...formData,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        })
        Toast.show({ type: "success", text1: "Address added successfully", position: "top" })
      }
      setShowAddBottomSheet(false)
      setEditingAddress(null)
    } catch {
      Toast.show({ type: "error", text1: "Failed to save address. Please try again.", position: "top" })
      throw new Error("Failed to save address")
    }
  }

  const anySheetOpen = showAddressSheet || showAddBottomSheet

  return (
    <View className="flex-1 bg-green-500">
      <StatusBar barStyle="light-content" backgroundColor="#22c55e" />

      {/* Background decoration */}
      <View className="absolute top-0 left-0 right-0 h-72 bg-green-600 rounded-b-[80px] opacity-40" />

      {/* ── Address header ── */}
      <View className="px-4 pt-14 pb-3">
        <TouchableOpacity
          onPress={() => setShowAddressSheet(true)}
          className="flex-row items-center"
        >
          <LocationIcon />
          <View className="ml-2 flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-semibold text-base">
                {selectedAddress?.label || "Select Address"}
              </Text>
              <View className="ml-1">
                <ChevronDownIcon />
              </View>
            </View>
            <Text className="text-green-100 text-sm mt-0.5">
              {selectedAddress?.address_line1 || "Tap to choose an address"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-8">

        {/* Icon — now using Feather ↓ */}
        <View className="bg-green-600 w-32 h-32 rounded-full items-center justify-center mb-8">
          <View className="bg-green-700 w-24 h-24 rounded-full items-center justify-center">
            <Feather name="map-pin" size={64} color="white" />
          </View>
        </View>

        {/* Title */}
        <Text className="text-white text-3xl font-bold text-center mb-3">
          Outside Our Zone
        </Text>
        <Text className="text-green-100 text-base text-center leading-6 mb-2">
          We're not available in your area yet.
        </Text>

        {/* Serviceable cities */}
        <Text className="text-green-100 text-base text-center leading-6 mb-10">
          We currently serve{" "}
          {serviceRegions.map((r, i) => (
            <Text key={r.name}>
              <Text className="text-white font-bold">{r.name}</Text>
              {i < serviceRegions.length - 1 ? " & " : ""}
            </Text>
          ))}
          <View className="flex-row items-center justify-center gap-1 mt-1">
            <Text className="text-green-100 text-base">We're expanding soon!</Text>
            <Feather name="zap" size={16} color="#bbf7d0" />
          </View>
        </Text>

        {/* Divider */}
        <View className="flex-row items-center w-full mb-8">
          <View className="flex-1 h-px bg-green-400" />
          <Text className="text-green-200 mx-4 text-sm">What can you do?</Text>
          <View className="flex-1 h-px bg-green-400" />
        </View>

        {/* Switch address */}
        {addresses.length > 0 && (
          <Pressable
            onPress={() => setShowAddressSheet(true)}
            disabled={isSettingDefault}
            className="bg-white w-full py-4 rounded-2xl items-center mb-4 active:opacity-80"
            style={{ opacity: isSettingDefault ? 0.7 : 1 }}
          >
            {isSettingDefault ? (
              <ActivityIndicator color="#16a34a" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Feather name="refresh-cw" size={18} color="#16a34a" />
                <Text className="text-green-600 font-bold text-base">Switch Address</Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Add new address */}
        <Pressable
          onPress={() => {
            setEditingAddress(null)
            setShowAddBottomSheet(true)
          }}
          className="border-2 border-white w-full py-4 rounded-2xl items-center active:opacity-80"
        >
          <View className="flex-row items-center gap-2">
            <Feather name="map-pin" size={18} color="white" />
            <Text className="text-white font-semibold text-base">Add New Address</Text>
          </View>
        </Pressable>

      </View>

      {/* Bottom note */}
      <View className="pb-10 px-8 items-center">
        <Text className="text-green-200 text-xs text-center">
          Want us in your city? Reach out at{" "}
          <Text className="text-white font-semibold">support@yourapp.com</Text>
        </Text>
      </View>

      {/* Blur overlay */}
      {anySheetOpen && (
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}

      {/* Select address sheet */}
      <SelectAddressBottomSheet
        isVisible={showAddressSheet}
        addresses={addresses}
        selectedAddress={selectedAddress!}
        onSelectAddress={handleSelectAddress}
        onClose={() => setShowAddressSheet(false)}
        onAddNewAddress={() => {
          setShowAddressSheet(false)
          setEditingAddress(null)
          setShowAddBottomSheet(true)
        }}
      />

      {/* Add / Edit address sheet */}
      <AddressBottomSheet
        isVisible={showAddBottomSheet}
        editingAddress={editingAddress}
        isLoading={createAddress.isPending || updateAddress.isPending}
        onSave={handleSaveAddress}
        onClose={() => {
          setShowAddBottomSheet(false)
          setEditingAddress(null)
        }}
      />
    </View>
  )
}