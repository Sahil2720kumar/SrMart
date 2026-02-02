import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiscountType = 'percent' | 'flat';

export interface ActiveDiscount {
  code: string;
  type: DiscountType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  applicableTo?: 'all' | 'category' | 'product';
  applicableId?: string;
}

interface DiscountState {
  activeDiscount: ActiveDiscount | null;
  discountAmount: number;
  
  applyDiscount: (
    code: string,
    type: DiscountType,
    orderAmount: number,
    value: number,
    maxDiscount?: number,
    minOrderAmount?: number,
    applicableTo?: 'all' | 'category' | 'product' | 'vendor',
    applicableId?: string
  ) => void;
  
  removeDiscount: () => void;
  
  validateDiscount: (orderAmount: number, cartItems?: any[]) => boolean;
  
  recalculateDiscount: (orderAmount: number, cartItems?: any[]) => void;
}

const calculateDiscountAmount = (
  type: DiscountType,
  value: number,
  orderAmount: number,
  maxDiscount?: number
): number => {
  let discount = 0;
  
  if (type === 'percent') {
    discount = (orderAmount * value) / 100;
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }
  } else {
    discount = value;
  }
  
  return Math.min(discount, orderAmount);
};

const useDiscountStore = create<DiscountState>()(
  persist(
    (set, get) => ({
      activeDiscount: null,
      discountAmount: 0,

      applyDiscount: (
        code,
        type,
        orderAmount,
        value,
        maxDiscount,
        minOrderAmount = 0,
        applicableTo = 'all',
        applicableId
      ) => {
        const discount = calculateDiscountAmount(type, value, orderAmount, maxDiscount);
        
        set({
          activeDiscount: {
            code,
            type,
            value,
            maxDiscount,
            minOrderAmount,
            applicableTo,
            applicableId,
          },
          discountAmount: discount,
        });
      },

      removeDiscount: () => {
        set({
          activeDiscount: null,
          discountAmount: 0,
        });
      },

      validateDiscount: (orderAmount, cartItems) => {
        const { activeDiscount } = get();
        
        if (!activeDiscount) return true;

        // Check minimum order amount
        if (orderAmount < activeDiscount.minOrderAmount) {
          return false;
        }

        // Check category/product specific rules
        if (activeDiscount.applicableTo === 'category' && activeDiscount.applicableId) {
          if (!cartItems || cartItems.length === 0) return false;
          
          const hasApplicableItem = cartItems.some(
            item => item.product?.category_id === activeDiscount.applicableId
          );
          
          if (!hasApplicableItem) {
            return false;
          }
        }

        if (activeDiscount.applicableTo === 'product' && activeDiscount.applicableId) {
          if (!cartItems || cartItems.length === 0) return false;
          
          const hasProduct = cartItems.some(
            item => item.productId === activeDiscount.applicableId
          );
          
          if (!hasProduct) {
            return false;
          }
        }

        return true;
      },

      recalculateDiscount: (orderAmount, cartItems) => {
        const { activeDiscount, validateDiscount, removeDiscount } = get();
        
        if (!activeDiscount) return;

        // Validate if discount is still applicable
        const isValid = validateDiscount(orderAmount, cartItems);
        
        if (!isValid) {
          // Remove discount if no longer valid
          // removeDiscount();
          return;
        }

        // Recalculate discount amount based on new order amount
        const newDiscountAmount = calculateDiscountAmount(
          activeDiscount.type,
          activeDiscount.value,
          orderAmount,
          activeDiscount.maxDiscount
        );

        set({ discountAmount: newDiscountAmount });
      },
    }),
    {
      name: 'discount-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDiscountStore