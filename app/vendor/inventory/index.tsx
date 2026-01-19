import VendorInventoryCard from '@/components/VendorInventoryCard';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock inventory data
export const mockInventoryItems = [
  { id: '1', name: 'Fresh Tomatoes', category: 'Vegetables', stock: 120, lowStockThreshold: 20, status: 'in-stock', image: '🍅' },
  { id: '2', name: 'Organic Lettuce', category: 'Vegetables', stock: 8, lowStockThreshold: 15, status: 'low-stock', image: '🥬' },
  { id: '3', name: 'Red Apples', category: 'Fruits', stock: 0, lowStockThreshold: 25, status: 'out-of-stock', image: '🍎' },
  { id: '4', name: 'Carrots', category: 'Vegetables', stock: 95, lowStockThreshold: 20, status: 'in-stock', image: '🥕' },
  { id: '5', name: 'Bananas', category: 'Fruits', stock: 5, lowStockThreshold: 30, status: 'low-stock', image: '🍌' },
  { id: '6', name: 'Broccoli', category: 'Vegetables', stock: 30, lowStockThreshold: 15, status: 'in-stock', image: '🥦' },
  { id: '7', name: 'Onions', category: 'Vegetables', stock: 200, lowStockThreshold: 50, status: 'in-stock', image: '🧅' },
  { id: '8', name: 'Bell Peppers', category: 'Vegetables', stock: 0, lowStockThreshold: 20, status: 'out-of-stock', image: '🫑' },
];

type FilterType = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortType = 'stock-desc' | 'stock-asc' | 'name-asc';

