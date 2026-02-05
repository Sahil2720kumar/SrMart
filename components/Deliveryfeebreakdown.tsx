import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { VendorDeliveryInfo } from '@/hooks/usedeliveryfees';
import Feather from '@expo/vector-icons/Feather';

interface DeliveryFeeBreakdownProps {
  vendorDeliveryFees: VendorDeliveryInfo[];
  totalDeliveryFee: number;
  originalDeliveryFee?: number; // Original fee before free delivery discount
  vendorCount: number;
  isCalculating: boolean;
  isFreeDelivery?: boolean; // Whether delivery is free via coupon
  showBreakdown?: boolean;
  className?: string;
}

/**
 * Reusable component to display delivery fee information
 * Shows total delivery fee and optionally vendor-wise breakdown
 * Supports free delivery via coupon
 */
export const DeliveryFeeBreakdown: React.FC<DeliveryFeeBreakdownProps> = ({
  vendorDeliveryFees,
  totalDeliveryFee,
  originalDeliveryFee,
  vendorCount,
  isCalculating,
  isFreeDelivery = false,
  showBreakdown = true,
  className = '',
}) => {
  return (
    <View className={className}>
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
          {isFreeDelivery && originalDeliveryFee && originalDeliveryFee > 0 ? (
            <View className="flex-row items-center">
              <Text className="text-sm font-semibold text-gray-400 line-through mr-2">
                ₹{originalDeliveryFee.toFixed(2)}
              </Text>
              <Text className="text-sm font-semibold text-green-600">Free</Text>
            </View>
          ) : (
            <Text className={`text-sm font-semibold ${totalDeliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {isCalculating ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : totalDeliveryFee === 0 ? (
                'Free'
              ) : (
                `₹${totalDeliveryFee.toFixed(2)}`
              )}
            </Text>
          )}
        </View>
      </View>

      {/* Free delivery badge */}
      {isFreeDelivery && !isCalculating && (
        <View className="bg-green-50 rounded-lg p-2 mb-2">
          <View className="flex-row items-center">
            <Feather name="gift" size={14} color="#16a34a" />
            <Text className="text-xs text-green-700 ml-1 font-medium">
              Free delivery applied from coupon!
            </Text>
          </View>
        </View>
      )}

      {/* Vendor-wise delivery breakdown */}
      {showBreakdown && vendorDeliveryFees.length > 0 && !isCalculating && (
        <View className="ml-4">
          {vendorDeliveryFees.map((vendor, index) => (
            <View
              key={vendor.vendorId}
              className="flex-row justify-between items-center mb-1"
            >
              <Text className="text-xs text-gray-500">
                Vendor {index + 1} ({vendor.distance.toFixed(1)} km)
              </Text>
              {isFreeDelivery ? (
                <View className="flex-row items-center">
                  <Text className="text-xs text-gray-400 line-through mr-1">
                    ₹{vendor.originalFee.toFixed(2)}
                  </Text>
                  <Text className="text-xs text-green-600 font-medium">Free</Text>
                </View>
              ) : (
                <Text className="text-xs text-gray-600">
                  ₹{vendor.deliveryFee.toFixed(2)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};