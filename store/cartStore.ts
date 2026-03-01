import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Product } from '@/types/categories-products.types';
import useDiscountStore from './useDiscountStore';
import { supabase } from '@/lib/supabase';

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

  isSyncingPrices: boolean;

  addToCart: (product: Partial<Product>) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;

  /**
   * Re-fetches live prices for all products currently in the cart from Supabase
   * and patches each cart item with the latest price/discount_price/discount_percentage.
   * Call this on app foreground, checkout screen mount, or after a long session gap.
   */
  syncPricesFromDB: () => Promise<void>;
}

/* =======================
   HELPERS
======================= */

/** Safely parse price whether it comes as string or number from API */
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Returns the effective selling price for a cart item:
 *   - discount_price  (if present and > 0)
 *   - otherwise price
 */
export function effectivePrice(product: Partial<Product> | null | undefined): number {
  if (!product) return 0;
  const dp = toNumber(product.discount_price);
  const p = toNumber(product.price);
  return dp > 0 ? dp : p;
}

function recalcAndSet(cart: Map<string, CartProduct>, set: (state: Partial<CartState>) => void) {
  const cartItems = Array.from(cart.values());

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Use effectivePrice so price is always consistent with DB logic
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + effectivePrice(item.product) * item.quantity,
    0
  );

  set({ cart, cartItems, totalItems, totalPrice });

  // Validate and recalculate discount after cart changes
  const discountStore = useDiscountStore.getState();
  if (discountStore.validateDiscount(totalPrice, cartItems)) {
    discountStore.recalculateDiscount(totalPrice, cartItems);
  } else {
    discountStore.removeDiscount();
  }
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
      isSyncingPrices: false,

      setUserId: (userId) => set({ userId }),

      /* ---------- ADD TO CART ---------- */
      addToCart: (product) => {
        // Normalize prices to numbers at the API boundary
        const normalizedProduct: Partial<Product> = {
          ...product,
          price: toNumber(product.price) as any,
          discount_price: toNumber(product.discount_price) as any,
          discount_percentage: toNumber(product.discount_percentage) as any,
        };

        const newCart = new Map(get().cart);
        const existing = newCart.get(normalizedProduct.id!);

        if (existing) {
          newCart.set(normalizedProduct.id!, {
            ...existing,
            quantity: existing.quantity + 1,
          });
        } else {
          newCart.set(normalizedProduct.id!, {
            productId: normalizedProduct.id!,
            product: normalizedProduct,
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
          newCart.set(productId, { ...item, quantity: nextQty });
        }

        recalcAndSet(newCart, set);
      },

      /* ---------- CLEAR CART ---------- */
      clearCart: () => {
        set({ cart: new Map(), cartItems: [], totalItems: 0, totalPrice: 0 });

        const discountStore = useDiscountStore.getState();
        discountStore.removeDiscount();
      },

      /* ---------- SYNC PRICES FROM DB ---------- */
      syncPricesFromDB: async () => {
        const { cart, isSyncingPrices } = get();

        if (isSyncingPrices || cart.size === 0) return;

        set({ isSyncingPrices: true });

        try {
          const productIds = Array.from(cart.keys());

          const { data, error } = await supabase
            .from('products')
            .select('id, price, discount_price, discount_percentage, name, image, is_available, stock_status, stock_quantity')
            .in('id', productIds);

          if (error) {
            console.error('[CartStore] syncPricesFromDB error:', error);
            return;
          }

          if (!data || data.length === 0) return;

          // Build a lookup map for O(1) access
          const freshPriceMap = new Map(
            data.map((p) => [
              p.id,
              {
                price: toNumber(p.price),
                discount_price: toNumber(p.discount_price),
                discount_percentage: toNumber(p.discount_percentage),
                name: p.name,
                image: p.image,
                is_available: p.is_available,
                stock_status: p.stock_status,
                stock_quantity: p.stock_quantity,
              },
            ])
          );

          const newCart = new Map(cart);
          let hadChanges = false;

          for (const [productId, cartItem] of newCart.entries()) {
            const fresh = freshPriceMap.get(productId);

            if (!fresh) {
              // Product no longer exists in DB — remove from cart
              newCart.delete(productId);
              hadChanges = true;
              continue;
            }

            const oldEffective = effectivePrice(cartItem.product);
            const newEffective = fresh.discount_price > 0 ? fresh.discount_price : fresh.price;

            if (
              oldEffective !== newEffective ||
              toNumber(cartItem.product?.price) !== fresh.price ||
              toNumber(cartItem.product?.discount_price) !== fresh.discount_price ||
              toNumber(cartItem.product?.discount_percentage) !== fresh.discount_percentage
            ) {
              newCart.set(productId, {
                ...cartItem,
                product: {
                  ...cartItem.product,
                  price: fresh.price as any,
                  discount_price: fresh.discount_price as any,
                  discount_percentage: fresh.discount_percentage as any,
                  name: fresh.name,
                  image: fresh.image,
                  is_available: fresh.is_available,
                  stock_status: fresh.stock_status,
                  stock_quantity: fresh.stock_quantity,
                },
              });
              hadChanges = true;
            }
          }

          if (hadChanges) {
            recalcAndSet(newCart, set);
          }
        } catch (err) {
          console.error('[CartStore] syncPricesFromDB unexpected error:', err);
        } finally {
          set({ isSyncingPrices: false });
        }
      },
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

        const restoredCart = new Map<string, CartProduct>(persistedState.cart);
        const cartItems = Array.from(restoredCart.values());

        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        // Use effectivePrice on rehydration too
        const totalPrice = cartItems.reduce(
          (sum, item) => sum + effectivePrice(item.product) * item.quantity,
          0
        );

        return { ...currentState, cart: restoredCart, cartItems, totalItems, totalPrice };
      },
    }
  )
);

export default useCartStore;