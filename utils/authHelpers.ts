import { useAuthStore } from '@/store/authStore';

// Check if user is authenticated
export function useIsAuthenticated() {
  return useAuthStore((state) => state.session !== null);
}

// Get current user
export function useCurrentUser() {
  return useAuthStore((state) => state.session?.user);
}

// Check if auth is ready
export function useAuthReady() {
  return useAuthStore((state) => state.initialized && !state.loading);
}