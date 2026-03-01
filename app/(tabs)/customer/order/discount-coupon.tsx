import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import useCartStore from '@/store/cartStore';
import useDiscountStore from '@/store/useDiscountStore';
import {
  useActiveCoupons,
  useValidateCoupon,
  useMyAllCouponUsage,
  calculateCouponDiscount,
} from '@/hooks/queries/orders';
import { useFilteredCoupons } from '@/hooks/queries/Usefilteredcoupons';
import { Coupon } from '@/types/offers.types';
import { useCustomerAddresses } from '@/hooks/queries';
import { useDeliveryFees } from '@/hooks/usedeliveryfees';

export default function DiscountCouponScreen() {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');

  const { data: addresses = [] } = useCustomerAddresses();
  const [selectedAddress, setSelectedAddress] = useState(
    addresses.find((a) => a.is_default) || addresses[0],
  );
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses.find((a) => a.is_default) || addresses[0]);
    }
  }, [addresses]);

  const cartItems = useCartStore((s) => s.cartItems);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const { discountAmount, activeDiscount, applyDiscount, removeDiscount } = useDiscountStore();

  // Read syncing flag directly from store — layout already runs the sync
  const isSyncingPrices = useCartStore((s) => s.isSyncingPrices);

  const { totalDeliveryFee } = useDeliveryFees({
    subtotal: totalPrice,
    selectedAddress,
    hasFreeDelivery: activeDiscount?.includes_free_delivery || false,
    freeDeliveryMinimum: 499,
  });

  const { data: coupons, isLoading } = useActiveCoupons();
  const { data: myUsageMap = {}, isLoading: isLoadingUsage } = useMyAllCouponUsage();
  const validateCoupon = useValidateCoupon();

  const { filterCoupons, loadingCategories } = useFilteredCoupons(
    cartItems,
    totalPrice,
    calculateCouponDiscount,
  );
  const { eligible: eligibleCoupons, ineligible: ineligibleCoupons } = filterCoupons(coupons);

  const eligibleWithinLimit = eligibleCoupons.filter(({ coupon }) => {
    const used = myUsageMap[coupon.id] ?? 0;
    const limit = coupon.usage_limit_per_user ?? 1;
    return used < limit;
  });

  const limitExceededCoupons = eligibleCoupons.filter(({ coupon }) => {
    const used = myUsageMap[coupon.id] ?? 0;
    const limit = coupon.usage_limit_per_user ?? 1;
    return used >= limit;
  });

  const finalAmount = Math.max(totalPrice - discountAmount, 0);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getDiscountLabel = (coupon: Coupon) => {
    if (coupon.includes_free_delivery && coupon.discount_value > 0) {
      return coupon.discount_type === 'percentage'
        ? `FREE DELIVERY + ${coupon.discount_value}% OFF`
        : `FREE DELIVERY + ₹${coupon.discount_value} OFF`;
    }
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}% OFF`;
    if (coupon.discount_type === 'flat' && coupon.discount_value > 0) return `₹${coupon.discount_value} OFF`;
    if (coupon.includes_free_delivery) return 'FREE DELIVERY';
    return 'FREE SHIPPING';
  };

  const getCouponStyle = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage')
      return { icon: 'percent' as const, color: '#9333ea', bg: 'bg-purple-100', text: 'text-purple-700' };
    if (coupon.discount_type === 'flat')
      return { icon: 'tag' as const, color: '#2563eb', bg: 'bg-blue-100', text: 'text-blue-700' };
    return { icon: 'truck' as const, color: '#ea580c', bg: 'bg-orange-100', text: 'text-orange-700' };
  };

  // ─── Apply handlers ───────────────────────────────────────────────────────
  const handleApplyCoupon = async (coupon: Coupon) => {
    try {
      setError('');
      await validateCoupon.mutateAsync({ couponCode: coupon.code, orderAmount: totalPrice });
      applyDiscount(
        coupon.id,
        coupon.code,
        coupon.discount_type === 'percentage' ? 'percent' : 'flat',
        totalPrice,
        coupon.discount_value,
        coupon.max_discount_amount,
        coupon.min_order_amount,
        coupon.applicable_to as any,
        coupon.applicable_id,
        coupon.includes_free_delivery,
      );
    } catch (err: any) {
      setError(err.message || 'Failed to apply coupon');
    }
  };

  const handleManualApply = async () => {
    if (!couponCode.trim()) return;
    try {
      setError('');
      const result = await validateCoupon.mutateAsync({ couponCode, orderAmount: totalPrice });
      const coupon = result.coupon;
      applyDiscount(
        coupon.id,
        coupon.code,
        coupon.discount_type === 'percentage' ? 'percent' : 'flat',
        totalPrice,
        coupon.discount_value,
        coupon.max_discount_amount,
        coupon.min_order_amount,
        coupon.applicable_to as any,
        coupon.applicable_id,
        coupon.includes_free_delivery,
      );
      setCouponCode('');
    } catch (err: any) {
      setError(err.message || 'Invalid coupon code');
    }
  };

  // ─── Card renderers ───────────────────────────────────────────────────────
  const renderEligibleCard = (coupon: Coupon, discount: number) => {
    const isSelected = activeDiscount?.code === coupon.code;
    const remainingUses = coupon.usage_limit != null ? coupon.usage_limit - (coupon.usage_count ?? 0) : null;
    const { icon, color, bg, text } = getCouponStyle(coupon);

    return (
      <View
        key={coupon.id}
        className={`border rounded-2xl overflow-hidden ${
          isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
        }`}
      >
        <View className="flex-row items-start p-4">
          <View className={`w-14 h-14 rounded-xl items-center justify-center ${bg}`}>
            <Feather name={icon} size={24} color={color} />
          </View>
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-bold text-gray-900 flex-1">{getDiscountLabel(coupon)}</Text>
              {remainingUses != null && remainingUses < 10 && (
                <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                  <Text className="text-orange-700 text-xs font-semibold">{remainingUses} left</Text>
                </View>
              )}
            </View>
            {coupon.description && (
              <Text className="text-sm text-gray-600 mt-0.5 mb-2">{coupon.description}</Text>
            )}
            <View className="flex-row items-center mt-2 flex-wrap gap-2">
              <View className={`px-2.5 py-1 rounded-md ${bg}`}>
                <Text className={`text-xs font-bold ${text}`}>{coupon.code}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="clock" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500 ml-1">Valid till {formatDate(coupon.end_date)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={`flex-row items-center justify-between px-4 py-3 border-t ${
          isSelected ? 'border-green-200 bg-green-100' : 'border-gray-100 bg-gray-50'
        }`}>
          <View className="flex-row items-center">
            <Text className="text-sm text-gray-600">You save: </Text>
            <Text className="text-base font-bold text-green-600">
              ₹{discount > 1 ? discount.toFixed(2) : (totalDeliveryFee + discount).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => (isSelected ? removeDiscount() : handleApplyCoupon(coupon))}
            disabled={validateCoupon.isPending}
            className={`px-5 py-2 rounded-full ${isSelected ? 'bg-green-600' : 'bg-green-500'}`}
          >
            <View className="flex-row items-center">
              {validateCoupon.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  {isSelected && <Feather name="check" size={14} color="white" />}
                  <Text className={`text-white font-semibold text-sm ${isSelected ? 'ml-1' : ''}`}>
                    {isSelected ? 'Applied' : 'Apply'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-4 pb-3 pt-2">
          <View className="flex-row items-start">
            <Feather name="info" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-500 ml-1.5">
              Min order: ₹{coupon.min_order_amount ?? 0}
              {coupon.max_discount_amount != null && ` • Max discount: ₹${coupon.max_discount_amount}`}
              {(coupon.usage_limit_per_user ?? 1) > 1 && ` • ${coupon.usage_limit_per_user} uses per user`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLimitExceededCard = (coupon: Coupon) => {
    const used = myUsageMap[coupon.id] ?? 0;
    const limit = coupon.usage_limit_per_user ?? 1;
    const { icon } = getCouponStyle(coupon);

    return (
      <View key={coupon.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 opacity-80">
        <View className="flex-row items-start p-4">
          <View className="w-14 h-14 rounded-xl items-center justify-center bg-gray-100">
            <Feather name={icon} size={24} color="#9ca3af" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-500 mb-1">{getDiscountLabel(coupon)}</Text>
            {coupon.description && (
              <Text className="text-sm text-gray-400 mb-2">{coupon.description}</Text>
            )}
            <View className="flex-row items-center gap-2">
              <View className="px-2.5 py-1 rounded-md bg-gray-200">
                <Text className="text-xs font-bold text-gray-500">{coupon.code}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="clock" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400 ml-1">Valid till {formatDate(coupon.end_date)}</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-xl px-3 py-3">
          <View className="flex-row items-center mb-1">
            <Feather name="slash" size={14} color="#dc2626" />
            <Text className="text-red-700 text-sm font-bold ml-2">Usage Limit Reached</Text>
          </View>
          <Text className="text-red-600 text-xs ml-5">
            {limit === 1
              ? "You've already used this coupon. Each customer can use it only once."
              : `You've used this coupon ${used}/${limit} times. No uses remaining.`}
          </Text>
        </View>
      </View>
    );
  };

  const renderIneligibleCard = (
    coupon: Coupon,
    discount: number,
    reason: string,
    conflictingItems?: Array<{ id: string; name: string }>,
  ) => {
    const { icon } = getCouponStyle(coupon);

    return (
      <View key={coupon.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 opacity-75">
        <View className="flex-row items-start p-4">
          <View className="w-14 h-14 rounded-xl items-center justify-center bg-gray-100">
            <Feather name={icon} size={24} color="#9ca3af" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-bold text-gray-600 mb-1">{getDiscountLabel(coupon)}</Text>
            {coupon.description && (
              <Text className="text-sm text-gray-500 mb-2">{coupon.description}</Text>
            )}
            <View className="flex-row items-center gap-2 flex-wrap">
              <View className="px-2.5 py-1 rounded-md bg-gray-200">
                <Text className="text-xs font-bold text-gray-600">{coupon.code}</Text>
              </View>
              <View className="flex-row items-center">
                <Feather name="clock" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-500 ml-1">Valid till {formatDate(coupon.end_date)}</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <View className="flex-row items-start">
            <Feather name="alert-circle" size={14} color="#f59e0b" />
            <Text className="text-amber-700 text-sm font-medium ml-2 flex-1">{reason}</Text>
          </View>
          {conflictingItems && conflictingItems.length > 0 && (
            <View className="mt-2 bg-white rounded-lg p-2">
              <Text className="text-xs text-amber-600 font-semibold mb-1">Remove these items to apply:</Text>
              {conflictingItems.map((item) => (
                <View key={item.id} className="flex-row items-center mt-1">
                  <Feather name="x" size={12} color="#f59e0b" />
                  <Text className="text-xs text-amber-700 ml-1 flex-1" numberOfLines={1}>{item.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View className="px-4 pb-3 pt-2">
          <View className="flex-row items-start">
            <Feather name="info" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-500 ml-1.5">
              Min order: ₹{coupon.min_order_amount ?? 0}
              {coupon.max_discount_amount != null && ` • Max discount: ₹${coupon.max_discount_amount}`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const isPageLoading = isLoading || loadingCategories || isLoadingUsage || isSyncingPrices;

  // ─── Render ───────────────────────────────────────────────────────────────
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
        {/* Manual entry */}
        <View className="bg-white px-4 py-5 mb-2">
          <Text className="text-base font-bold text-gray-900 mb-3">Enter Coupon Code</Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Feather name="tag" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-base text-gray-900"
                placeholder="Enter code here"
                value={couponCode}
                onChangeText={(t) => { setCouponCode(t.toUpperCase()); setError(''); }}
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
                couponCode.length > 0 && !validateCoupon.isPending ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              {validateCoupon.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className={`font-semibold ${couponCode.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                  Apply
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {error.length > 0 && (
            <View className="flex-row items-center mt-2 bg-red-50 px-3 py-2 rounded-lg">
              <Feather name="alert-circle" size={14} color="#ef4444" />
              <Text className="text-red-600 text-sm ml-1.5 flex-1">{error}</Text>
            </View>
          )}
        </View>

        {/* Available coupons */}
        <View className="px-4 py-5 bg-white mt-2">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-gray-900">Available Coupons</Text>
            {eligibleWithinLimit.length > 0 && (
              <View className="bg-green-50 px-3 py-1 rounded-full">
                <Text className="text-green-600 text-xs font-semibold">{eligibleWithinLimit.length} Applicable</Text>
              </View>
            )}
          </View>

          {isPageLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#22c55e" />
              <Text className="text-gray-500 text-sm mt-2">Loading coupons...</Text>
            </View>
          ) : eligibleWithinLimit.length > 0 ? (
            <View className="gap-3">
              {eligibleWithinLimit.map(({ coupon, discount }) => renderEligibleCard(coupon, discount))}
            </View>
          ) : (
            <View className="py-12 items-center justify-center">
              <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Feather name="tag" size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 text-base font-semibold mb-1">No Eligible Coupons</Text>
              <Text className="text-gray-500 text-sm text-center px-8">
                {limitExceededCoupons.length > 0 || ineligibleCoupons.length > 0
                  ? 'Check sections below for details'
                  : 'Check back later for exciting offers'}
              </Text>
            </View>
          )}
        </View>

        {/* Already used */}
        {!isPageLoading && limitExceededCoupons.length > 0 && (
          <View className="px-4 py-5 bg-white mt-2">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">Already Used</Text>
              <View className="bg-red-50 px-3 py-1 rounded-full">
                <Text className="text-red-500 text-xs font-semibold">
                  {limitExceededCoupons.length} Coupon{limitExceededCoupons.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View className="gap-3">
              {limitExceededCoupons.map(({ coupon }) => renderLimitExceededCard(coupon))}
            </View>
          </View>
        )}

        {/* Not eligible yet */}
        {!isPageLoading && ineligibleCoupons.length > 0 && (
          <View className="px-4 py-5 bg-white mt-2">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-bold text-gray-900">Not Eligible Yet</Text>
              <View className="bg-amber-50 px-3 py-1 rounded-full">
                <Text className="text-amber-600 text-xs font-semibold">
                  {ineligibleCoupons.length} Coupon{ineligibleCoupons.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View className="gap-3">
              {ineligibleCoupons.map(({ coupon, eligibility, discount }) =>
                renderIneligibleCard(coupon, discount, eligibility.reason, eligibility.conflictingItems),
              )}
            </View>
          </View>
        )}

        {/* Price summary */}
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
                <Text className="text-green-600 font-semibold">-₹{discountAmount.toFixed(2)}</Text>
              </View>
              <View className="h-px bg-gray-200 my-3" />
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-bold text-gray-900">Final Amount</Text>
                <Text className="text-base font-bold text-green-600">₹{finalAmount.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Tips */}
        <View className="px-4 py-5 bg-white mt-2">
          <View className="flex-row items-center mb-3">
            <Feather name="gift" size={18} color="#16a34a" />
            <Text className="text-sm font-bold text-gray-900 ml-2">Coupon Tips</Text>
          </View>
          <View className="bg-green-50 rounded-xl p-3 mb-2">
            <View className="flex-row items-start">
              <Feather name="check-circle" size={14} color="#16a34a" />
              <Text className="text-xs text-gray-700 ml-2 flex-1">
                Coupons are automatically filtered based on your cart items
              </Text>
            </View>
          </View>
          <View className="bg-blue-50 rounded-xl p-3">
            <View className="flex-row items-start">
              <Feather name="info" size={14} color="#2563eb" />
              <Text className="text-xs text-gray-700 ml-2 flex-1">
                Only one coupon can be applied per order
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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