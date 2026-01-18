import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Draft Product Type
 * (matches your AddProductScreen fields)
 */
export interface DraftProduct {
  productName: string;
  category: string;
  brand: string;
  unitSize: string;
  mrp: string;
  sellingPrice: string;
  initialStock: string;
  lowStockThreshold: string;
  isActive: boolean;
  description: string;
  expiryDate: string;
  barcode: string;
  taxApplicable: boolean;
  returnable: boolean;
  isFeatured: boolean;
  uploadedImages: string[];
}

/**
 * Zustand State
 */
export interface DraftProductState {
  draft: DraftProduct | null;
  hasDraft: boolean;

  saveDraft: (draft: DraftProduct) => void;
  clearDraft: () => void;
}

/**
 * Zustand Store
 */
const useDraftProductStore = create<DraftProductState>()(
  persist(
    (set) => ({
      draft: null,
      hasDraft: false,

      saveDraft: (draft) => {
        set({
          draft,
          hasDraft: true,
        });
      },

      clearDraft: () => {
        set({
          draft: null,
          hasDraft: false,
        });
      },
    }),
    {
      name: 'draft-product-store',
      storage: createJSONStorage(() => AsyncStorage),

      /**
       * Persist only what is needed
       */
      partialize: (state) => ({
        draft: state.draft,
      }),

      /**
       * Rehydrate safely and derive flags
       */
      merge: (persistedState: any, currentState) => {
        if (persistedState?.draft) {
          return {
            ...currentState,
            draft: persistedState.draft,
            hasDraft: true,
          };
        }

        return {
          ...currentState,
          draft: null,
          hasDraft: false,
        };
      },
    }
  )
);

export default useDraftProductStore;
