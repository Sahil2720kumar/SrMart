import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProductDraft {
  productName: string;
  category: string;
  categoryId: string;
  subCategory: string;
  subCategoryId: string;
  commissionRate: number;
  brand: string;
  unitSize: string;
  mrp: string;
  sellingPrice: string;
  initialStock: string;
  lowStockThreshold: string;
  isActive: boolean;
  isOrganic: boolean;
  isVeg: boolean;
  description: string;
  shortDescription: string;
  expiryDate: string;
  barcode: string;
  sku: string;
  uploadedImages: Array<{
    uri: string;
    altText: string;
    isPrimary: boolean;
  }>;
}

interface DraftProductStore {
  draft: ProductDraft | null;
  hasDraft: boolean;
  saveDraft: (draft: ProductDraft) => void;
  clearDraft: () => void;
}

const useDraftProductStore = create<DraftProductStore>()(
  persist(
    (set) => ({
      draft: null,
      hasDraft: false,
      saveDraft: (draft) => set({ draft, hasDraft: true }),
      clearDraft: () => set({ draft: null, hasDraft: false }),
    }),
    {
      name: 'product-draft-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useDraftProductStore;