import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---------------- TYPES ---------------- */

export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type KycStatus = 'pending' | 'completed' | 'rejected';



export interface DeliveryPartner {
  id: string;
  name: string;
}

export interface VendorItem {
  name: string;
  qty: string;
  collected: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  address: string;
  items: VendorItem[];
  collected: boolean;
}

export interface Order {
  id: string;
  customer: { name: string; address: string; phone: string };
  vendors: Vendor[];
  payout: number;
  distance: number;
  totalItems: number;
  deliveryOtp: string;
  status?: 'in_progress' | 'completed';
  currentStep?: 'pickup' | 'delivery';
}

interface DeliveryState {
  // Partner
  partner: DeliveryPartner | null;

  // Verification
  adminVerificationStatus: VerificationStatus | null;
  isKycCompleted: boolean;

  // Availability
  isOnline: boolean;

  // Orders
  activeOrderId: string | null;

  // Actions
  setPartner: (partner: DeliveryPartner) => void;
  setAdminVerificationStatus: (status: VerificationStatus) => void;
  toggleOnline: () => void;
  setKycCompleted:()=>void;
  assignOrder: (orderId: string) => void;
  clearOrder: () => void;
  resetDeliveryState: () => void;
}

/* ---------------- STORE ---------------- */

export const useDeliveryStore = create<DeliveryState>()(
  persist(
    (set, get) => ({
      partner: null,
      adminVerificationStatus: "approved", //testing
      kycSteps: [],
      isKycCompleted: true,// testing
      isOnline: false,
      activeOrderId: null,

      /* -------- Actions -------- */
      setPartner: (partner) => set({ partner }),
      setAdminVerificationStatus: (status) =>
        set({ adminVerificationStatus: status }),
    
      toggleOnline: () => {

        const { adminVerificationStatus, isKycCompleted } = get();
        if (adminVerificationStatus !== 'approved' || !isKycCompleted) {
          return;
        }
        set((state) => {
          return { isOnline: !state.isOnline, }
        });

      },
      setKycCompleted() {
        set((state) => {
          return { isKycCompleted: true, }
        });
      },
      assignOrder: (orderId) => set({ activeOrderId: orderId }),
      clearOrder: () => set({ activeOrderId: null }),
      resetDeliveryState: () =>
        set({ isOnline: false, activeOrderId: null }),
    }),
    {
      name: 'delivery-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        partner: state.partner,
        adminVerificationStatus: state.adminVerificationStatus,
        isKycCompleted: state.isKycCompleted,
        isOnline: state.isOnline,
        activeOrderId: state.activeOrderId,
      }),
    }
  )
);
