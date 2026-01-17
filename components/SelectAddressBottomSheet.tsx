import { Address } from "@/types/address.types"
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { useMemo, useRef } from "react"
import { Text, TouchableOpacity, View } from "react-native"




const SelectAddressBottomSheet = ({
  isVisible,
  addresses,
  selectedAddress,
  onSelectAddress,
  onClose,
  onAddNewAddress,
}: {
  isVisible: boolean
  addresses: Address[]
  selectedAddress: Address
  onSelectAddress: (address: Address) => void
  onClose: () => void
  onAddNewAddress: () => void
}) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => [400], [])

  useMemo(() => {
    if (isVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isVisible])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose={true}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      backgroundStyle={{
        backgroundColor: "#fff", 
        // borderTopLeftRadius: "1rem",
        // borderTopRightRadius: "1rem"
      }}

    >
      <BottomSheetView className="rounded-t-2xl" style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}>
        {/* Header */}
        <Text className="text-lg font-bold text-gray-900 mb-2">Select Delivery Address</Text>
        <Text className="text-sm text-gray-500 mb-6">Choose where you want your order delivered</Text>

        {/* Address List */}
        <View className="mb-6">
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              onPress={() => onSelectAddress(address)}
              className="flex-row items-start bg-white border border-gray-200 rounded-2xl p-4 mb-3"
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
                  {address.isDefault && (
                    <View className="bg-green-100 rounded-full px-2 py-0.5 ml-2">
                      <Text className="text-green-600 text-xs font-medium">Default</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-500 leading-tight">{address.address}</Text>
              </View>

              {/* Radio Button */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedAddress.id === address.id ? "#16a34a" : "#d1d5db",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selectedAddress.id === address.id ? "#dcfce7" : "#ffffff",
                }}
              >
                {selectedAddress.id === address.id && (
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
            </TouchableOpacity>
          ))}
        </View>

        {/* Add New Address Button */}
        <TouchableOpacity
          onPress={onAddNewAddress}
          className="flex-row items-center justify-center border-2 border-dashed border-green-300 rounded-2xl p-4 mb-4"
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>+</Text>
          <Text className="text-green-600 font-semibold">Add New Address</Text>
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity onPress={onClose} className="bg-green-500 rounded-full py-4 items-center justify-center">
          <Text className="text-white font-semibold text-base">Confirm Address</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default SelectAddressBottomSheet