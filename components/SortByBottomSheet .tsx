import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { useMemo, useRef, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import Svg, { Path, Circle } from "react-native-svg"

// Check Icon Component
const CheckIcon = ({ isSelected }: { isSelected: boolean }) => (
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
      <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <Path
          d="M10 3L4.5 8.5L2 6"
          stroke="#16a34a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )}
  </View>
)

type SortOption = "relevance" | "popularity" | "price_low_to_high" | "price_high_to_low" | "rating" | "newest"

interface SortByBottomSheetProps {
  isVisible: boolean
  selectedSort: SortOption
  onSelectSort: (sort: SortOption) => void
  onClose: () => void
}

const SortByBottomSheet = ({
  isVisible,
  selectedSort,
  onSelectSort,
  onClose,
}: SortByBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => [420], [])

  useMemo(() => {
    if (isVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isVisible])

  const sortOptions: { value: SortOption; label: string; description: string }[] = [
    { value: "relevance", label: "Relevance", description: "Best match for your search" },
    { value: "popularity", label: "Popularity", description: "Most purchased items" },
    { value: "price_low_to_high", label: "Price: Low to High", description: "Lowest price first" },
    { value: "price_high_to_low", label: "Price: High to Low", description: "Highest price first" },
    { value: "rating", label: "Customer Rating", description: "Highest rated first" },
    { value: "newest", label: "Newest First", description: "Recently added items" },
  ]

  const handleSelectSort = (sort: SortOption) => {
    onSelectSort(sort)
    // Auto close after selection (optional)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enablePanDownToClose={true}
      handleIndicatorStyle={{ 
        backgroundColor: "#d1d5db",
        width: 40,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-1">Sort By</Text>
          <Text className="text-sm text-gray-500">Choose how to sort your results</Text>
        </View>

        {/* Sort Options */}
        <View className="mb-4">
          {sortOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelectSort(option.value)}
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
              activeOpacity={0.7}
            >
              {/* Label & Description */}
              <View className="flex-1 mr-3">
                <Text className={`text-base font-semibold mb-0.5 ${
                  selectedSort === option.value ? "text-green-600" : "text-gray-900"
                }`}>
                  {option.label}
                </Text>
                <Text className="text-xs text-gray-500">{option.description}</Text>
              </View>

              {/* Check Icon */}
              <CheckIcon isSelected={selectedSort === option.value} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Apply Button */}
        <TouchableOpacity
          onPress={onClose}
          className="bg-green-500 rounded-2xl py-4 items-center justify-center mt-2"
          activeOpacity={0.8}
          style={{
            shadowColor: "#22c55e",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Text className="text-white font-bold text-base">Apply Sort</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export default SortByBottomSheet