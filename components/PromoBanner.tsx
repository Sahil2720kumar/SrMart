// components/PromoBanner.tsx
import { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { Image } from "expo-image"
import { router } from "expo-router"
import { blurhash } from "@/types/categories-products.types"
import { Offer } from "@/types/offers.types"

const { width: SCREEN_WIDTH } = Dimensions.get("window")
const BANNER_WIDTH = SCREEN_WIDTH - 32 // px-4 on each side

type Props = {
  offers: Offer[]
  isLoading?: boolean
}

export default function PromoBanner({ offers, isLoading }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-scroll every 4 seconds when there are multiple banners
  useEffect(() => {
    if (offers.length <= 1) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % offers.length
        flatListRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, 4000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [offers.length])

  const handleBannerPress = (offer: Offer) => {
    router.push(`/customer/offers/${offer.id}`)
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <View className="px-4 mb-6">
        <View
          className="bg-gray-100 rounded-2xl items-center justify-center"
          style={{ height: 160 }}
        >
          <ActivityIndicator size="small" color="#22c55e" />
        </View>
      </View>
    )
  }

  // Fallback static banner when no offers exist
  if (!offers || offers.length === 0) {
    return (
      <View className="px-4 mb-6">
        <View className="bg-green-50 rounded-2xl p-5 flex-row items-center overflow-hidden">
          <View className="flex-1 pr-4">
            <Text className="text-xl font-bold text-gray-900 mb-1">World Food Festival,</Text>
            <Text className="text-xl font-bold text-gray-900 mb-1">Bring the world to</Text>
            <Text className="text-xl font-bold text-gray-900 mb-4">your Kitchen!</Text>
            <TouchableOpacity
              className="bg-green-500 px-5 py-3 rounded-xl self-start"
              onPress={() => router.navigate("/(tabs)/customer/offers/1")}
            >
              <Text className="text-white font-semibold">Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={offers}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={BANNER_WIDTH + 12} // card width + margin
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / (BANNER_WIDTH + 12)
          )
          setActiveIndex(index)
          // Reset auto-scroll timer on manual swipe
          if (timerRef.current) clearInterval(timerRef.current)
        }}
        renderItem={({ item }) => (
          <BannerCard
            offer={item}
            width={BANNER_WIDTH}
            onPress={() => handleBannerPress(item)}
          />
        )}
      />

      {/* Dot indicators — only shown when multiple banners */}
      {offers.length > 1 && (
        <View className="flex-row justify-center mt-3 gap-1">
          {offers.map((_, index) => (
            <View
              key={index}
              className={`rounded-full ${
                index === activeIndex
                  ? "bg-green-500 w-4 h-2"
                  : "bg-gray-300 w-2 h-2"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// Individual banner card
function BannerCard({
  offer,
  width,
  onPress,
}: {
  offer: Offer
  width: number
  onPress: () => void
}) {
  const bgColor = offer.bg_color ?? "#f0fdf4" // default green-50

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={{ width, marginRight: 12 }}
    >
      <View
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: bgColor, minHeight: 160 }}
      >
        {/* Full-width banner image takes priority */}
        {offer.banner_image ? (
          <Image
            source={offer.banner_image}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={500}
            style={{ width: "100%", height: 160, borderRadius: 16 }}
          />
        ) : (
          /* Text-only layout fallback */
          <View className="flex-row items-center p-5" style={{ minHeight: 160 }}>
            <View className="flex-1 pr-4">
              {offer.tag ? (
                <View className="bg-green-500 self-start px-2 py-0.5 rounded-full mb-2">
                  <Text className="text-white text-xs font-semibold">{offer.tag}</Text>
                </View>
              ) : null}

              <Text className="text-xl font-bold text-gray-900 mb-1" numberOfLines={2}>
                {offer.title}
              </Text>

              {offer.description ? (
                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                  {offer.description}
                </Text>
              ) : null}

              {/* Discount badge */}
              {offer.discount ? (
                <View className="mb-3">
                  <Text className="text-green-600 font-bold text-base">{offer.discount}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                className="bg-green-500 px-5 py-2.5 rounded-xl self-start"
                onPress={onPress}
              >
                <Text className="text-white font-semibold">Shop Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Overlay badge on top of image if banner_image exists */}
        {offer.banner_image && offer.tag ? (
          <View className="absolute top-3 left-3 bg-green-500 px-2 py-0.5 rounded-full">
            <Text className="text-white text-xs font-semibold">{offer.tag}</Text>
          </View>
        ) : null}

        {/* Overlay discount text on top of image */}
        {offer.banner_image && offer.discount ? (
          <View className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-xl">
            <Text className="text-white font-bold text-sm">{offer.discount}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}