import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useBestSellerProducts() {
  return useQuery({
    queryKey: ['best-seller-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_best_seller_products')
        .select('*')
        .eq('is_available', true)
        .order('total_sales', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTrendingProducts() {
  return useQuery({
    queryKey: ['trending-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_trending_products')
        .select('*')
        .order('sales_count_30days', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}