import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useCartStore from '@/store/cartStore';


interface UseDeliveryFeesParams {
  selectedAddress?: {
    latitude: number;
    longitude: number;
    id: string;
  } | null;
  enabled?: boolean; // Allow disabling the hook
  hasFreeDelivery?: boolean; // Whether active coupon includes free delivery
  subtotal?: number; // Cart subtotal to check minimum order amount
  freeDeliveryMinimum?: number; // Minimum order amount for free delivery (default: 499)
}

// In your types file — update these interfaces

export interface VendorDeliveryInfo {
  vendorId:        string;
  distance:        number;
  originalFee:     number;   // raw fee before discount (for display)
  deliveryFee:     number;   // what customer actually pays
  isFirstVendor?:  boolean;  // true for the closest vendor (full price)
  discountPercent?: number;  // 0 for first, 50 for others
  savedAmount?:    number;   // how much saved on this vendor
  discountedFee?:number
}

export interface UseDeliveryFeesReturn {
  vendorDeliveryFees:  VendorDeliveryInfo[];
  totalDeliveryFee:    number;   // discounted total
  originalDeliveryFee: number;   // full price total (no discount)
  totalSaved:          number;   // total saved from multi-vendor discount
  vendorCount:         number;
  isCalculating:       boolean;
  error:               string | null;
  recalculate:         () => void;
  isFreeDelivery:      boolean;
  freeDeliveryReason:  'coupon' | 'minimum_order' | null;
  amountToFreeDelivery: number;
}

/**
 * Custom hook to calculate delivery fees for all vendors in the cart
 * Uses the Haversine formula for distance and calls the RPC function for fee calculation
 * Supports free delivery via:
 * 1. Coupon (hasFreeDelivery = true)
 * 2. Minimum order amount (subtotal >= freeDeliveryMinimum)
 */
export const useDeliveryFees = ({
  selectedAddress,
  enabled = true,
  hasFreeDelivery = false,
  subtotal = 0,
  freeDeliveryMinimum = 499,
}: UseDeliveryFeesParams): UseDeliveryFeesReturn => {

  const { cartItems } = useCartStore();
  const [vendorDeliveryFees, setVendorDeliveryFees] = useState<VendorDeliveryInfo[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qualifiesForFreeDeliveryByAmount = subtotal >= freeDeliveryMinimum;
  const isFreeDelivery = hasFreeDelivery || qualifiesForFreeDeliveryByAmount;

  const freeDeliveryReason: 'coupon' | 'minimum_order' | null =
    hasFreeDelivery ? 'coupon' :
    qualifiesForFreeDeliveryByAmount ? 'minimum_order' :
    null;

  const amountToFreeDelivery = Math.max(0, freeDeliveryMinimum - subtotal);

  // ── Haversine ─────────────────────────────────────────────────────────────
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  const calculateDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateDeliveryFees = async () => {
    if (!selectedAddress || cartItems.length === 0 || !enabled) {
      setVendorDeliveryFees([]);
      setError(null);
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const vendorMap = new Map<string, any[]>();
      for (const item of cartItems) {
        const vendorId = item.product?.vendor_id;
        if (!vendorId) continue;
        if (!vendorMap.has(vendorId)) vendorMap.set(vendorId, []);
        vendorMap.get(vendorId)!.push(item);
      }

      const vendorIds = Array.from(vendorMap.keys());

      const rawFeeResults = await Promise.all(
        vendorIds.map(async (vendorId) => {
          try {
            const { data: vendor, error: vendorError } = await supabase
              .from('vendors')
              .select('latitude, longitude')
              .eq('user_id', vendorId)
              .single();

            if (vendorError || !vendor) {
              return { vendorId, distance: 5, originalFee: 30 };
            }

            const rawDistance = calculateDistance(
              vendor.latitude,
              vendor.longitude,
              selectedAddress.latitude,
              selectedAddress.longitude
            );

            // ✅ FIX: always positive, minimum 0.1km
            // This prevents negative distance from near-zero Haversine results
            // and matches the GREATEST(ABS(...), 0.1) guard in the DB function
            const distance = Math.max(Math.abs(Number(rawDistance.toFixed(2))), 0.1);

            const { data: calculatedFee, error: feeError } = await supabase.rpc(
              'calculate_delivery_fee',
              { p_distance_km: distance }
            );

            if (feeError) {
              return { vendorId, distance, originalFee: 30 };
            }

            return {
              vendorId,
              distance,                        // ✅ always positive
              originalFee: Number(calculatedFee),
            };
          } catch (err) {
            console.error('Error processing vendor:', vendorId, err);
            return { vendorId, distance: 5, originalFee: 30 };
          }
        })
      );

      // Sort ascending — closest vendor gets full fee
      const sortedByDistance = [...rawFeeResults].sort(
        (a, b) => a.distance - b.distance
      );

      const deliveryInfo: VendorDeliveryInfo[] = sortedByDistance.map(
        (vendor, index) => {
          const originalFee = vendor.originalFee;
      
          const discountedFee = index === 0
            ? originalFee
            : Math.round(originalFee * 0.5 * 100) / 100;
      
          return {
            vendorId:         vendor.vendorId,
            distance:         vendor.distance,
            originalFee:      originalFee,
            discountedFee:    discountedFee,              // ✅ real fee — always set, never 0
            deliveryFee:      isFreeDelivery ? 0 : discountedFee, // what customer pays
            isFirstVendor:    index === 0,
            discountPercent:  index === 0 ? 0 : 50,
            savedAmount:      index === 0 ? 0 : Math.round((originalFee - discountedFee) * 100) / 100,
          };
        }
      );

      setVendorDeliveryFees(deliveryInfo);
    } catch (err: any) {
      console.error('Error calculating delivery fees:', err);
      setError(err.message || 'Failed to calculate delivery fees');
      setVendorDeliveryFees([]);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculateDeliveryFees();
  }, [selectedAddress?.id, cartItems.length, enabled, isFreeDelivery, subtotal]);

  const totalDeliveryFee = vendorDeliveryFees.reduce(
    (sum, v) => sum + v.deliveryFee, 0
  );

  const originalDeliveryFee = vendorDeliveryFees.reduce(
    (sum, v) => sum + v.originalFee, 0
  );

  const totalSaved = vendorDeliveryFees.reduce(
    (sum, v) => sum + (v.savedAmount ?? 0), 0
  );

  const vendorCount = vendorDeliveryFees.length;

  return {
    vendorDeliveryFees,
    totalDeliveryFee,
    originalDeliveryFee,
    totalSaved,
    vendorCount,
    isCalculating,
    error,
    recalculate: calculateDeliveryFees,
    isFreeDelivery,
    freeDeliveryReason,
    amountToFreeDelivery,
  };
};