export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('stock-desc');
  const [refreshing, setRefreshing] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof mockInventoryItems[0] | null>(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Filter inventory items
  const filteredItems = useMemo(() => {
    let items = mockInventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
      return matchesSearch && matchesFilter;
    });

    // Sort items
    switch (sortBy) {
      case 'stock-asc':
        items.sort((a, b) => a.stock - b.stock);
        break;
      case 'name-asc':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stock-desc':
      default:
        items.sort((a, b) => b.stock - a.stock);
    }

    return items;
  }, [searchQuery, activeFilter, sortBy]);

  // Calculate inventory insights
  const insights = useMemo(() => {
    const totalProducts = mockInventoryItems.length;
    const inStockCount = mockInventoryItems.filter((p) => p.status === 'in-stock').length;
    const outOfStockCount = mockInventoryItems.filter((p) => p.status === 'out-of-stock').length;
    const lowStockCount = mockInventoryItems.filter((p) => p.status === 'low-stock').length;

    return { totalProducts, inStockCount, outOfStockCount, lowStockCount };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[v0] Inventory refreshed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh inventory');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleOpenUpdateModal = (item: typeof mockInventoryItems[0]) => {
    setSelectedItem(item);
    setNewStockValue(item.stock.toString());
    setUpdateModalVisible(true);
  };

  // const handleIncreaseStock = async (item: typeof mockInventoryItems[0]) => {
  //   const newStock = item.stock + 1;
  //   setSelectedItem(item);
  //   setNewStockValue(newStock.toString());
  //   await handleSaveStockUpdate(item.id);
  // };

  // const handleDecreaseStock = async (item: typeof mockInventoryItems[0]) => {
  //   if (item.stock === 0) {
  //     Alert.alert('Error', 'Cannot decrease stock below 0');
  //     return;
  //   }
  //   const newStock = item.stock - 1;
  //   setSelectedItem(item);
  //   console.log("nwstock",newStock);

  //   setNewStockValue(newStock.toString());
  //   console.log(newStockValue);
  //   await handleSaveStockUpdate(item.id);
  // };

  const handleSaveStockUpdate = async (itemId: string) => {
    console.log(newStockValue);

    if (!newStockValue || isNaN(parseInt(newStockValue))) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return;
    }

    const newStock = parseInt(newStockValue);
    if (newStock < 0) {
      Alert.alert('Error', 'Stock cannot be negative');
      return;
    }

    setUpdateLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const itemName = selectedItem?.name || '';
      Alert.alert('Success', `Stock updated to ${newStock} units for ${itemName}`);
      setUpdateModalVisible(false);
      setSelectedItem(null);
      setNewStockValue('');
    } catch (error) {
      Alert.alert('Error', 'Failed to update stock. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex-row items-center justify-between">
        <View className='flex-row items-center'>
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Feather name="chevron-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">Inventory</Text>
            <Text className="text-sm text-gray-600">Stock Management</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push("/vendor/product/add")} className='items-center'>
          <Feather name='plus-circle' size={24} color={"#000"} />
        </TouchableOpacity>
      </View>

      {/* Inventory Insights */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Total Products</Text>
            <Text className="text-2xl font-bold text-gray-900">{insights.totalProducts}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">In Stock</Text>
            <Text className="text-2xl font-bold text-emerald-600">{insights.inStockCount}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Low Stock</Text>
            <Text className="text-2xl font-bold text-orange-600">{insights.lowStockCount}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-xs font-semibold mb-1">Out of Stock</Text>
            <Text className="text-2xl font-bold text-red-600">{insights.outOfStockCount}</Text>
          </View>
        </View>
      </View>

      {/* Low Stock Alert Banner */}
      {insights.lowStockCount > 0 && (
        <View className="bg-orange-50 mx-4 mt-4 rounded-2xl p-4 border border-orange-200 flex-row items-start gap-3">
          <Feather name='alert-circle' size={20} color="#ea580c" className="mt-0.5" />
          <View className="flex-1">
            <Text className="text-orange-700 font-semibold text-sm">
              {insights.lowStockCount} product{insights.lowStockCount > 1 ? 's' : ''} running low
            </Text>
            <Text className="text-orange-600 text-xs mt-1">
              Reorder soon to avoid stockouts
            </Text>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2.5 mb-3">
          <Feather name='search' size={18} color="#9ca3af" />
          <TextInput
            placeholder="Search by product name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Filter & Sort Controls */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
                className={`px-3 py-2 rounded-full ${activeFilter === filter
                  ? 'bg-emerald-500'
                  : 'bg-gray-100 border border-gray-200'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold capitalize ${activeFilter === filter ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {filter === 'in-stock'
                    ? 'In Stock'
                    : filter === 'out-of-stock'
                      ? 'Out'
                      : filter === 'low-stock'
                        ? 'Low'
                        : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Sort Dropdown */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { label: 'Stock High→Low', value: 'stock-desc' },
              { label: 'Stock Low→High', value: 'stock-asc' },
              { label: 'A→Z', value: 'name-asc' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.value}
                onPress={() => setSortBy(sort.value as SortType)}
                activeOpacity={0.7}
                className={`px-3 py-2 rounded-full ${sortBy === sort.value
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-gray-100 border border-gray-200'
                  }`}
              >
                <Text
                  className={`text-sm font-semibold ${sortBy === sort.value ? 'text-blue-700' : 'text-gray-700'
                    }`}
                >
                  {sort.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <VendorInventoryCard handleOpenUpdateModal={handleOpenUpdateModal} item={item} updateLoading={updateLoading} setUpdateLoading={setUpdateLoading} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <Feather name='alert-circle' size={48} color="#d1d5db" />
            <Text className="text-gray-900 font-semibold text-center mt-4">
              No products found
            </Text>
            <Text className="text-gray-600 text-sm text-center mt-2 px-4">
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />


      {updateModalVisible && (
        <BlurView
          intensity={10}
          experimentalBlurMethod='dimezisBlurView'
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
      )}
      {/* Stock Update Modal */}
      <Modal
        visible={updateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View className="flex-1 bg-transparent bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-gray-900">Update Stock</Text>
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)}>
                <Feather name='x' size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <>
                <View className="flex-row items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <View className="w-16 h-16 bg-emerald-100 rounded-xl items-center justify-center">
                    <Text className="text-3xl">{selectedItem.image}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900">{selectedItem.name}</Text>
                    <Text className="text-sm text-gray-600 mt-1">Current: {selectedItem.stock} units</Text>
                  </View>
                </View>

                <Text className="text-gray-600 text-sm font-medium mb-2">New Stock Quantity</Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-2">
                  <Text className="text-2xl text-gray-900 font-bold">📦</Text>
                  <TextInput
                    placeholder="0"
                    value={newStockValue}
                    onChangeText={setNewStockValue}
                    keyboardType="numeric"
                    className="flex-1 ml-2 text-2xl text-gray-900 font-bold"
                    placeholderTextColor="#d1d5db"
                  />
                </View>

                <Text className="text-gray-500 text-xs mb-6">
                  Difference: {newStockValue ? `${parseInt(newStockValue) - selectedItem.stock > 0 ? '+' : ''}${parseInt(newStockValue) - selectedItem.stock}` : '0'} units
                </Text>

                <TouchableOpacity
                  onPress={() => handleSaveStockUpdate(selectedItem.id)}
                  disabled={updateLoading}
                  className={`bg-emerald-500 rounded-xl py-4 items-center justify-center mb-3 ${updateLoading ? 'opacity-50' : ''}`}
                >
                  {updateLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-base">Save Update</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUpdateModalVisible(false)}
                  className="py-3 items-center"
                >
                  <Text className="text-gray-600 font-semibold">Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
