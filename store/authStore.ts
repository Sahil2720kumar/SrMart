// store/authStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface AuthState {
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  setSession: (newSession: Session | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

const authStorage = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};
 
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      loading: true,
      initialized: false,

      setSession: (newSession) => set({ session: newSession }),

      setLoading: (loading) => set({ loading }),

      initialize: async () => {
        const state = get();

        // Prevent multiple initializations
        if (state.initialized) {
          console.log('Auth already initialized');
          return;
        }

        console.log('Initializing auth...');
        set({ loading: true });

        try {
          // Get initial session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
          }

          set({ session, loading: false, initialized: true });
          console.log('Auth initialized, session:', session ? 'Found' : 'None');

          // Listen for auth changes
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event);

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              set({ session });
            } else if (event === 'SIGNED_OUT') {
              set({ session: null });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ loading: false, initialized: true });
        }
      }

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({ session: state.session }), // Only persist session
    }
  )
);