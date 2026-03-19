import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { VendorDeliveryInfo } from '@/hooks/usedeliveryfees';
import Feather from '@expo/vector-icons/Feather';

interface DeliveryFeeBreakdownProps {
  vendorDeliveryFees:   VendorDeliveryInfo[];
  totalDeliveryFee:     number;
  originalDeliveryFee?: number;
  totalSaved?:          number;
  vendorCount:          number;
  isCalculating:        boolean;
  isFreeDelivery?:      boolean;
  freeDeliveryReason?:  'coupon' | 'minimum_order' | null;  // ← new
  showBreakdown?:       boolean;
  className?:           string;
}

export const DeliveryFeeBreakdown: React.FC<DeliveryFeeBreakdownProps> = ({
  vendorDeliveryFees,
  totalDeliveryFee,
  originalDeliveryFee,
  totalSaved = 0,
  vendorCount,
  isCalculating,
  isFreeDelivery = false,
  freeDeliveryReason = null,
  showBreakdown = true,
  className = '',
}) => {
  const hasMultiVendorDiscount = vendorCount > 1 && totalSaved > 0 && !isFreeDelivery;

  const isCouponFree       = freeDeliveryReason === 'coupon';
  const isMinimumOrderFree = freeDeliveryReason === 'minimum_order';

  return (
    <View className={className}>

      {/* ── Header row ─────────────────────────────────────────────────── */}
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-sm text-gray-600">
            Delivery Fee ({vendorCount} {vendorCount === 1 ? 'vendor' : 'vendors'})
          </Text>
          {isCalculating && (
            <Text className="text-xs text-gray-400 mt-0.5">Calculating...</Text>
          )}
        </View>

        <View className="items-end">
          {isCalculating ? (
            <ActivityIndicator size="small" color="#22c55e" />
          ) : isFreeDelivery ? (
            // Any free delivery — show original struck through + FREE
            <View className="flex-row items-center">
              {!!originalDeliveryFee && originalDeliveryFee > 0 && (
                <Text className="text-sm text-gray-400 line-through mr-2">
                  ₹{originalDeliveryFee.toFixed(2)}
                </Text>
              )}
              <Text className="text-sm font-bold text-green-600">Free</Text>
            </View>
          ) : hasMultiVendorDiscount ? (
            // Multi-vendor discount — show original struck through + discounted
            <View className="items-end">
              <Text className="text-xs text-gray-400 line-through">
                ₹{originalDeliveryFee?.toFixed(2)}
              </Text>
              <Text className="text-sm font-bold text-gray-900">
                ₹{totalDeliveryFee.toFixed(2)}
              </Text>
            </View>
          ) : (
            <Text className="text-sm font-bold text-gray-900">
              ₹{totalDeliveryFee.toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {/* ── Free delivery badge: COUPON ─────────────────────────────────── */}
      {isCouponFree && !isCalculating && (
        <View className="bg-green-50 border border-green-100 rounded-xl p-2.5 mb-2 flex-row items-center">
          <Feather name="gift" size={14} color="#16a34a" />
          <Text className="text-xs text-green-700 font-medium flex-1 ml-2">
            Free delivery applied from your coupon!
          </Text>
        </View>
      )}

      {/* ── Free delivery badge: MINIMUM ORDER ─────────────────────────── */}
      {isMinimumOrderFree && !isCalculating && (
        <View className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-2 flex-row items-center">
          <Feather name="check-circle" size={14} color="#2563eb" />
          <Text className="text-xs text-blue-700 font-medium flex-1 ml-2">
            Free delivery on orders above ₹499!
          </Text>
        </View>
      )}

      {/* ── Multi-vendor savings badge ───────────────────────────────────── */}
      {hasMultiVendorDiscount && !isCalculating && (
        <View className="bg-green-50 border border-green-100 rounded-xl p-2.5 mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Feather name="tag" size={14} color="#16a34a" />
            <Text className="text-xs text-green-700 font-medium ml-2">
              Multi-vendor discount (50% off extra vendors)
            </Text>
          </View>
          <Text className="text-xs text-green-700 font-bold">
            -₹{totalSaved.toFixed(2)}
          </Text>
        </View>
      )}

      {/* ── Per-vendor breakdown ─────────────────────────────────────────── */}
      {showBreakdown && vendorDeliveryFees.length > 0 && !isCalculating && (
        <View className="ml-2">
          {vendorDeliveryFees.map((vendor, index) => (
            <View
              key={vendor.vendorId}
              className="flex-row justify-between items-center mb-1"
            >
              {/* Label + discount pill */}
              <View className="flex-row items-center flex-1">
                <Text className="text-xs text-gray-500">
                  Vendor {index + 1} ({vendor.distance.toFixed(1)} km)
                </Text>
                {!isFreeDelivery && !vendor.isFirstVendor && (
                  <View className="bg-green-100 px-1.5 py-0.5 rounded-full ml-1.5">
                    <Text className="text-green-700 text-xs font-semibold">
                      50% off
                    </Text>
                  </View>
                )}
              </View>

              {/* Fee */}
              {isFreeDelivery ? (
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-400 line-through mr-1">
                    ₹{vendor.originalFee.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-green-600 font-semibold">Free</Text>
                </View>
              ) : vendor.isFirstVendor ? (
                <Text className="text-xs text-gray-600 font-medium">
                  ₹{vendor.deliveryFee.toFixed(2)}
                </Text>
              ) : (
                <View className="items-end">
                  <Text className="text-xs text-gray-400 line-through">
                    ₹{vendor.originalFee.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-gray-600 font-medium">
                    ₹{vendor.deliveryFee.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

    </View>
  );
};