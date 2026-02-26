import { CustomerAddress } from "@/types/users.types"
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { useMemo, useRef } from "react"
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native"
import { useSetDefaultAddress } from "@/hooks/queries"

const SelectAddressBottomSheet = ({
  isVisible,
  addresses,
  selectedAddress,
  onSelectAddress,
  onClose,
  onAddNewAddress,
}: {
  isVisible: boolean
  addresses: CustomerAddress[]
  selectedAddress: CustomerAddress
  onSelectAddress: (address: CustomerAddress) => void
  onClose: () => void
  onAddNewAddress: () => void
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => [400], [])
  const { mutate: setDefaultAddress, isPending } = useSetDefaultAddress()

  useMemo(() => {
    if (isVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isVisible])

  const handleSelectAddress = (address: CustomerAddress) => {
    // Set as default in DB
    setDefaultAddress(address.id, {
      onSuccess: () => {
        onSelectAddress(address) // notify parent after DB update
      },
    })
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose={true}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      backgroundStyle={{ backgroundColor: "#fff" }}
    >
      <BottomSheetView
        className="rounded-t-2xl"
        style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Header */}
        <Text className="text-lg font-bold text-gray-900 mb-2">Select Delivery Address</Text>
        <Text className="text-sm text-gray-500 mb-6">Choose where you want your order delivered</Text>

        {/* Address List */}
        <View className="mb-6">
          {addresses?.map((address) => {
            if (!address) return null
            const isSelected = selectedAddress?.id === address.id
            const isSetting = isPending && isSelected

            return (
              <TouchableOpacity
                key={address.id}
                onPress={() => handleSelectAddress(address)}
                disabled={isPending}
                className="flex-row items-start bg-white border border-gray-200 rounded-2xl p-4 mb-3"
                style={{ opacity: isPending && !isSelected ? 0.5 : 1 }}
              >
                {/* Icon */}
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3 mt-1">
                  <Text style={{ fontSize: 18 }}>
                    {address.label === "Home" ? "🏠" : address.label === "Office" ? "🏢" : "🏘️"}
                  </Text>
                </View>

                {/* Address Info */}
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-sm font-semibold text-gray-900">{address.label}</Text>
                    {address.is_default && (
                      <View className="bg-green-100 rounded-full px-2 py-0.5 ml-2">
                        <Text className="text-green-600 text-xs font-medium">Default</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 leading-tight">{address.address_line1}</Text>
                </View>

                {/* Radio Button / Spinner */}
                {isSetting ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? "#16a34a" : "#d1d5db",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected ? "#dcfce7" : "#ffffff",
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#16a34a",
                        }}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Add New Address Button */}
        <TouchableOpacity
          onPress={onAddNewAddress}
          disabled={isPending}
          className="flex-row items-center justify-center border-2 border-dashed border-green-300 rounded-2xl p-4 mb-4"
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>+</Text>
          <Text className="text-green-600 font-semibold">Add New Address</Text>
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={onClose}
          disabled={isPending}
          className="bg-green-500 rounded-full py-4 items-center justify-center"
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Confirm Address</Text>
          )}
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default SelectAddressBottomSheet