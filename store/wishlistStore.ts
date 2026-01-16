import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WishlistState {
  wishlist: Set<string>;
  wishlistItems: string[];
  toggleWishlist: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: new Set(),
      wishlistItems: [],
      
      toggleWishlist: (productId: string) => {
        const { wishlist } = get();
        const newWishlist = new Set(wishlist);
        
        if (newWishlist.has(productId)) {
          newWishlist.delete(productId);
        } else {
          newWishlist.add(productId);
        }
        
        set({ 
          wishlist: newWishlist,
          wishlistItems: Array.from(newWishlist),
        });
      },
      
      addToWishlist: (productId: string) => {
        const { wishlist } = get();
        const newWishlist = new Set(wishlist);
        newWishlist.add(productId);
        
        set({ 
          wishlist: newWishlist,
          wishlistItems: Array.from(newWishlist),
        });
      },
      
      removeFromWishlist: (productId: string) => {
        const { wishlist } = get();
        const newWishlist = new Set(wishlist);
        newWishlist.delete(productId);
        
        set({ 
          wishlist: newWishlist,
          wishlistItems: Array.from(newWishlist),
        });
      },
      
      isInWishlist: (productId: string) => {
        return get().wishlist.has(productId);
      },
      
      clearWishlist: () => {
        set({ 
          wishlist: new Set(),
          wishlistItems: [],
        });
      },
    }),
    {
      name: 'wishlist-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Convert Set to Array for JSON serialization
        wishlist: Array.from(state.wishlist),
      }),
      merge: (persistedState: any, currentState) => {
        // Convert Array back to Set when loading
        // ✅ Explicitly type the array and Set
        const wishlistArray = (persistedState?.wishlist || []) as string[];
        const wishlistSet = new Set<string>(wishlistArray);
        
        return {
          ...currentState,
          wishlist: wishlistSet,
          wishlistItems: wishlistArray,
        };
      },
    }
  )
);

export default useWishlistStore;