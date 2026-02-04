import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { useEffect, useMemo, useRef } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { Feather } from '@expo/vector-icons'
import { DeliveryBoy } from "@/types/users.types"



const SelectDeliveryPartnerBottomSheet = ({
  isVisible,
  partners,
  selectedPartner,
  onSelectPartner,
  onClose,
  onConfirm,
}: {
  isVisible: boolean
  partners: DeliveryBoy[]
  selectedPartner: DeliveryBoy | null
  onSelectPartner: (partner: DeliveryBoy) => void
  onClose: () => void
  onConfirm: () => void
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["85%"], [])

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isVisible])

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "bike":
        return "🏍️"
      case "scooter":
        return "🛵"
      case "bicycle":
        return "🚲"
      default:
        return "🏍️"
    }
  }

  const getVehicleLabel = (type: string) => {
    switch (type) {
      case "bike":
        return "Motorcycle"
      case "scooter":
        return "Scooter"
      case "bicycle":
        return "Bicycle"
      default:
        return "Vehicle"
    }
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
      onClose={onClose}
      style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-2">Select Delivery Partner</Text>
          <Text className="text-sm text-gray-500">Choose an available delivery partner near your location</Text>
        </View>

        {/* Available Partners Count */}
        <View className="flex-row items-center bg-emerald-50 rounded-xl p-3 mb-4">
          <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center mr-3">
            <Feather name="users" size={16} color="#059669" />
          </View>
          <Text className="text-emerald-700 font-medium text-sm">
            {partners.filter(p => p.is_available).length} partners available nearby
          </Text>
        </View>

        {/* Partners List */}
        {partners.map((partner) => (
          <TouchableOpacity
            key={partner.id}
            onPress={() => partner.is_available && onSelectPartner(partner)}
            disabled={!partner.is_available}
            className={`bg-white border rounded-2xl p-4 mb-3 ${partner.is_available
              ? selectedPartner?.id === partner.id
                ? 'border-emerald-500 border-2'
                : 'border-gray-200'
              : 'border-gray-100 bg-gray-50'
              }`}
            style={{ opacity: partner.is_available ? 1 : 0.6 }}
          >
            <View className="flex-row">
              {/* Profile Image/Avatar */}
              <View className="mr-3">
                {!partner.profile_photo ? (
                  <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                    <View className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center">
                      <Feather name="user" size={24} color="#9ca3af" />
                    </View>
                  </View>
                ) : (
                  <View className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 items-center justify-center">
                    <Text className="text-black text-xl font-bold">
                      {partner.first_name } {partner.last_name}
                    </Text>
                  </View>
                )}
                {/* {partner.isAvailable && (
                  <View className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white items-center justify-center">
                    <View className="w-2 h-2 bg-white rounded-full" />
                  </View>
                )} */}
              </View>

              {/* Partner Info */}
              <View className="flex-1">
                {/* Name and Status */}
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-gray-900">{partner.name}</Text>
                  {!partner.isAvailable && (
                    <View className="bg-red-100 rounded-full px-2 py-1">
                      <Text className="text-red-600 text-xs font-medium">Busy</Text>
                    </View>
                  )}
                </View>

                {/* Rating and Deliveries */}
                <View className="flex-row items-center mb-3">
                  <View className="flex-row items-center mr-3">
                    <Text className="text-amber-500 mr-1">⭐</Text>
                    <Text className="text-sm font-semibold text-gray-700">{partner.rating.toFixed(1)}</Text>
                  </View>
                  <Text className="text-xs text-gray-500">•</Text>
                  <Text className="text-xs text-gray-500 ml-2">
                    {partner.total_deliveries}+ deliveries
                  </Text>
                </View>

                {/* Vehicle Info */}
                <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <Text className="mr-2">{getVehicleIcon(partner.vehicle_type)}</Text>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500">{getVehicleLabel(partner.vehicle_type)}</Text>
                    <Text className="text-xs font-semibold text-gray-700">{partner.vehicle_number}</Text>
                  </View>
                </View>

                {/* Distance and Time Info */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center mr-2">
                      <Feather name="map-pin" size={14} color="#2563eb" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500">Distance</Text>
                      <Text className="text-xs font-semibold text-gray-900">{partner?.distance || "naajanu"}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-7 h-7 rounded-full bg-purple-50 items-center justify-center mr-2">
                      <Feather name="clock" size={14} color="#7c3aed" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500">ETA</Text>
                      <Text className="text-xs font-semibold text-gray-900">{partner?.estimatedTime || "naajanu"}</Text>
                    </View>
                  </View>

                  {partner.is_available && partner?.currentOrders || 5 > 0 && (
                    <View className="flex-row items-center">
                      <View className="w-7 h-7 rounded-full bg-orange-50 items-center justify-center mr-2">
                        <Feather name="package" size={14} color="#ea580c" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Active</Text>
                        <Text className="text-xs font-semibold text-gray-900">{partner?.currentOrders || "naajanu"}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Contact Button */}
                {partner.is_available && (
                  <TouchableOpacity className="flex-row items-center justify-center bg-blue-50 rounded-lg px-3 py-2 mt-3">
                    <Feather name="phone" size={14} color="#2563eb" />
                    <Text className="text-blue-600 font-medium text-xs ml-2">{partner?.phone || 98787777777 }</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Selection Radio */}
              {partner.is_available && (
                <View className="ml-2 justify-center">
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedPartner?.id === partner.id ? "#10b981" : "#d1d5db",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: selectedPartner?.id === partner.id ? "#d1fae5" : "#ffffff",
                    }}
                  >
                    {selectedPartner?.id === partner.id && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#10b981",
                        }}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {partners.filter(p => p.is_available).length === 0 && (
          <View className="items-center justify-center py-12">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Feather name="user-x" size={32} color="#9ca3af" />
            </View>
            <Text className="text-gray-500 font-medium text-base mb-1">No Partners Available</Text>
            <Text className="text-gray-400 text-sm text-center">
              All delivery partners are currently busy.{'\n'}Please try again in a few minutes.
            </Text>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={onConfirm}
          disabled={!selectedPartner}
          className={`rounded-full mb-5 py-4 items-center justify-center ${selectedPartner ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
        >
          <Text className={`font-bold text-base ${selectedPartner ? 'text-white' : 'text-gray-500'}`}>
            {selectedPartner ? `Assign ${selectedPartner.first_name}` : 'Select a Partner'}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

export default SelectDeliveryPartnerBottomSheet
