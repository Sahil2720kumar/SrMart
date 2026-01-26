// store/profileStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Customer, DeliveryBoy, User, Vendor } from '@/types/users.types';
import { UserRole } from '@/types/enums.types';
import AsyncStorage from '@react-native-async-storage/async-storage';


export interface ProfileState {
  user: User | null;
  customerProfile: Customer | null;
  vendorProfile: Vendor | null;
  deliveryBoyProfile: DeliveryBoy | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setCustomerProfile: (profile: Customer | null) => void;
  setVendorProfile: (profile: Vendor | null) => void;
  setDeliveryBoyProfile: (profile: DeliveryBoy | null) => void;
  
  // Helpers
  clearProfiles: () => void;
  getUserRole: () => UserRole | null;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      user: null,
      customerProfile: null,
      vendorProfile: null,
      deliveryBoyProfile: null,
      loading: false,

      setUser: (user) => set({ user }),
      setCustomerProfile: (profile) => set({ customerProfile: profile }),
      setVendorProfile: (profile) => set({ vendorProfile: profile }),
      setDeliveryBoyProfile: (profile) => set({ deliveryBoyProfile: profile }),

      // Clear all profiles
      clearProfiles: () => {
        set({
          user: null,
          customerProfile: null,
          vendorProfile: null,
          deliveryBoyProfile: null,
        });
      },

      // Get current user role
      getUserRole: () => {
        const state = get();
        return state.user?.role || null;
      },

    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        customerProfile: state.customerProfile,
        vendorProfile: state.vendorProfile,
        deliveryBoyProfile: state.deliveryBoyProfile,
        // Don't persist loading
      }),
    }
  )
);