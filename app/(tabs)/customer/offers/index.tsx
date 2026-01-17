import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native"

interface Offer {
  id: string
  title: string
  description: string
  discount: string
  validUntil: string
  itemCount: number
  bgColor: string
  tag?: string
}

const offers: Offer[] = [
  {
    id: "1",
    title: "Best Deal",
    description: "Top discounts on everyday essentials",
    discount: "Up to 40% OFF",
    validUntil: "Dec 31, 2025",
    itemCount: 45,
    bgColor: "#dcfce7",
    tag: "Popular",
  },
  {
    id: "2",
    title: "Weekend Special",
    description: "Exclusive weekend-only offers on groceries",
    discount: "Up to 30% OFF",
    validUntil: "Every Weekend",
    itemCount: 32,
    bgColor: "#fef9c3",
  },
  {
    id: "3",
    title: "Flash Sale",
    description: "Limited time offers - grab them fast!",
    discount: "Up to 60% OFF",
    validUntil: "24 Hours Only",
    itemCount: 18,
    bgColor: "#fee2e2",
    tag: "Hot",
  },
  {
    id: "4",
    title: "Buy 1 Get 1 Free",
    description: "Double the value on selected items",
    discount: "BOGO",
    validUntil: "Jan 15, 2026",
    itemCount: 24,
    bgColor: "#dbeafe",
  },
  {
    id: "5",
    title: "New User Offer",
    description: "Special discounts for first-time shoppers",
    discount: "Flat 25% OFF",
    validUntil: "First 3 Orders",
    itemCount: 120,
    bgColor: "#f3e8ff",
    tag: "New",
  },
  {
    id: "6",
    title: "Combo Deals",
    description: "Save more with bundled product combos",
    discount: "Save up to $20",
    validUntil: "Ongoing",
    itemCount: 15,
    bgColor: "#ffedd5",
  },
  {
    id: "7",
    title: "Clearance Sale",
    description: "Last chance to grab at lowest prices",
    discount: "Up to 70% OFF",
    validUntil: "While Stock Lasts",
    itemCount: 28,
    bgColor: "#fce7f3",
    tag: "Limited",
  },
  {
    id: "8",
    title: "Monthly Savers",
    description: "Budget-friendly deals for the whole month",
    discount: "Up to 35% OFF",
    validUntil: "Jan 31, 2026",
    itemCount: 56,
    bgColor: "#e0f2fe",
  },
]

export default function AllOffersScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOffers = offers.filter(
    (offer) =>
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Popular":
        return "bg-green-500"
      case "Hot":
        return "bg-red-500"
      case "New":
        return "bg-purple-500"
      case "Limited":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}


      {/* Search Bar */}
      <View className="px-4 py-3 mt-4">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
          <View className="w-5 h-5 items-center justify-center mr-2">
          <Feather name="search" size={16} color="gray" />
          </View>
          <TextInput
            className="flex-1 py-3 text-black text-base"
            placeholder="Search offers"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <View className="w-5 h-5 bg-gray-300 rounded-full items-center justify-center">
                <Text className="text-white text-xs">✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Offers Count */}
      <View className="px-4 pb-2">
        <Text className="text-gray-500 text-sm">{filteredOffers.length} offers available</Text>
      </View>

      {/* Offers List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filteredOffers.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Text className="text-2xl">🏷️</Text>
            </View>
            <Text className="text-gray-500 text-base">No offers found</Text>
          </View>
        ) : (
          filteredOffers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              className="mb-4 rounded-2xl overflow-hidden border border-gray-100"
              activeOpacity={0.7}
              onPress={()=>router.push('/(tabs)/customer/offers/1')}
            >
              {/* Banner Section with Skeleton */}
              <View className="h-28 p-4 justify-between" style={{ backgroundColor: offer.bgColor }}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    {offer.tag && (
                      <View className={`self-start px-2 py-1 rounded-full mb-2 ${getTagColor(offer.tag)}`}>
                        <Text className="text-white text-xs font-medium">{offer.tag}</Text>
                      </View>
                    )}
                    <Text className="text-xl font-bold text-gray-800">{offer.discount}</Text>
                  </View>
                  {/* Skeleton Image Placeholder */}
                  <View className="w-20 h-20 bg-white/50 rounded-xl items-center justify-center">
                    <View className="w-12 h-12 bg-gray-200 rounded-lg" />
                  </View>
                </View>
              </View>

              {/* Details Section */}
              <View className="p-4 bg-white">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-semibold text-black">{offer.title}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-green-600 font-medium text-sm mr-1">Shop Now</Text>
                    <Text className="text-green-600">→</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm mb-3">{offer.description}</Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 items-center justify-center mr-1">
                      <Text className="text-gray-400 text-xs">⏱</Text>
                    </View>
                    <Text className="text-gray-400 text-xs">{offer.validUntil}</Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs">{offer.itemCount} items</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </View>
  )
}
