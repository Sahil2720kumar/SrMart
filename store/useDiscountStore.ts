import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DiscountType = 'flat' | 'percent';

export interface ActiveDiscount {
  code: string;
  type: DiscountType;
  value: number;        // calculated discount amount
}



interface DiscountState {
  activeDiscount: ActiveDiscount | null;
  discountAmount: number;

  applyDiscount: (
    code: string,
    type: DiscountType,
    cartSubtotal: number,
    value: number,
    maxDiscount?: number
  ) => void;

  removeDiscount: () => void;
}

const useDiscountStore = create<DiscountState>()(
  persist(
    (set) => ({
      activeDiscount: null,
      discountAmount: 0,

      applyDiscount: (
        code,
        type,
        cartSubtotal,
        value,
        maxDiscount
      ) => {
        let amount = 0;

        if (type === 'percent') {
          amount = (cartSubtotal * value) / 100;
        } else {
          amount = value;
        }

        if (maxDiscount) {
          amount = Math.min(amount, maxDiscount);
        }

        set({
          activeDiscount: {
            code,
            type,
            value: amount,
          },
          discountAmount: amount,
        });
      },

      removeDiscount: () => {
        set({
          activeDiscount: null,
          discountAmount: 0,
        });
      },
    }),
    {
      name: 'active-discount-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDiscountStore;
