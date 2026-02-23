import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {useAuthStore} from '@/store/authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortOption =
  | 'relevance'
  | 'popularity'
  | 'price_low_to_high'
  | 'price_high_to_low'
  | 'rating'
  | 'newest'

export type SearchProduct = {
  id: string
  name: string
  unit: string
  price: number
  discount_price: number | null
  discount_percentage: number | null
  image: string | null
  rating: number | null
  review_count: number | null
  is_available: boolean | null
  stock_status: string | null
  category_name: string | null
  vendor_id: string | null
}

// ─── Recent Searches ──────────────────────────────────────────────────────────

/**
 * Fetches the current user's recent searches from the DB.
 * Falls back to an empty array if the user is not logged in.
 */
export function useFetchRecentSearches(limit = 10) {
  const session = useAuthStore((state) => state.session)
  const customerId = session?.user?.id

  return useQuery({
    queryKey: ['recent-searches', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_searches', {
        p_customer_id: customerId!,
        p_limit: limit,
      })
      if (error) throw error
      // Returns: { search_query: string; search_type: string; created_at: string }[]
      return (data ?? []) as { search_query: string; search_type: string; created_at: string }[]
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// ─── Trending Searches ────────────────────────────────────────────────────────

/**
 * Fetches globally trending search terms.
 */
export function useFetchTrendingSearches(limit = 10) {
  return useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_trending_searches', {
        p_limit: limit,
      })
      if (error) throw error
      // Returns: { search_query: string; search_count: number }[]
      return (data ?? []) as { search_query: string; search_count: number }[]
    },
    staleTime: 1000 * 60 * 10, // 10 minutes — trending data changes slowly
  })
}

// ─── Trending Products ────────────────────────────────────────────────────────

/**
 * Fetches trending products to display on the search landing screen.
 */
export function useFetchTrendingProducts(limit = 10) {
  return useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_trending_products')
        .select('id, name, unit, price, discount_price, image, rating, review_count, vendor_id, store_name')
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// ─── Search Products ──────────────────────────────────────────────────────────

/**
 * Searches products by query string with optional sort.
 * Only runs when `query` is non-empty.
 */
export function useSearchProducts(query: string, sort: SortOption = 'relevance') {
  return useQuery({
    queryKey: ['search-products', query, sort],
    queryFn: async () => {
      let builder = supabase
        .from('products')
        .select(
          `id, name, unit, price, discount_price, discount_percentage,
           image, rating, review_count, is_available, stock_status,
           categories!inner(name),
           vendor_id`
        )
        .eq('is_available', true)
        .or(`name.ilike.%${query}%, description.ilike.%${query}%`)

      // Apply sort
      switch (sort) {
        case 'price_low_to_high':
          builder = builder.order('price', { ascending: true })
          break
        case 'price_high_to_low':
          builder = builder.order('price', { ascending: false })
          break
        case 'rating':
          builder = builder.order('rating', { ascending: false })
          break
        case 'newest':
          builder = builder.order('created_at', { ascending: false })
          break
        case 'popularity':
          builder = builder.order('total_sales', { ascending: false })
          break
        case 'relevance':
        default:
          // Supabase full-text or default order — keep DB order
          break
      }

      const { data, error } = await builder

      if (error) throw error

      // Flatten join so callers get a flat object
      return (data ?? []).map((p: any) => ({
        ...p,
        category_name: p.categories?.name ?? null,
        categories: undefined,
      })) as SearchProduct[]
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 30, // 30 seconds — search results can change
  })
}

// ─── Add Recent Search ────────────────────────────────────────────────────────

/**
 * Saves a search term to the user's recent searches via Supabase RPC.
 * Call `mutate({ query, resultCount })` after a search is performed.
 */
export function useAddRecentSearch() {
  const session = useAuthStore((state) => state.session)
  const customerId = session?.user?.id
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      query,
      resultCount = 0,
      searchType = 'product',
    }: {
      query: string
      resultCount?: number
      searchType?: string
    }) => {
      if (!customerId) return // not logged in — skip silently

      const { error } = await supabase.rpc('add_recent_search', {
        p_customer_id: customerId,
        p_search_query: query,
        p_result_count: resultCount,
        p_search_type: searchType,
      })
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate so the recent searches list refreshes
      queryClient.invalidateQueries({ queryKey: ['recent-searches', customerId] })
    },
  })
}