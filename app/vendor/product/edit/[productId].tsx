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
  ActivityIndicator,
  Switch,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

// ---------------------------------------------------------------------------
// Reusable Confirm Modal
// ---------------------------------------------------------------------------
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmStyle?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmStyle = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const confirmBg =
    confirmStyle === 'danger'
      ? 'bg-red-500'
      : confirmStyle === 'warning'
      ? 'bg-orange-500'
      : 'bg-emerald-500';

  const accentBg =
    confirmStyle === 'danger'
      ? 'bg-red-500'
      : confirmStyle === 'warning'
      ? 'bg-orange-500'
      : 'bg-emerald-500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 bg-black/50 items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
          <View className={`h-1 w-full ${accentBg}`} />
          <View className="p-6">
            <Text className="text-gray-900 text-lg font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm leading-6">{message}</Text>
          </View>
          <View className="flex-row border-t border-gray-100">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 py-4 items-center border-r border-gray-100"
            >
              <Text className="text-gray-600 font-semibold text-sm">{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 items-center ${confirmBg} ${loading ? 'opacity-60' : ''}`}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductDetailsByVendorIdAndProductId(productId);

  const { data: productImages, isLoading: isLoadingImages } =
    useProductImagesByProductId(productId);

  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const deleteImageMutation = useDeleteProductImage();
  const setPrimaryImageMutation = useSetPrimaryImage();

  // Form state
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

  // Modal state
  const [goBackModalVisible, setGoBackModalVisible] = useState(false);
  const [deleteImageModalVisible, setDeleteImageModalVisible] = useState(false);
  const [deleteImageTarget, setDeleteImageTarget] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
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
    if (discountPrice && Number(discountPrice) <= 0)
      errors.push('Discount price must be greater than 0');
    if (discountPrice && Number(discountPrice) > Number(price))
      errors.push('Discount price cannot exceed regular price');
    if (Number(stockQuantity) < 0) errors.push('Stock cannot be negative');
    if (lowStockThreshold && Number(lowStockThreshold) < 0)
      errors.push('Low stock threshold cannot be negative');
    return errors;
  };

  const calculateDiscount = () => {
    if (!price || !discountPrice) return '0';
    const p = Number(price);
    const d = Number(discountPrice);
    if (p <= 0 || d <= 0) return '0';
    return ((p - d) / p * 100).toFixed(1);
  };

  const discountPercentage = calculateDiscount();
  const isLoading = isLoadingProduct || isLoadingImages;
  const isUploadingOrDeleting =
    uploadImageMutation.isPending ||
    deleteImageMutation.isPending ||
    setPrimaryImageMutation.isPending;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleGoBack = () => {
    if (hasUnsavedChanges()) {
      setGoBackModalVisible(true);
    } else {
      router.back();
    }
  };

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please grant camera roll permissions to upload images.',
        position: 'top',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'], 
        allowsMultipleSelection: false, 
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, 
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImageMutation.mutateAsync({
          productId,
          imageUri: result.assets[0].uri,
          isPrimary: !productImages || productImages.length === 0,
        });
        Toast.show({
          type: 'success',
          text1: 'Image Uploaded',
          text2: 'Image uploaded successfully.',
          position: 'top',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: 'Failed to upload image. Please try again.',
        position: 'top',
      });
    }
  };

  const handleDeleteImage = (imageId: string, imageUrl: string) => {
    setDeleteImageTarget({ id: imageId, url: imageUrl });
    setDeleteImageModalVisible(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (!deleteImageTarget) return;
    try {
      await deleteImageMutation.mutateAsync({
        productId,
        imageId: deleteImageTarget.id,
        imageUrl: deleteImageTarget.url,
      });
      setDeleteImageModalVisible(false);
      setDeleteImageTarget(null);
      Toast.show({
        type: 'success',
        text1: 'Image Deleted',
        text2: 'Image removed successfully.',
        position: 'top',
      });
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteImageModalVisible(false);
      setDeleteImageTarget(null);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Failed to delete image.',
        position: 'top',
      });
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      await setPrimaryImageMutation.mutateAsync({ productId, imageId });
      Toast.show({
        type: 'success',
        text1: 'Primary Image Updated',
        position: 'top',
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error('Set primary error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to set primary image.',
        position: 'top',
      });
    }
  };

  const handleUpdateProduct = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: errors[0],
        position: 'top',
        visibilityTime: 4000,
      });
      return;
    }
    setSaveModalVisible(true);
  };

  const handleConfirmUpdate = async () => {
    setSaveModalVisible(false);
    try {
      await updateProductMutation.mutateAsync({
        productId,
        updates: {
          name: productName.trim(),
          unit: unit.trim(),
          price: Number(price),
          discount_price: Number(discountPrice),
          stock_quantity: Number(stockQuantity),
          low_stock_threshold: lowStockThreshold ? Number(lowStockThreshold) : 10,
          is_available: isAvailable,
          description: description.trim(),
          short_description: shortDescription.trim() || '',
          expiry_date: expiryDate.trim() || '',
          barcode: barcode.trim() || '',
          is_organic: isOrganic,
          is_veg: isVeg,
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Product Updated',
        text2: `"${productName}" saved successfully.`,
        position: 'top',
        visibilityTime: 3000,
      });

      setTimeout(() => router.push(`vendor/product/${productId}`), 1000);
    } catch (error) {
      console.error('Update error:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update product. Please try again.',
        position: 'top',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* ── Header ── */}
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
        {/* ── Product Images ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-600">PRODUCT IMAGES</Text>
            <Text className="text-xs text-gray-500">
              {productImages?.length || 0} image{productImages?.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {productImages && productImages.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
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

                    {image.is_primary && (
                      <View className="absolute top-1 left-1 bg-emerald-500 rounded px-2 py-0.5">
                        <Text className="text-white text-xs font-bold">Primary</Text>
                      </View>
                    )}

                    <View className="absolute top-1 right-1 flex-col gap-1">
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(image.id, image.image_url)}
                        disabled={isUploadingOrDeleting}
                        className="bg-red-500 rounded-full p-1.5"
                      >
                        <Feather name="trash-2" size={10} color="#fff" />
                      </TouchableOpacity>
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
                <Text className="text-emerald-700 font-semibold text-sm">Upload New Image</Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 mt-2 text-center">
            First image will be set as primary. Tap star icon to change primary image.
          </Text>
        </View>

        {/* ── Category (read-only) ── */}
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
                <Text className="text-sm text-blue-800">{product.sub_categories.name}</Text>
              </>
            )}
          </View>
          <Text className="text-xs text-blue-700 mt-2">
            Category cannot be changed after creation
          </Text>
        </View>

        {/* ── Basic Information ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">BASIC INFORMATION</Text>

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

        {/* ── Pricing ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">PRICING</Text>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Regular Price (₹) *
              </Text>
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
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Discount Price (₹)
              </Text>
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

        {/* ── Stock & Availability ── */}
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

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View>
              <Text className="text-gray-900 font-semibold text-sm">Available for Sale</Text>
              <Text className="text-gray-600 text-xs mt-1">
                {isAvailable
                  ? 'Customers can order this product'
                  : 'Product is hidden from customers'}
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

        {/* ── Product Details ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">PRODUCT DETAILS</Text>

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

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Expiry Date / Shelf Life
            </Text>
            <TextInput
              placeholder="e.g., 2025-12-31 or 5 days"
              value={expiryDate}
              onChangeText={setExpiryDate}
              className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-sm"
              placeholderTextColor="#9ca3af"
            />
          </View>

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

        {/* ── Product Badges ── */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-gray-100">
          <Text className="text-sm font-semibold text-gray-600 mb-4">PRODUCT BADGES</Text>

          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <View
                className={`w-5 h-5 rounded border-2 items-center justify-center ${
                  isVeg ? 'border-green-600 bg-green-50' : 'border-red-600 bg-red-50'
                }`}
              >
                <View
                  className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}
                />
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

        <View className="h-6" />
      </ScrollView>

      {/* ── Sticky Save Button ── */}
      <View className="bg-white px-4 py-4 border-t border-gray-200">
        <TouchableOpacity
          onPress={handleUpdateProduct}
          disabled={updateProductMutation.isPending || !hasUnsavedChanges()}
          activeOpacity={0.7}
          className={`w-full bg-emerald-500 rounded-xl py-4 items-center justify-center ${
            updateProductMutation.isPending || !hasUnsavedChanges() ? 'opacity-50' : ''
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

      {/* ── Go Back Modal ── */}
      <ConfirmModal
        visible={goBackModalVisible}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to go back? Your changes will be lost."
        confirmLabel="Discard"
        cancelLabel="Stay"
        confirmStyle="danger"
        onConfirm={() => {
          setGoBackModalVisible(false);
          router.back();
        }}
        onCancel={() => setGoBackModalVisible(false)}
      />

      {/* ── Delete Image Modal ── */}
      <ConfirmModal
        visible={deleteImageModalVisible}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteImageMutation.isPending}
        onConfirm={handleConfirmDeleteImage}
        onCancel={() => {
          setDeleteImageModalVisible(false);
          setDeleteImageTarget(null);
        }}
      />

      {/* ── Save Changes Modal ── */}
      <ConfirmModal
        visible={saveModalVisible}
        title="Save Changes?"
        message={`Update "${productName}"? The product will be re-verified if pricing or stock details have changed.`}
        confirmLabel="Save"
        confirmStyle="primary"
        loading={updateProductMutation.isPending}
        onConfirm={handleConfirmUpdate}
        onCancel={() => setSaveModalVisible(false)}
      />
    </SafeAreaView>
  );
}