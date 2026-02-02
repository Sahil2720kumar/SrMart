import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import useCartStore from '@/store/cartStore';
import useDiscountStore from '@/store/useDiscountStore';
import {
  useActiveCoupons,
  useValidateCoupon,
  calculateCouponDiscount,
} from '@/hooks/queries/orders';
import { Coupon } from '@/types/offers.types';

export default function DiscountCouponScreen() {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');

  const totalPrice = useCartStore((s) => s.totalPrice);
  const {
    discountAmount,
    activeDiscount,
    applyDiscount,
    removeDiscount,
  } = useDiscountStore();

  const { data: coupons, isLoading } = useActiveCoupons();
  const validateCoupon = useValidateCoupon();

  const finalAmount = Math.max(totalPrice - discountAmount, 0);

  const handleApplyCoupon = async (coupon: Coupon) => {
    try {
      const result = await validateCoupon.mutateAsync({
        couponCode: coupon.code,
        orderAmount: totalPrice,
      });

      // Apply to store
      applyDiscount(
        coupon.code,
        coupon.discount_type === 'percentage' ? 'percent' : 'flat',
        totalPrice,
        coupon.discount_value,
        coupon.max_discount_amount
      );

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to apply coupon');
    }
  };

  const handleManualApply = async () => {
    if (!couponCode.trim()) return;

    try {
      const result = await validateCoupon.mutateAsync({
        couponCode: couponCode,
        orderAmount: totalPrice,
      });

      const coupon = result.coupon;

      // Apply to store
      applyDiscount(
        coupon.code,
        coupon.discount_type === 'percentage' ? 'percent' : 'flat',
        totalPrice,
        coupon.discount_value,
        coupon.max_discount_amount
      );

      setError('');
      setCouponCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid coupon code');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDiscountLabel = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'flat') {
      return `₹${coupon.discount_value} OFF`;
    }
    return 'FREE SHIPPING';
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Apply Coupon',
          headerStyle: { backgroundColor: '#fff' },
        }} 
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Manual Coupon Entry */}
        <View className="bg-white px-4 py-5 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Enter Coupon Code</Text>
          
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Feather name="tag" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder="Enter code here"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text.toUpperCase());
                  setError('');
                }}
                autoCapitalize="characters"
                placeholderTextColor="#9ca3af"
              />
              {couponCode.length > 0 && (
                <TouchableOpacity onPress={() => setCouponCode('')}>
                  <Feather name="x-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity
              onPress={handleManualApply}
              disabled={couponCode.length === 0 || validateCoupon.isPending}
              className={`px-6 py-3.5 rounded-xl ${
                couponCode.length > 0 && !validateCoupon.isPending
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            >
              {validateCoupon.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  className={`font-semibold ${
                    couponCode.length > 0 ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Apply
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {error.length > 0 && (
            <View className="flex-row items-center mt-2">
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-500 text-sm ml-1">{error}</Text>
            </View>
          )}
        </View>

        {/* Available Coupons */}
        <View className="px-4 py-5 bg-white mt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-gray-900">Available Coupons</Text>
            {coupons && coupons.length > 0 && (
              <View className="bg-green-50 px-3 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-semibold">
                  {coupons.length} Offers
                </Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#22c55e" />
              <Text className="text-gray-500 text-sm mt-2">Loading coupons...</Text>
            </View>
          ) : coupons && coupons.length > 0 ? (
            <View className="gap-3">
              {coupons.map((coupon) => {
                const isSelected = activeDiscount?.code === coupon.code;
                const isEligible = totalPrice >= coupon.min_order_amount;
                const discount = calculateCouponDiscount(coupon, totalPrice);
                const remainingUses = coupon.usage_limit
                  ? coupon.usage_limit - coupon.usage_count
                  : null;

                return (
                  <View
                    key={coupon.id}
                    className={`border rounded-2xl overflow-hidden ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Coupon Header with Discount Badge */}
                    <View className="flex-row items-start p-4">
                      <View
                        className={`w-14 h-14 rounded-xl items-center justify-center ${
                          coupon.discount_type === 'percentage'
                            ? 'bg-purple-100'
                            : coupon.discount_type === 'flat'
                            ? 'bg-blue-100'
                            : 'bg-orange-100'
                        }`}
                      >
                        <Feather
                          name={
                            coupon.discount_type === 'percentage'
                              ? 'percent'
                              : coupon.discount_type === 'flat'
                              ? 'tag'
                              : 'truck'
                          }
                          size={24}
                          color={
                            coupon.discount_type === 'percentage'
                              ? '#9333ea'
                              : coupon.discount_type === 'flat'
                              ? '#2563eb'
                              : '#ea580c'
                          }
                        />
                      </View>

                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-base font-bold text-gray-900 flex-1">
                            {getDiscountLabel(coupon)}
                          </Text>
                          {remainingUses && remainingUses < 10 && (
                            <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                              <Text className="text-orange-700 text-xs font-semibold">
                                {remainingUses} left
                              </Text>
                            </View>
                          )}
                        </View>

                        {coupon.description && (
                          <Text className="text-sm text-gray-600 mt-0.5 mb-2">
                            {coupon.description}
                          </Text>
                        )}

                        <View className="flex-row items-center mt-2 flex-wrap gap-2">
                          <View
                            className={`px-2.5 py-1 rounded-md ${
                              coupon.discount_type === 'percentage'
                                ? 'bg-purple-100'
                                : coupon.discount_type === 'flat'
                                ? 'bg-blue-100'
                                : 'bg-orange-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                coupon.discount_type === 'percentage'
                                  ? 'text-purple-700'
                                  : coupon.discount_type === 'flat'
                                  ? 'text-blue-700'
                                  : 'text-orange-700'
                              }`}
                            >
                              {coupon.code}
                            </Text>
                          </View>

                          <View className="flex-row items-center">
                            <Feather name="clock" size={12} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 ml-1">
                              Valid till {formatDate(coupon.end_date)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Discount Amount & Apply Button */}
                    <View
                      className={`flex-row items-center justify-between px-4 py-3 border-t ${
                        isSelected
                          ? 'border-green-200 bg-green-100'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Text className="text-sm text-gray-600">You save: </Text>
                        <Text className="text-base font-bold text-green-600">
                          ₹{discount.toFixed(2)}
                        </Text>
                      </View>

                      {isEligible ? (
                        <TouchableOpacity
                          onPress={() => {
                            if (isSelected) {
                              removeDiscount();
                            } else {
                              handleApplyCoupon(coupon);
                            }
                          }}
                          disabled={validateCoupon.isPending}
                          className={`px-5 py-2 rounded-full ${
                            isSelected ? 'bg-green-600' : 'bg-green-500'
                          }`}
                        >
                          <View className="flex-row items-center">
                            {validateCoupon.isPending ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                {isSelected && (
                                  <Feather name="check" size={14} color="white" />
                                )}
                                <Text
                                  className={`text-white font-semibold text-sm ${
                                    isSelected ? 'ml-1' : ''
                                  }`}
                                >
                                  {isSelected ? 'Applied' : 'Apply'}
                                </Text>
                              </>
                            )}
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <View className="bg-red-50 px-3 py-1.5 rounded-full">
                          <Text className="text-red-600 text-xs font-medium">
                            Add ₹{(coupon.min_order_amount - totalPrice).toFixed(0)} more
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Terms */}
                    <View className="px-4 pb-3">
                      <View className="flex-row items-start">
                        <Feather name="info" size={12} color="#9ca3af" className="mt-0.5" />
                        <Text className="text-xs text-gray-500 ml-1.5">
                          Minimum order value: ₹{coupon.min_order_amount}
                          {coupon.max_discount_amount &&
                            ` • Maximum discount: ₹${coupon.max_discount_amount}`}
                          {coupon.applicable_to !== 'all' &&
                            ` • Applicable to: ${coupon.applicable_to}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="py-12 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Feather name="tag" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 text-base font-semibold mb-1">
                No Coupons Available
              </Text>
              <Text className="text-gray-500 text-sm text-center px-8">
                Check back later for exciting offers
              </Text>
            </View>
          )}
        </View>

        {/* Cart Summary */}
        <View className="bg-white px-4 py-5 mt-2">
          <Text className="text-base font-bold text-gray-900 mb-4">Price Summary</Text>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Cart Total</Text>
            <Text className="text-gray-900 font-semibold">₹{totalPrice.toFixed(2)}</Text>
          </View>

          {activeDiscount && (
            <>
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <Text className="text-green-600">Discount Applied</Text>
                  <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                    <Text className="text-green-700 text-xs font-semibold">
                      {activeDiscount.code}
                    </Text>
                  </View>
                </View>
                <Text className="text-green-600 font-semibold">
                  -₹{discountAmount.toFixed(2)}
                </Text>
              </View>
              <View className="h-px bg-gray-200 my-3" />
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-bold text-gray-900">Final Amount</Text>
                <Text className="text-base font-bold text-green-600">
                  ₹{finalAmount.toFixed(2)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Tips Section */}
        <View className="px-4 py-5 bg-white mt-2">
          <View className="flex-row items-center mb-3">
            <Feather name="gift" size={18} color="#16a34a" />
            <Text className="text-sm font-bold text-gray-900 ml-2">Coupon Tips</Text>
          </View>

          <View className="bg-green-50 rounded-xl p-3 mb-2">
            <View className="flex-row items-start">
              <Feather name="check-circle" size={14} color="#16a34a" className="mt-0.5" />
              <Text className="text-xs text-gray-700 ml-2 flex-1">
                Save more by combining offers on eligible products
              </Text>
            </View>
          </View>

          <View className="bg-blue-50 rounded-xl p-3">
            <View className="flex-row items-start">
              <Feather name="info" size={14} color="#2563eb" className="mt-0.5" />
              <Text className="text-xs text-gray-700 ml-2 flex-1">
                Only one coupon can be applied per order
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      {activeDiscount && (
        <View className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center bg-green-500 rounded-full px-6 py-4 justify-center"
          >
            <Feather name="check-circle" size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Continue with {activeDiscount.code}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}