import VendorProductCard from '@/components/VendorProductCard';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock product data
export const mockProducts = [
  {
    id: '1',
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    price: 45,
    stock: 120,
    image: '🍅',
    status: 'in-stock',
    isActive: true
  },
  {
    id: '2',
    name: 'Organic Lettuce',
    category: 'Vegetables',
    price: 35,
    stock: 8,
    image: '🥬',
    status: 'low-stock',
    isActive: false
  },
  {
    id: '3',
    name: 'Red Apples',
    category: 'Fruits',
    price: 60,
    stock: 0,
    image: '🍎',
    status: 'out-of-stock',
    isActive: true
  },
  {
    id: '4',
    name: 'Carrots',
    category: 'Vegetables',
    price: 25,
    stock: 95,
    image: '🥕',
    status: 'in-stock',
    isActive: true
  },
  {
    id: '5',
    name: 'Bananas',
    category: 'Fruits',
    price: 40,
    stock: 5,
    image: '🍌',
    status: 'low-stock',
    isActive: true
  },
  {
    id: '6',
    name: 'Broccoli',
    category: 'Vegetables',
    price: 50,
    stock: 30,
    image: '🥦',
    status: 'in-stock',
    isActive: true
  },
];

type FilterType = 'all' | 'in-stock' | 'out-of-stock' | 'low-stock' | 'disabled';

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading] = useState(false);

  // Filter products based on search and filter type
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all' || product.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Count products by status
  const statusCounts = {
    all: mockProducts.length,
    'in-stock': mockProducts.filter((p) => p.status === 'in-stock').length,
    'out-of-stock': mockProducts.filter((p) => p.status === 'out-of-stock').length,
    'low-stock': mockProducts.filter((p) => p.status === 'low-stock').length,
    disabled: mockProducts.filter((p) => p.status === 'disabled').length,
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Products</Text>
            <Text className="text-sm text-gray-600 mt-1">
              {filteredProducts.length} products
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-emerald-500 rounded-xl px-4 py-2.5 flex-row items-center gap-2"
          >
            <Feather name='plus' size={18} color="#fff" />
            <Text className="text-white font-semibold text-sm">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Feather name='search' size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row gap-2">
            {(['all', 'in-stock', 'out-of-stock', 'low-stock'] as FilterType[]).map(
              (filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.7}
                  className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${activeFilter === filter
                    ? 'bg-emerald-500'
                    : 'bg-gray-200 border border-gray-300'
                    }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${activeFilter === filter
                      ? 'text-white'
                      : 'text-gray-700'
                      }`}
                  >
                    {filter === 'in-stock'
                      ? 'In Stock'
                      : filter === 'out-of-stock'
                        ? 'Out of Stock'
                        : filter === 'low-stock'
                          ? 'Low Stock'
                          : 'All'}
                  </Text>
                  <View
                    className={`rounded-full px-2 py-0.5 ${activeFilter === filter
                      ? 'bg-white/30'
                      : 'bg-gray-300'
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${activeFilter === filter
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}
                    >
                      {statusCounts[filter]}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>
        </ScrollView>
      </View>

      {/* Products List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => <VendorProductCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center py-16">
          <Feather name="alert-circle" size={48} color="#9ca3af" />
          <Text className="text-gray-900 font-semibold text-center mt-4">
            No products found
          </Text>
          <Text className="text-gray-600 text-sm text-center mt-2 px-4">
            Try adjusting your search or filters to find products
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}