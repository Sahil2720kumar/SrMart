import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartProduct } from '@/store/cartStore';

/* =======================
   TYPES
======================= */
export interface ActiveDiscount {
  code: string;
  type: 'percent' | 'flat' | 'free_shipping';
  value: number;
  maxDiscount?: number;
  // New fields for filtering
  applicableCategories?: string[];
  applicableVendors?: string[];
}

export interface DiscountState {
  activeDiscount: ActiveDiscount | null;
  discountAmount: number;
  
  applyDiscount: (
    code: string,
    type: 'percent' | 'flat' | 'free_shipping',
    orderAmount: number,
    value: number,
    maxDiscount?: number,
    applicableCategories?: string[],
    applicableVendors?: string[]
  ) => void;
  
  removeDiscount: () => void;
  
  // New method to calculate discount based on eligible items
  calculateDiscountForCart: (cartItems: CartProduct[]) => number;
}

/* =======================
   STORE
======================= */
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
        applicableCategories,
        applicableVendors
      ) => {
        const discount: ActiveDiscount = {
          code,
          type,
          value,
          maxDiscount,
          applicableCategories,
          applicableVendors,
        };

        // Calculate initial discount amount
        let discountAmount = 0;

        if (type === 'percent') {
          discountAmount = (orderAmount * value) / 100;
          if (maxDiscount) {
            discountAmount = Math.min(discountAmount, maxDiscount);
          }
        } else if (type === 'flat') {
          discountAmount = Math.min(value, orderAmount);
        }

        set({ activeDiscount: discount, discountAmount });
      },

      removeDiscount: () => {
        set({ activeDiscount: null, discountAmount: 0 });
      },

      calculateDiscountForCart: (cartItems) => {
        const { activeDiscount } = get();
        if (!activeDiscount) return 0;

        // Filter eligible items based on category and vendor
        const eligibleItems = cartItems.filter((item) => {
          const product = item.product;
          if (!product) return false;

          // Check category filter
          const categoryMatch =
            !activeDiscount.applicableCategories ||
            activeDiscount.applicableCategories.length === 0 ||
            activeDiscount.applicableCategories.includes(product.category_id!);

          // Check vendor filter
          const vendorMatch =
            !activeDiscount.applicableVendors ||
            activeDiscount.applicableVendors.length === 0 ||
            activeDiscount.applicableVendors.includes(product.vendor_id!);

          return categoryMatch && vendorMatch;
        });

        // Calculate total of eligible items
        const eligibleTotal = eligibleItems.reduce(
          (sum, item) =>
            sum + (item.product?.discount_price || 0) * item.quantity,
          0
        );

        // Calculate discount based on type
        let discountAmount = 0;

        if (activeDiscount.type === 'percent') {
          discountAmount = (eligibleTotal * activeDiscount.value) / 100;
          if (activeDiscount.maxDiscount) {
            discountAmount = Math.min(
              discountAmount,
              activeDiscount.maxDiscount
            );
          }
        } else if (activeDiscount.type === 'flat') {
          discountAmount = Math.min(activeDiscount.value, eligibleTotal);
        }

        // Update the discount amount in store
        set({ discountAmount });

        return discountAmount;
      },
    }),
    {
      name: 'discount-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDiscountStore;