import { 
  useProductDetailsByVendorIdAndProductId, 
  useProductImagesByProductId,
  useUpdateProduct,
  useUploadProductImage,
  useDeleteProductImage,
  useSetPrimaryImage,
} from '@/hooks/queries';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  
  // Fetch product data
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductDetailsByVendorIdAndProductId(productId);

  // Fetch product images
  const {
    data: productImages,
    isLoading: isLoadingImages,
  } = useProductImagesByProductId(productId);

  // Update mutation
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const deleteImageMutation = useDeleteProductImage();
  const setPrimaryImageMutation = useSetPrimaryImage();

  // Form State
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [barcode, setBarcode] = useState('');

  const [isOrganic, setIsOrganic] = useState(false);
  const [isVeg, setIsVeg] = useState(true);

  // Load product data into form when it's available
  useEffect(() => {
    if (product) {
      setProductName(product.name || '');
      setCategoryId(product.category_id || '');
      setSubCategoryId(product.sub_category_id || '');
      setUnit(product.unit || '');
      setPrice(product.price?.toString() || '');
      setDiscountPrice(product.discount_price?.toString() || '');
      setStockQuantity(product.stock_quantity?.toString() || '');
      setLowStockThreshold(product.low_stock_threshold?.toString() || '');
      setIsAvailable(product.is_available ?? true);
      setDescription(product.description || '');
      setShortDescription(product.short_description || '');
      setExpiryDate(product.expiry_date || '');
      setBarcode(product.barcode || '');
      setIsOrganic(product.is_organic ?? false);
      setIsVeg(product.is_veg ?? true);
    }
  }, [product]);

  const handleGoBack = () => {
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleUploadImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Upload image
        await uploadImageMutation.mutateAsync({
          productId,
          imageUri,
          isPrimary: !productImages || productImages.length === 0, // First image is primary
        });

        Alert.alert('Success', 'Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleDeleteImage = (imageId: string, imageUrl: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteImageMutation.mutateAsync({
                productId,
                imageId,
                imageUrl,
              });
              Alert.alert('Success', 'Image deleted successfully!');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete image.');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      await setPrimaryImageMutation.mutateAsync({
        productId,
        imageId,
      });
      Alert.alert('Success', 'Primary image updated!');
    } catch (error) {
      console.error('Set primary error:', error);
      Alert.alert('Error', 'Failed to set primary image.');
    }
  };

  const hasUnsavedChanges = () => {
    if (!product) return false;
    return (
      productName !== (product.name || '') ||
      unit !== (product.unit || '') ||
      price !== (product.price?.toString() || '') ||
      discountPrice !== (product.discount_price?.toString() || '') ||
      stockQuantity !== (product.stock_quantity?.toString() || '') ||
      description !== (product.description || '')
    );
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!productName.trim()) errors.push('Product name is required');
    if (!unit.trim()) errors.push('Unit is required');
    if (!price.trim()) errors.push('Price is required');
    if (!stockQuantity.trim()) errors.push('Stock quantity is required');

    if (Number(price) <= 0) errors.push('Price must be greater than 0');
    if (discountPrice && Number(discountPrice) <= 0) errors.push('Discount price must be greater than 0');
    if (discountPrice && Number(discountPrice) > Number(price)) {
      errors.push('Discount price cannot exceed regular price');
    }
    if (Number(stockQuantity) < 0) errors.push('Stock cannot be negative');
    if (lowStockThreshold && Number(lowStockThreshold) < 0) {
      errors.push('Low stock threshold cannot be negative');
    }

    return errors;
  };

  const handleUpdateProduct = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      const updates = {
        name: productName.trim(),
        unit: unit.trim(),
        price: Number(price),
        discount_price: Number(discountPrice),
        stock_quantity: Number(stockQuantity),
        low_stock_threshold: lowStockThreshold ? Number(lowStockThreshold) : 10,
        is_available: isAvailable,
        description: description.trim(),
        short_description: shortDescription.trim() || "",
        expiry_date: expiryDate.trim() || "",
        barcode: barcode.trim() || "",
        is_organic: isOrganic,
        is_veg: isVeg,
      };

      await updateProductMutation.mutateAsync({
        productId,
        updates,
      });

      Alert.alert(
        'Success',
        `"${productName}" updated successfully!`,
        [
          {
            text: 'View Product',
            onPress: () => router.push(`vendor/product/${productId}`),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    }
  };

  const calculateDiscount = () => {
    if (!price || !discountPrice) return '0';
    const priceNum = Number(price);
    const discountNum = Number(discountPrice);
    if (priceNum <= 0 || discountNum <= 0) return '0';
    return ((priceNum - discountNum) / priceNum * 100).toFixed(1);
  };

  const discountPercentage = calculateDiscount();

  const isLoading = isLoadingProduct || isLoadingImages;
  const isUploadingOrDeleting = uploadImageMutation.isPending || deleteImageMutation.isPending || setPrimaryImageMutation.isPending;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-600 mt-4">Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productError || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-4">
          <Feather name="alert-circle" size={48} color="#ef4444" />
          <Text className="text-gray-900 font-bold text-lg mt-4">Product Not Found</Text>
          <Text className="text-gray-600 text-center mt-2">
            The product you're trying to edit could not be found.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-emerald-500 rounded-xl px-6 py-3 mt-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity className="p-2 -ml-2" onPress={handleGoBack}>
            <Feather name="chevron-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View className="flex-1 ml-2">
            <Text className="text-xl font-bold text-gray-900">Edit Product</Text>
            <Text className="text-xs text-gray-500 mt-0.5">#{product.sku}</Text>
          </View>
        </View>
        {hasUnsavedChanges() && (
          <View className="bg-orange-100 rounded-full px-3 py-1">
            <Text className="text-orange-700 text-xs font-semibold">Unsaved</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Product Images Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-600">PRODUCT IMAGES</Text>
            <Text className="text-xs text-gray-500">
              {productImages?.length || 0} image{productImages?.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Images Grid */}
          {productImages && productImages.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              <View className="flex-row gap-3">
                {productImages.map((image) => (
                  <View key={image.id} className="relative">
                    <View className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                      <Image
                        source={{ uri: image.image_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    
                    {/* Primary Badge */}
                    {image.is_primary && (
                      <View className="absolute top-1 left-1 bg-emerald-500 rounded px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">Primary</Text>
                      </View>
                    )}
                    
                    {/* Action Buttons */}
                    <View className="absolute top-1 right-1 flex-col gap-1">
                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(image.id, image.image_url)}
                        disabled={isUploadingOrDeleting}
                        className="bg-red-500 rounded-full p-1.5"
                      >
                        <Feather name="trash-2" size={10} color="#fff" />
                      </TouchableOpacity>
                      
                      {/* Set Primary Button */}
                      {!image.is_primary && (
                        <TouchableOpacity
                          onPress={() => handleSetPrimaryImage(image.id)}
                          disabled={isUploadingOrDeleting}
                          className="bg-blue-500 rounded-full p-1.5"
                        >
                          <Feather name="star" size={10} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Display Order */}
                    <View className="absolute bottom-1 left-1 bg-black/60 rounded px-2 py-0.5">
                      <Text className="text-white text-xs font-semibold">
                        #{image.display_order + 1}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center justify-center mb-3">
              <Feather name="image" size={32} color="#9ca3af" />
              <Text className="text-gray-900 font-semibold text-sm text-center mt-2">
                No images added
              </Text>
              <Text className="text-gray-600 text-xs text-center mt-1">
                Add images to showcase your product
              </Text>
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            onPress={handleUploadImage}
            disabled={isUploadingOrDeleting}
            className={`bg-emerald-50 border border-emerald-200 rounded-xl py-3 items-center justify-center flex-row gap-2 ${
              isUploadingOrDeleting ? 'opacity-50' : ''
            }`}
          >
            {uploadImageMutation.isPending ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <>
                <Feather name="upload" size={18} color="#059669" />
                <Text className="text-emerald-700 font-semibold text-sm">
                  Upload New Image
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Help Text */}
          <Text className="text-xs text-gray-500 mt-2 text-center">
            First image will be set as primary. Tap star icon to change primary image.
          </Text>
        </View>
        {/* Category Info (Read-only) */}
        <View className="bg-blue-50 mx-4 mt-4 rounded-2xl p-4 border border-blue-200">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="info" size={16} color="#2563eb" />
            <Text className="text-sm font-semibold text-blue-900">CATEGORY</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-sm text-blue-800">
              {product.categories?.name || 'Uncategorized'}
            </Text>
            {product.sub_categories?.name && (
              <>
                <Text className="text-sm text-blue-600">›</Text>
                <Text className="text-sm text-blue-800">
                  {product.sub_categories.name}
                </Text>
              </>
            )}
          </View>
          <Text className="text-xs text-blue-700 mt-2">
            Category cannot be changed after creation
          </Text>
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

          {/* Unit / Size */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Unit *</Text>
            <TextInput
              placeholder="e.g., kg, g, ml, pcs"
              value={unit}
              onChangeText={setUnit}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Short Description */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Short Description</Text>
            <TextInput
              placeholder="Brief description (optional)"
              value={shortDescription}
              onChangeText={setShortDescription}
              multiline
              numberOfLines={2}
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
              <Text className="text-sm font-semibold text-gray-700 mb-2">Regular Price (₹) *</Text>
              <TextInput
                placeholder="0"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Discount Price (₹)</Text>
              <TextInput
                placeholder="0"
                value={discountPrice}
                onChangeText={setDiscountPrice}
                keyboardType="decimal-pad"
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Discount Display */}
          {price && discountPrice && Number(discountPrice) < Number(price) && (
            <View className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-emerald-700 font-semibold text-sm">Discount</Text>
                <View className="bg-emerald-500 rounded-full px-3 py-1">
                  <Text className="text-white font-bold text-sm">{discountPercentage}%</Text>
                </View>
              </View>
              <Text className="text-emerald-700 text-xs mt-1">
                Customers save ₹{(Number(price) - Number(discountPrice)).toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Stock & Availability */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">STOCK & AVAILABILITY</Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</Text>
              <TextInput
                placeholder="0"
                value={stockQuantity}
                onChangeText={setStockQuantity}
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

          {/* Available Toggle */}
          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View>
              <Text className="text-gray-900 font-semibold text-sm">Available for Sale</Text>
              <Text className="text-gray-600 text-xs mt-1">
                {isAvailable ? 'Customers can order this product' : 'Product is hidden from customers'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={isAvailable ? '#059669' : '#6b7280'}
            />
          </View>
        </View>

        {/* Product Details */}
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
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Expiry Date */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Expiry Date / Shelf Life</Text>
            <TextInput
              placeholder="e.g., 2025-12-31 or 5 days"
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

        {/* Product Flags */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">PRODUCT BADGES</Text>

          {/* Vegetarian Toggle */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'}`}>
                <View className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
              </View>
              <Text className="text-gray-900 font-semibold text-sm">Vegetarian</Text>
            </View>
            <Switch
              value={isVeg}
              onValueChange={setIsVeg}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={isVeg ? '#059669' : '#6b7280'}
            />
          </View>

          {/* Organic Toggle */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <Feather name="award" size={18} color={isOrganic ? '#059669' : '#9ca3af'} />
              <Text className="text-gray-900 font-semibold text-sm">Organic</Text>
            </View>
            <Switch
              value={isOrganic}
              onValueChange={setIsOrganic}
              trackColor={{ false: '#d1d5db', true: '#10b981' }}
              thumbColor={isOrganic ? '#059669' : '#6b7280'}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-6" />
      </ScrollView>

      {/* Sticky Action Buttons */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleUpdateProduct}
          disabled={updateProductMutation.isPending || !hasUnsavedChanges()}
          activeOpacity={0.7}
          className={`w-full bg-emerald-500 rounded-xl py-4 items-center justify-center ${
            (updateProductMutation.isPending || !hasUnsavedChanges()) ? 'opacity-50' : ''
          }`}
        >
          {updateProductMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-bold text-base">
              {hasUnsavedChanges() ? 'Save Changes' : 'No Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}