import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon } from '@/types/offers.types';
import { CartProduct } from '@/store/cartStore';
import {
  checkCouponEligibility,
  CouponEligibility,
  calculateDiscountableValue,
  sortCouponsByValue,
} from '@/utils/checkCouponEligibility ';

interface ProductCategory {
  id: string;
  category_id: string;
  is_veg: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CouponWithEligibility {
  coupon: Coupon;
  eligibility: CouponEligibility;
  discount: number;
}

/**
 * Fetch product categories for items in cart
 */
export const useProductCategories = (productIds: string[]) => {
  return useQuery({
    queryKey: ['product-categories', productIds.sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from('products')
        .select('id, category_id, is_veg, name')
        .in('id', productIds);

      if (error) throw error;
      return data as ProductCategory[];
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch category details
 */
export const useCategoryDetails = (categoryIds: string[]) => {
  return useQuery({
    queryKey: ['categories', categoryIds.sort().join(',')],
    queryFn: async () => {
      if (categoryIds.length === 0) return [];

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .in('id', categoryIds);

      if (error) throw error;
      return data as Category[];
    },
    enabled: categoryIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Enhanced hook for filtering coupons based on cart contents
 */
export const useFilteredCoupons = (
  cartItems: CartProduct[],
  totalPrice: number,
  calculateDiscount: (coupon: Coupon, orderAmount: number) => number
) => {
  // Fetch product categories
  const productIds = useMemo(
    () => cartItems.map(item => item.productId),
    [cartItems]
  );

  const { 
    data: productCategories, 
    isLoading: loadingCategories 
  } = useProductCategories(productIds);

  

  // Get unique category IDs
  const categoryIds = useMemo(() => {
    if (!productCategories) return [];
    return [...new Set(productCategories.map(p => p.category_id))];
  }, [productCategories]);

  const { data: categories } = useCategoryDetails(categoryIds);

  

  // Merge cart items with their category info
  const cartItemsWithDetails = useMemo(() => {
    if (!productCategories) return cartItems;

    return cartItems.map(item => {
      const productInfo = productCategories.find(p => p.id === item.productId);
      const categoryInfo = categories?.find(c => c.id === productInfo?.category_id);

      return {
        ...item,
        productDetails: {
          ...item.product,
          is_veg: productInfo?.is_veg,
          category_id: productInfo?.category_id,
          categoryName: categoryInfo?.name,
          categorySlug: categoryInfo?.slug,
        },
      };
    });
  }, [cartItems, productCategories, categories]);

  
  /**
   * Filter and categorize coupons
   */
  const filterCoupons = (coupons: Coupon[] | undefined) => {
    if (!coupons || loadingCategories) {
      return {
        eligible: [],
        ineligible: [],
        all: [],
      };
    }

    const couponsWithEligibility: CouponWithEligibility[] = coupons.map(coupon => {
      const eligibility = checkCouponEligibility(
        coupon,
        cartItemsWithDetails,
        totalPrice,
        categories
      );

      

      const discount = calculateDiscount(coupon, totalPrice);

      return {
        coupon,
        eligibility,
        discount,
      };
    });

    // Sort by value and eligibility
    const sorted = sortCouponsByValue(couponsWithEligibility);

    const eligible = sorted.filter(c => c.eligibility.isEligible);
    const ineligible = sorted.filter(c => !c.eligibility.isEligible);

    return {
      eligible,
      ineligible,
      all: sorted,
    };
  };

  return {
    filterCoupons,
    loadingCategories,
    productCategories,
    categories,
    cartItemsWithDetails,
  };
};

/**
 * Get suggestions for making a coupon eligible
 */
export const getCouponSuggestions = (
  coupon: Coupon,
  eligibility: CouponEligibility,
  totalPrice: number,
  cartItems: CartProduct[]
): string[] => {
  const suggestions: string[] = [];

  // Minimum order value suggestion
  if (eligibility.shortfall && eligibility.shortfall > 0) {
    suggestions.push(`Add ₹${eligibility.shortfall.toFixed(0)} worth of items to your cart`);
  }

  // Remove conflicting items suggestion
  if (eligibility.conflictingItems && eligibility.conflictingItems.length > 0) {
    const itemNames = eligibility.conflictingItems.map(i => i.name).join(', ');
    suggestions.push(`Remove: ${itemNames}`);
  }

  // Add required items suggestion
  if (coupon.applicable_to === 'product' && !eligibility.isEligible) {
    suggestions.push('Add the required product to your cart');
  }

  if (coupon.applicable_to === 'category' && !eligibility.isEligible && !eligibility.conflictingItems) {
    suggestions.push('Add items from the required category');
  }

  return suggestions;
};