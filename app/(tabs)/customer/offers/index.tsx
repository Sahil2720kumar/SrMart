import Feather from "@expo/vector-icons/Feather"
import { router } from "expo-router"
import { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from "react-native"

import { useOffers } from "@/hooks/queries"
import type { Offer } from "@/types/offers.types"

export default function AllOffersScreen() {
  const [searchQuery, setSearchQuery] = useState("")

  const { data: offers, isLoading, error } = useOffers()



  // console.log(offers);
  
  // ── filter ──────────────────────────────────────────────────────────────
  const filteredOffers = (offers ?? []).filter(
    (offer) =>
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // ── tag colour ──────────────────────────────────────────────────────────
  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "popular": return "bg-green-500"
      case "hot": return "bg-red-500"
      case "new": return "bg-purple-500"
      case "limited": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  // ── loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className="mt-3 text-gray-500 text-sm">Loading offers…</Text>
      </View>
    )
  }

  // ── error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-red-500 text-base text-center">Failed to load offers</Text>
        <Text className="text-gray-400 text-sm text-center mt-1">{error.message}</Text>
      </View>
    )
  }

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-white">
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
              onPress={() => router.push(`/(tabs)/customer/offers/${offer.id}`)}
            >
              {/* Banner Section */}
              <View
                className="h-28 p-4 justify-between"
                style={{ backgroundColor: offer.bg_color ?? "#f3f4f6" }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    {offer.tag && (
                      <View className={`self-start px-2 py-1 rounded-full mb-2 ${getTagColor(offer.tag)}`}>
                        <Text className="text-white text-xs font-medium">{offer.tag}</Text>
                      </View>
                    )}
                    <Text className="text-xl font-bold text-gray-800">{offer.discount}</Text>
                  </View>
                  {/* Skeleton / banner image placeholder */}
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
                <Text className="text-gray-500 text-sm mb-3">
                  {offer.description ?? ""}
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 items-center justify-center mr-1">
                      <Text className="text-gray-400 text-xs">⏱</Text>
                    </View>
                    <Text className="text-gray-400 text-xs">
                      {offer.end_date ? formatEndDate(offer.end_date) : "Ongoing"}
                    </Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs">{offer.item_count} items</Text>
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

// ── utility: "Jan 15, 2026" from ISO string ──────────────────────────────────
function formatEndDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}