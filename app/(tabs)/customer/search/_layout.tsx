import { router, Stack, usePathname } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import SortByBottomSheet from '@/components/SortByBottomSheet ';
import { BlurView } from 'expo-blur';

type SortOption = "relevance" | "popularity" | "price_low_to_high" | "price_high_to_low" | "rating" | "newest"
const sortOptions: { value: SortOption; label: string; description: string }[] = [
  { value: "relevance", label: "Relevance", description: "Best match for your search" },
  { value: "popularity", label: "Popularity", description: "Most purchased items" },
  { value: "price_low_to_high", label: "Price: Low to High", description: "Lowest price first" },
  { value: "price_high_to_low", label: "Price: High to Low", description: "Highest price first" },
  { value: "rating", label: "Customer Rating", description: "Highest rated first" },
  { value: "newest", label: "Newest First", description: "Recently added items" },
]


export default function SearchLayout() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevance")
  const handleSelectSort = (sort: SortOption) => {
    setSelectedSort(sort)

    // Update the URL with the new sort parameter
    if (pathname.includes('search-results')) {
      router.setParams({ sort })
    }
  }
  return (
    <>
      <Stack screenOptions={{
        headerLeft(props) {
          return (
            <Feather onPress={() => router.back()} name="chevron-left" size={24} color="black" />
          )
        },
        headerRight(props) {
          return (
            <Ionicons onPress={() => setIsVisible(true)} name="filter" size={24} color="black" />
          )
        },
      }}>
        <Stack.Screen
          name="index"
          options={{
            headerShown: true,
            title: 'Search',
            headerBackTitle: 'Back',
            // Optional: customize header
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTitleAlign: 'center',
            headerTintColor: '#000',
          }}
        />
        <Stack.Screen
          name="search-results"
          options={{
            headerShown: true,
            title: 'Search Query',
            headerBackTitle: 'Back',
            // Optional: customize header
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTitleAlign: 'center',
            headerTintColor: '#000',
          }}
        />
      </Stack>

      {isVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}
      <SortByBottomSheet
        isVisible={isVisible}
        selectedSort={selectedSort}
        onSelectSort={handleSelectSort}
        onClose={() => setIsVisible(false)}
      />
    </>
  );
}