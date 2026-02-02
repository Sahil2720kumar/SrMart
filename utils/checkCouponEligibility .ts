import { Coupon } from '@/types/offers.types';
import { Product } from '@/types/categories-products.types';
import { CartProduct } from '@/store/cartStore';

export interface CouponEligibility {
  isEligible: boolean;
  reason?: string;
  conflictingItems?: Array<{ id: string; name: string; category?: string }>;
  requirementsMet?: boolean;
  shortfall?: number;
}

export interface ProductWithCategory extends Product {
  categoryName?: string;
  categorySlug?: string;
}

export interface CartItemWithDetails extends CartProduct {
  productDetails?: ProductWithCategory;
}

/**
 * Check if a coupon is eligible based on cart contents
 */
export const checkCouponEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  totalPrice: number,
  categories?: Array<{ id: string; name: string; slug: string }>
): CouponEligibility => {
  // 1. Check minimum order amount
  if (totalPrice < coupon.min_order_amount) {
    return {
      isEligible: false,
      reason: `Add ₹${(coupon.min_order_amount - totalPrice).toFixed(0)} more to cart`,
      requirementsMet: false,
      shortfall: coupon.min_order_amount - totalPrice,
    };
  }

  // 2. Check if applicable to all items
  if (coupon.applicable_to === 'all') {
    return { 
      isEligible: true,
      requirementsMet: true,
    };
  }

  // 3. Check category-specific coupons
  if (coupon.applicable_to === 'category' && coupon.applicable_id) {
    return checkCategoryEligibility(coupon, cartItems, categories);
  }

  // 4. Check product-specific coupons
  if (coupon.applicable_to === 'product' && coupon.applicable_id) {
    return checkProductEligibility(coupon, cartItems);
  }

  return { 
    isEligible: true,
    requirementsMet: true,
  };
};

/**
 * Check category-specific coupon eligibility
 */
const checkCategoryEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  categories?: Array<{ id: string; name: string; slug: string }>
): CouponEligibility => {
  // console.log(categories);
  // console.log(coupon);
   //Note
 
  const targetCategory = categories?.find(c => c.id === coupon.applicable_id);

  console.log("targetCategory",targetCategory);
  
  const categoryName = targetCategory?.name || 'this category';
  const categorySlug = targetCategory?.slug || '';

  // Find items from the target category
  const applicableItems = cartItems.filter(item => 
    item.product?.category_id === coupon.applicable_id
  );

  if (applicableItems.length === 0) {
    return {
      isEligible: false,
      reason: `No items from ${categoryName} in cart`,
      requirementsMet: false,
    };
  }

  // Check for veg/non-veg conflicts
  const vegConflict = checkVegNonVegConflict(
    categorySlug,
    categoryName,
    cartItems
  );

  if (!vegConflict.isEligible) {
    return vegConflict;
  }

  return { 
    isEligible: true,
    requirementsMet: true,
  };
};

/**
 * Check for veg/non-veg conflicts
 */
const checkVegNonVegConflict = (
  categorySlug: string,
  categoryName: string,
  cartItems: CartItemWithDetails[]
): CouponEligibility => {
  const isVegCoupon = 
    categorySlug.includes('veg') || 
    categorySlug.includes('vegetable') ||
    categoryName.toLowerCase().includes('veg');

  const isMeatCoupon = 
    categorySlug.includes('meat') || 
    categorySlug.includes('chicken') ||
    categorySlug.includes('fish') ||
    categorySlug.includes('seafood') ||
    categoryName.toLowerCase().includes('meat') ||
    categoryName.toLowerCase().includes('non-veg');

  // If it's a veg coupon, check for non-veg items
  if (isVegCoupon) {
    const nonVegItems = cartItems.filter(item => 
      item.product?.is_veg === false
    );

    if (nonVegItems.length > 0) {
      const conflictingProducts = nonVegItems.map(item => ({
        id: item.productId,
        name: item.product?.name || 'Unknown',
        category: item.productDetails?.categoryName,
      }));

      return {
        isEligible: false,
        reason: 'Remove non-veg items to apply this coupon',
        conflictingItems: conflictingProducts,
        requirementsMet: false,
      };
    }
  }

  // If it's a meat/non-veg coupon, optionally check for veg-only scenarios
  // (This is less common, but you can add logic here if needed)

  return { 
    isEligible: true,
    requirementsMet: true,
  };
};

