import { create } from 'zustand';
import { Product } from '@/types/product.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItem } from '@/types/cart.types';

export interface CartState {
  cart: Map<string, CartItem>;
  cartItems: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: new Map(),
      cartItems: [],
      totalItems: 0,
      totalPrice: 0,
      
      addToCart: (product: Product) => {
        const { cart } = get();
        const newCart = new Map(cart);
        const existingItem = newCart.get(product.id);
                
        if (existingItem) {
          newCart.set(product.id, {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          });
        } else {
          newCart.set(product.id, {
            ...product,
            quantity: 1,
          });
        }
        
        // ✅ Calculate derived values
        const newCartItems = Array.from(newCart.values());
        const newTotalItems = newCartItems.reduce((sum, item) => sum + item.quantity, 0);
        const newTotalPrice = newCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // ✅ Update all state values
        set({ 
          cart: newCart,
          cartItems: newCartItems,
          totalItems: newTotalItems,
          totalPrice: newTotalPrice,
        });
      },
      
      updateQuantity: (productId: string, delta: number) => {
        const { cart } = get();
        const newCart = new Map(cart);
        const item = newCart.get(productId);
        
        if (item) {
          const newQuantity = item.quantity + delta;
          
          if (newQuantity <= 0) {
            newCart.delete(productId);
          } else {
            newCart.set(productId, { ...item, quantity: newQuantity });
          }
        }
        
        // ✅ Calculate derived values
        const newCartItems = Array.from(newCart.values());
        const newTotalItems = newCartItems.reduce((sum, item) => sum + item.quantity, 0);
        const newTotalPrice = newCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        // ✅ Update all state values
        set({ 
          cart: newCart,
          cartItems: newCartItems,
          totalItems: newTotalItems,
          totalPrice: newTotalPrice,
        });
      },
      
      clearCart: () => {
        set({ 
          cart: new Map(),
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        });
      },
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cart: Array.from(state.cart.entries()),
      }),
      merge: (persistedState: any, currentState) => {
        if (persistedState?.cart) {
          const migratedCart = new Map();
          
          for (const [id, item] of persistedState.cart) {
            if (item.product) {
              migratedCart.set(id, {
                ...item.product,
                quantity: item.quantity,
              });
            } else {
              migratedCart.set(id, item);
            }
          }
          
          // ✅ Calculate derived values on merge/load
          const cartItems = Array.from(migratedCart.values());
          const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
          const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          return {
            ...currentState,
            cart: migratedCart,
            cartItems,
            totalItems,
            totalPrice,
          };
        }
        
        return {
          ...currentState,
          cart: new Map(),
          cartItems: [],
          totalItems: 0,
          totalPrice: 0,
        };
      },
    }
  )
);

export default useCartStore;