import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiscountType = 'percent' | 'flat';

export interface ActiveDiscount {
  couponId: string;           // UUID from coupons table — needed to record usage after order creation
  code: string;
  type: DiscountType;
  value: number;
  maxDiscount?: number;
  minOrderAmount: number;
  applicableTo?: 'all' | 'category' | 'product' | 'vendor';
  applicableId?: string;
  includes_free_delivery: boolean;
}

interface DiscountState {
  activeDiscount: ActiveDiscount | null;
  discountAmount: number;

  applyDiscount: (
    couponId: string,           // UUID — first param, new
    code: string,
    type: DiscountType,
    orderAmount: number,
    value: number,
    maxDiscount?: number | null,
    minOrderAmount?: number | null,
    applicableTo?: 'all' | 'category' | 'product' | 'vendor' | null,
    applicableId?: string | null,
    includes_free_delivery?: boolean | null,
  ) => void;

  removeDiscount: () => void;

  validateDiscount: (orderAmount: number, cartItems?: any[]) => boolean;

  recalculateDiscount: (orderAmount: number, cartItems?: any[]) => void;
}

const calculateDiscountAmount = (
  type: DiscountType,
  value: number,
  orderAmount: number,
  maxDiscount?: number | null,
): number => {
  let discount = 0;
  if (type === 'percent') {
    discount = (orderAmount * value) / 100;
    if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
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
        couponId,
        code,
        type,
        orderAmount,
        value,
        maxDiscount,
        minOrderAmount = 0,
        applicableTo = 'all',
        applicableId,
        includes_free_delivery = false,
      ) => {
        const discount = calculateDiscountAmount(type, value, orderAmount, maxDiscount);
        set({
          activeDiscount: {
            couponId,
            code,
            type,
            value,
            maxDiscount: maxDiscount ?? undefined,
            minOrderAmount: minOrderAmount ?? 0,
            applicableTo: (applicableTo ?? 'all') as ActiveDiscount['applicableTo'],
            applicableId: applicableId ?? undefined,
            includes_free_delivery: includes_free_delivery ?? false,
          },
          discountAmount: discount,
        });
      },

      removeDiscount: () => set({ activeDiscount: null, discountAmount: 0 }),

      validateDiscount: (orderAmount, cartItems) => {
        const { activeDiscount } = get();
        if (!activeDiscount) return true;

        if (orderAmount < activeDiscount.minOrderAmount) return false;

        if (activeDiscount.applicableTo === 'category' && activeDiscount.applicableId) {
          if (!cartItems?.length) return false;
          return cartItems.some(
            (item) => item.product?.category_id === activeDiscount.applicableId,
          );
        }

        if (activeDiscount.applicableTo === 'product' && activeDiscount.applicableId) {
          if (!cartItems?.length) return false;
          return cartItems.some((item) => item.productId === activeDiscount.applicableId);
        }

        return true;
      },

      recalculateDiscount: (orderAmount, cartItems) => {
        const { activeDiscount, validateDiscount } = get();
        if (!activeDiscount) return;

        if (!validateDiscount(orderAmount, cartItems)) return;

        const newDiscountAmount = calculateDiscountAmount(
          activeDiscount.type,
          activeDiscount.value,
          orderAmount,
          activeDiscount.maxDiscount,
        );
        set({ discountAmount: newDiscountAmount });
      },
    }),
    {
      name: 'discount-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useDiscountStore;