import useDraftProductStore from '@/store/useDraftProductStore';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProductScreen() {
  // Form State
  const {productId}=useLocalSearchParams()
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [brand, setBrand] = useState('');
  const [unitSize, setUnitSize] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');
  const [taxApplicable, setTaxApplicable] = useState(true);
  const [returnable, setReturnable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(false);

  const categories = ['Vegetables', 'Fruits', 'Dairy', 'Bakery', 'Meat', 'Snacks', 'Beverages', 'Other'];

  const handleGoBack = () => {
    console.log('[v0] Navigating back to products list');
    router.back()
  };

  const handleUploadImage = async () => {
    setIsLoading(true);
    try {
      // Simulate file picker
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newImage = `🖼️ Image ${uploadedImages.length + 1}`;
      setUploadedImages([...uploadedImages, newImage]);
      Alert.alert('Success', 'Image added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!productName.trim()) errors.push('Product name is required');
    if (!category.trim()) errors.push('Category is required');
    if (!unitSize.trim()) errors.push('Unit/Size is required');
    if (!mrp.trim()) errors.push('MRP is required');
    if (!sellingPrice.trim()) errors.push('Selling price is required');
    if (!initialStock.trim()) errors.push('Initial stock is required');

    if (Number(mrp) <= 0) errors.push('MRP must be greater than 0');
    if (Number(sellingPrice) <= 0) errors.push('Selling price must be greater than 0');
    if (Number(sellingPrice) > Number(mrp)) errors.push('Selling price cannot exceed MRP');
    if (Number(initialStock) < 0) errors.push('Stock cannot be negative');

    return errors;
  };

  const handleUpdateAndPublish = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const discountPercentage = ((Number(mrp) - Number(sellingPrice)) / Number(mrp) * 100).toFixed(2);

      console.log('[v0] Product saved and published:', {
        productName,
        category,
        brand,
        unitSize,
        mrp: Number(mrp),
        sellingPrice: Number(sellingPrice),
        discountPercentage,
        initialStock: Number(initialStock),
        lowStockThreshold: Number(lowStockThreshold) || 10,
        isActive,
        description,
        expiryDate,
        barcode,
        taxApplicable,
        returnable,
        isFeatured,
        images: uploadedImages.length,
      });

      Alert.alert('Success', `"${productName}" Updated successfully!`, [
        {
          text: 'View Product',
          onPress: () => console.log('[v0] Navigate to product detail'),
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsLoading(false);
    }
  };


  const discountPercentage = mrp && sellingPrice
    ? ((Number(mrp) - Number(sellingPrice)) / Number(mrp) * 100).toFixed(2)
    : '0';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity className="p-2 -ml-2" onPress={handleGoBack}>
          <Feather name="chevron-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-2">Edit Product #{productId}</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Product Image Section */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-3">PRODUCT IMAGE</Text>

            {uploadedImages.length === 0 ? (
              <View className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center mb-3">
                <Text className="text-3xl mb-2">📸</Text>
                <Text className="text-gray-900 font-semibold text-sm text-center">No images added</Text>
                <Text className="text-gray-600 text-xs text-center mt-1">Add images to showcase your product</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-2 mb-3">
                {uploadedImages.map((image, index) => (
                  <View key={index} className="relative">
                    <View className="w-20 h-20 bg-emerald-100 rounded-lg items-center justify-center border border-emerald-300">
                      <Text className="text-2xl">{image}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <Feather name='trash-2' size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={handleUploadImage}
              disabled={isLoading}
              className={`bg-emerald-50 border border-emerald-200 rounded-xl py-3 items-center justify-center flex-row gap-2 ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <>
                  <Feather name='upload' size={18} color="#059669" />
                  <Text className="text-emerald-700 font-semibold text-sm">Upload Product Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-4">BASIC INFORMATION</Text>

            {/* Product Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name *</Text>
              <TextInput
                placeholder="Enter product name"
                value={productName}
                onChangeText={setProductName}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Category *</Text>
              <TouchableOpacity
                onPress={() => setSelectedCategory(!selectedCategory)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={`text-sm ${category ? 'text-gray-900' : 'text-gray-500'}`}>
                  {category}
                </Text>
                <Text className="text-lg">▼</Text>
              </TouchableOpacity>

              {selectedCategory && (
                <View className="mt-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => {
                        setCategory(cat);
                        setSelectedCategory(false);
                      }}
                      className={`px-4 py-3 border-b border-gray-100 ${category === cat ? 'bg-emerald-50' : ''}`}
                    >
                      <Text className={`text-sm font-medium ${category === cat ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Brand */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Brand (Optional)</Text>
              <TextInput
                placeholder="Enter brand name"
                value={brand}
                onChangeText={setBrand}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Unit / Size */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Unit / Size *</Text>
              <TextInput
                placeholder="e.g., 500ml, 1kg, 1pcs"
                value={unitSize}
                onChangeText={setUnitSize}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Pricing Section */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-4">PRICING</Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">MRP (₹) *</Text>
                <TextInput
                  placeholder="0"
                  value={mrp}
                  onChangeText={setMrp}
                  keyboardType="decimal-pad"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Selling Price (₹) *</Text>
                <TextInput
                  placeholder="0"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="decimal-pad"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Discount Display */}
            {mrp && sellingPrice && (
              <View className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-emerald-700 font-semibold text-sm">Discount</Text>
                  <View className="bg-emerald-500 rounded-full px-3 py-1">
                    <Text className="text-white font-bold text-sm">{discountPercentage}%</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Stock & Availability */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-4">STOCK & AVAILABILITY</Text>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Initial Stock *</Text>
                <TextInput
                  placeholder="0"
                  value={initialStock}
                  onChangeText={setInitialStock}
                  keyboardType="number-pad"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Low Stock Alert</Text>
                <TextInput
                  placeholder="10"
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  keyboardType="number-pad"
                  className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Active Toggle */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <View>
                <Text className="text-gray-900 font-semibold text-sm">Available for Sale</Text>
                <Text className="text-gray-600 text-xs mt-1">
                  {isActive ? 'Customers can order this product' : 'Product is hidden from customers'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={isActive ? '#059669' : '#6b7280'}
              />
            </View>
          </View>

          {/* Description & Attributes */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
            <Text className="text-sm font-semibold text-gray-600 mb-4">PRODUCT DETAILS</Text>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <TextInput
                placeholder="Describe your product..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={40}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Expiry Date */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Expiry Date / Shelf Life</Text>
              <TextInput
                placeholder="e.g., 5 days, 3 months"
                value={expiryDate}
                onChangeText={setExpiryDate}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Barcode */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Barcode</Text>
              <TextInput
                placeholder="Enter barcode"
                value={barcode}
                onChangeText={setBarcode}
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Additional Settings */}
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-4">ADDITIONAL SETTINGS</Text>

            {/* Tax Toggle */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <Text className="text-gray-900 font-semibold text-sm">Tax Applicable</Text>
              <Switch
                value={taxApplicable}
                onValueChange={setTaxApplicable}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={taxApplicable ? '#059669' : '#6b7280'}
              />
            </View>

            {/* Returnable Toggle */}
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <Text className="text-gray-900 font-semibold text-sm">Returnable</Text>
              <Switch
                value={returnable}
                onValueChange={setReturnable}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={returnable ? '#059669' : '#6b7280'}
              />
            </View>

            {/* Featured Toggle */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-900 font-semibold text-sm">Featured Product</Text>
                <Text className="text-gray-600 text-xs mt-1">Show on homepage</Text>
              </View>
              <Switch
                value={isFeatured}
                onValueChange={setIsFeatured}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={isFeatured ? '#059669' : '#6b7280'}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {/* Sticky Action Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 safe-area-bottom">
        <TouchableOpacity
          onPress={handleUpdateAndPublish}
          disabled={isLoading}
          activeOpacity={0.7}
          className={`w-full bg-emerald-500 rounded-xl py-4 items-center justify-center mb-3 ${isLoading ? 'opacity-50' : ''}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">Update & Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
