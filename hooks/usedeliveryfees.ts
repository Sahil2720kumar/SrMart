import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import useCartStore from '@/store/cartStore';

export interface VendorDeliveryInfo {
  vendorId: string;
  distance: number;
  deliveryFee: number;
  originalFee: number; // Store original fee before free delivery discount
}

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

interface UseDeliveryFeesReturn {
  vendorDeliveryFees: VendorDeliveryInfo[];
  totalDeliveryFee: number;
  originalDeliveryFee: number; // Total before free delivery discount
  vendorCount: number;
  isCalculating: boolean;
  error: string | null;
  recalculate: () => Promise<void>;
  isFreeDelivery: boolean;
  freeDeliveryReason: 'coupon' | 'minimum_order' | null; // Why is delivery free?
  amountToFreeDelivery: number; // How much more to spend for free delivery
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

  // Determine if delivery should be free and why
  const qualifiesForFreeDeliveryByAmount = subtotal >= freeDeliveryMinimum;
  const isFreeDelivery = hasFreeDelivery || qualifiesForFreeDeliveryByAmount;
  
  const freeDeliveryReason: 'coupon' | 'minimum_order' | null = 
    hasFreeDelivery ? 'coupon' : 
    qualifiesForFreeDeliveryByAmount ? 'minimum_order' : 
    null;

  // Calculate how much more to spend for free delivery
  const amountToFreeDelivery = Math.max(0, freeDeliveryMinimum - subtotal);


  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
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
      // Group cart items by vendor
      const vendorMap = new Map<string, any[]>();

      for (const item of cartItems) {
        const vendorId = item.product?.vendor_id;
        if (!vendorId) continue;

        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, []);
        }
        vendorMap.get(vendorId)!.push(item);
      }

      // Calculate delivery fee for each vendor
      const deliveryInfoPromises = Array.from(vendorMap.keys()).map(
        async (vendorId) => {
          try {
            // Get vendor location
            const { data: vendor, error: vendorError } = await supabase
              .from('vendors')
              .select('latitude, longitude')
              .eq('user_id', vendorId)
              .single();

            if (vendorError || !vendor) {
              console.error('Error fetching vendor:', vendorError);
              const defaultFee = 30;
              return { 
                vendorId, 
                distance: 5, 
                originalFee: defaultFee,
                deliveryFee: isFreeDelivery ? 0 : defaultFee
              };
            }

            // Calculate distance between vendor and customer address
            const distance = calculateDistance(
              vendor.latitude,
              vendor.longitude,
              selectedAddress.latitude,
              selectedAddress.longitude
            );

            // Call RPC function to calculate delivery fee
            const { data: calculatedFee, error: feeError } = await supabase.rpc(
              'calculate_delivery_fee',
              { p_distance_km: distance }
            );

            if (feeError) {
              console.error('Error calculating delivery fee:', feeError);
              const defaultFee = 30;
              return { 
                vendorId, 
                distance, 
                originalFee: defaultFee,
                deliveryFee: isFreeDelivery ? 0 : defaultFee
              };
            }

            const originalFee = Number(calculatedFee);

            return {
              vendorId,
              distance: Number(distance.toFixed(2)),
              originalFee: originalFee,
              deliveryFee: isFreeDelivery ? 0 : originalFee,
            };
          } catch (err) {
            console.error('Error processing vendor:', vendorId, err);
            const defaultFee = 30;
            return { 
              vendorId, 
              distance: 5, 
              originalFee: defaultFee,
              deliveryFee: isFreeDelivery ? 0 : defaultFee
            };
          }
        }
      );

      const deliveryInfo = await Promise.all(deliveryInfoPromises);
      setVendorDeliveryFees(deliveryInfo);
    } catch (err: any) {
      console.error('Error calculating delivery fees:', err);
      setError(err.message || 'Failed to calculate delivery fees');
      setVendorDeliveryFees([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate delivery fees when dependencies change
  useEffect(() => {
    calculateDeliveryFees();
  }, [selectedAddress?.id, cartItems.length, enabled, isFreeDelivery, subtotal]);

  // Calculate totals
  const totalDeliveryFee = vendorDeliveryFees.reduce(
    (sum, vendor) => sum + vendor.deliveryFee,
    0
  );
  const originalDeliveryFee = vendorDeliveryFees.reduce(
    (sum, vendor) => sum + vendor.originalFee,
    0
  );
  const vendorCount = vendorDeliveryFees.length;

  return {
    vendorDeliveryFees,
    totalDeliveryFee,
    originalDeliveryFee,
    vendorCount,
    isCalculating,
    error,
    recalculate: calculateDeliveryFees,
    isFreeDelivery,
    freeDeliveryReason,
    amountToFreeDelivery,
  };
};