/**
 * Check product-specific coupon eligibility
 */
const checkProductEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[]
): CouponEligibility => {
  const hasProduct = cartItems.some(item => 
    item.productId === coupon.applicable_id
  );

  if (!hasProduct) {
    return {
      isEligible: false,
      reason: 'Required product not in cart',
      requirementsMet: false,
    };
  }

  return { 
    isEligible: true,
    requirementsMet: true,
  };
};

/**
 * Get conflicting items that prevent a coupon from being applied
 */
export const getConflictingItems = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  categories?: Array<{ id: string; name: string; slug: string }>
): Array<{ id: string; name: string; reason: string }> => {
  const conflicts: Array<{ id: string; name: string; reason: string }> = [];

  if (coupon.applicable_to === 'category' && coupon.applicable_id) {
    const targetCategory = categories?.find(c => c.id === coupon.applicable_id);
    const categorySlug = targetCategory?.slug || '';
    const categoryName = targetCategory?.name || '';

    const isVegCoupon = 
      categorySlug.includes('veg') || 
      categoryName.toLowerCase().includes('veg');

    if (isVegCoupon) {
      const nonVegItems = cartItems.filter(item => 
        item.product?.is_veg === false
      );

      conflicts.push(...nonVegItems.map(item => ({
        id: item.productId,
        name: item.product?.name || 'Unknown',
        reason: 'Non-veg item conflicts with veg coupon',
      })));
    }
  }

  return conflicts;
};

/**
 * Calculate the value of items that would be discounted
 */
export const calculateDiscountableValue = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[]
): number => {
  if (coupon.applicable_to === 'all') {
    return cartItems.reduce((total, item) => 
      total + (item.product?.discount_price || 0) * item.quantity, 0
    );
  }

  if (coupon.applicable_to === 'category' && coupon.applicable_id) {
    return cartItems
      .filter(item => item.product?.category_id === coupon.applicable_id)
      .reduce((total, item) => 
        total + (item.product?.discount_price || 0) * item.quantity, 0
      );
  }

  if (coupon.applicable_to === 'product' && coupon.applicable_id) {
    return cartItems
      .filter(item => item.productId === coupon.applicable_id)
      .reduce((total, item) => 
        total + (item.product?.discount_price || 0) * item.quantity, 0
      );
  }

  return 0;
};

/**
 * Sort coupons by eligibility and potential savings
 */
export const sortCouponsByValue = (
  couponsWithEligibility: Array<{
    coupon: Coupon;
    eligibility: CouponEligibility;
    discount: number;
  }>
): Array<{
  coupon: Coupon;
  eligibility: CouponEligibility;
  discount: number;
}> => {
  return couponsWithEligibility.sort((a, b) => {
    // Eligible coupons first
    if (a.eligibility.isEligible && !b.eligibility.isEligible) return -1;
    if (!a.eligibility.isEligible && b.eligibility.isEligible) return 1;

    // Among eligible, sort by discount amount (highest first)
    if (a.eligibility.isEligible && b.eligibility.isEligible) {
      return b.discount - a.discount;
    }

    // Among ineligible, sort by shortfall (closest to eligible first)
    if (!a.eligibility.isEligible && !b.eligibility.isEligible) {
      const shortfallA = a.eligibility.shortfall || Infinity;
      const shortfallB = b.eligibility.shortfall || Infinity;
      return shortfallA - shortfallB;
    }

    return 0;
  });
};