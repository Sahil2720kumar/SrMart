import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Product } from '@/types/categories-products.types';

/* =======================
   TYPES
======================= */
export interface CartProduct {
  productId: string;
  product?: Partial<Product> | null;
  quantity: number;
}

export interface CartState {
  userId: string | null;
  setUserId: (userId: string | null) => void;

  cart: Map<string, CartProduct>;
  cartItems: CartProduct[];

  totalItems: number;
  totalPrice: number;

  addToCart: (product: Partial<Product>) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
}

/* =======================
   STORE
======================= */

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      userId: null,

      cart: new Map(),
      cartItems: [],
      totalItems: 0,
      totalPrice: 0,

      setUserId: (userId) => set({ userId }),

      /* ---------- ADD TO CART ---------- */
      addToCart: (product) => {
        const newCart = new Map(get().cart);
        const existing = newCart.get(product.id!);

        if (existing) {
          newCart.set(product.id!, {
            ...existing,
            quantity: existing.quantity + 1,
          });
        } else {
          newCart.set(product.id!, {
            productId: product.id!,
            product,
            quantity: 1,
          });
        }

        recalcAndSet(newCart, set);
      },

      /* ---------- UPDATE QUANTITY ---------- */
      updateQuantity: (productId, delta) => {
        const newCart = new Map(get().cart);
        const item = newCart.get(productId);

        if (!item) return;

        const nextQty = item.quantity + delta;

        if (nextQty <= 0) {
          newCart.delete(productId);
        } else {
          newCart.set(productId, {
            ...item,
            quantity: nextQty,
          });
        }

        recalcAndSet(newCart, set);
      },

      /* ---------- CLEAR CART ---------- */
      clearCart: () =>
        set({
          cart: new Map(),
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        }),
    }),
    {
      name: 'cart-store',

      storage: createJSONStorage(() => AsyncStorage),

      /* ---------- PERSIST ONLY MAP ---------- */
      partialize: (state) => ({
        cart: Array.from(state.cart.entries()),
      }),

      /* ---------- REHYDRATE MAP ---------- */
      merge: (persistedState: any, currentState) => {
        if (!persistedState?.cart) return currentState;

        const restoredCart = new Map<string, CartProduct>(
          persistedState.cart
        );

        const cartItems = Array.from(restoredCart.values());

        const totalItems = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );

        const totalPrice = cartItems.reduce(
          (sum, item) => sum + item.product?.discount_price! * item.quantity,
          0
        );

        return {
          ...currentState,
          cart: restoredCart,
          cartItems,
          totalItems,
          totalPrice,
        };
      },
    }
  )
);

/* =======================
   HELPERS
======================= */

function recalcAndSet(
  cart: Map<string, CartProduct>,
  set: (state: Partial<CartState>) => void
) {
  const cartItems = Array.from(cart.values());

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product?.discount_price! * item.quantity,
    0
  );

  set({
    cart,
    cartItems,
    totalItems,
    totalPrice,
  });
}

export default useCartStore;