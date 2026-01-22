import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import useCartStore from '@/store/cartStore';
import useDiscountStore from '@/store/useDiscountStore';

// Available coupons data
const availableCoupons = [
  {
    code: 'WELCOME20',
    title: 'Welcome Offer',
    description: 'Get 20% off on your first order',
    type: 'percent' as const,
    value: 20,
    maxDiscount: 100,
    minOrder: 299,
    validUntil: '2026-02-28',
  },
  {
    code: 'SAVE50',
    title: 'Flat Discount',
    description: 'Save ₹50 on orders above ₹250',
    type: 'flat' as const,
    value: 50,
    minOrder: 250,
    validUntil: '2026-01-31',
  },
  {
    code: 'MEGA30',
    title: 'Mega Sale',
    description: 'Get 30% off up to ₹150',
    type: 'percent' as const,
    value: 30,
    maxDiscount: 150,
    minOrder: 500,
    validUntil: '2026-03-15',
  },
  {
    code: 'FLAT100',
    title: 'Super Saver',
    description: 'Flat ₹100 off on orders above ₹400',
    type: 'flat' as const,
    value: 100,
    minOrder: 400,
    validUntil: '2026-02-15',
  },
  {
    code: 'FRESH15',
    title: 'Fresh Start',
    description: '15% off on all fresh products',
    type: 'percent' as const,
    value: 15,
    maxDiscount: 80,
    minOrder: 200,
    validUntil: '2026-02-20',
  },
];

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

  const finalAmount = Math.max(totalPrice - discountAmount, 0);

  const handleApplyCoupon = (
    code: string, 
    type: 'percent' | 'flat', 
    value: number, 
    maxDiscount?: number, 
    minOrder?: number
  ) => {
    if (minOrder && totalPrice < minOrder) {
      setError(`Minimum order of ₹${minOrder} required`);
      return;
    }

    applyDiscount(code, type, totalPrice, value, maxDiscount);
    setError('');
  };

  const handleManualApply = () => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    
    if (!coupon) {
      setError('Invalid coupon code');
      return;
    }

    handleApplyCoupon(coupon.code, coupon.type, coupon.value, coupon.maxDiscount, coupon.minOrder);
    setCouponCode('');
  };

  const calculateDiscount = (type: 'percent' | 'flat', value: number, maxDiscount?: number) => {
    if (type === 'percent') {
      const discount = (totalPrice * value) / 100;
      return maxDiscount ? Math.min(discount, maxDiscount) : discount;
    }
    return value;
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
              disabled={couponCode.length === 0}
              className={`px-6 py-3.5 rounded-xl ${couponCode.length > 0 ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <Text className={`font-semibold ${couponCode.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                Apply
              </Text>
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
            <View className="bg-green-50 px-3 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">{availableCoupons.length} Offers</Text>
            </View>
          </View>

          <View className="gap-3">
            {availableCoupons.map((coupon) => {
              const isSelected = activeDiscount?.code === coupon.code;
              const isEligible = totalPrice >= coupon.minOrder;
              const discount = calculateDiscount(coupon.type, coupon.value, coupon.maxDiscount);

              return (
                <View
                  key={coupon.code}
                  className={`border rounded-2xl overflow-hidden ${
                    isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Coupon Header with Discount Badge */}
                  <View className="flex-row items-start p-4">
                    <View className={`w-14 h-14 rounded-xl items-center justify-center ${
                      coupon.type === 'percent' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <Feather 
                        name={coupon.type === 'percent' ? 'percent' : 'tag'} 
                        size={24} 
                        color={coupon.type === 'percent' ? '#9333ea' : '#2563eb'} 
                      />
                    </View>

                    <View className="flex-1 ml-3">
                      <Text className="text-base font-bold text-gray-900">{coupon.title}</Text>
                      <Text className="text-sm text-gray-600 mt-0.5">{coupon.description}</Text>
                      
                      <View className="flex-row items-center mt-2 flex-wrap">
                        <View className={`px-2.5 py-1 rounded-md ${
                          coupon.type === 'percent' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <Text className={`text-xs font-bold ${
                            coupon.type === 'percent' ? 'text-purple-700' : 'text-blue-700'
                          }`}>
                            {coupon.code}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center ml-2">
                          <Feather name="clock" size={12} color="#9ca3af" />
                          <Text className="text-xs text-gray-500 ml-1">
                            Valid till {new Date(coupon.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Discount Amount & Apply Button */}
                  <View className={`flex-row items-center justify-between px-4 py-3 border-t ${
                    isSelected ? 'border-green-200 bg-green-100' : 'border-gray-100 bg-gray-50'
                  }`}>
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
                            handleApplyCoupon(coupon.code, coupon.type, coupon.value, coupon.maxDiscount, coupon.minOrder);
                          }
                        }}
                        className={`px-5 py-2 rounded-full ${
                          isSelected ? 'bg-green-600' : 'bg-green-500'
                        }`}
                      >
                        <View className="flex-row items-center">
                          {isSelected && <Feather name="check" size={14} color="white" />}
                          <Text className={`text-white font-semibold text-sm ${isSelected ? 'ml-1' : ''}`}>
                            {isSelected ? 'Applied' : 'Apply'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View className="bg-red-50 px-3 py-1.5 rounded-full">
                        <Text className="text-red-600 text-xs font-medium">
                          Add ₹{(coupon.minOrder - totalPrice).toFixed(0)} more
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Terms */}
                  <View className="px-4 pb-3">
                    <View className="flex-row items-start">
                      <Feather name="info" size={12} color="#9ca3af" className="mt-0.5" />
                      <Text className="text-xs text-gray-500 ml-1.5">
                        Minimum order value: ₹{coupon.minOrder}
                        {coupon.maxDiscount && ` • Maximum discount: ₹${coupon.maxDiscount}`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
                    <Text className="text-green-700 text-xs font-semibold">{activeDiscount.code}</Text>
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