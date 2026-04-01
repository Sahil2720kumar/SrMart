import { Coupon } from '@/types/offers.types';
import { Product, SubCategory } from '@/types/categories-products.types';
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
  subCategoryName?: string;
  subCategorySlug?: string;
}

export interface CartItemWithDetails extends CartProduct {
  productDetails?: ProductWithCategory;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export const checkCouponEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  totalPrice: number,
  categories?: Array<{ id: string; name: string; slug: string }>,
  subCategories?: Array<{ id: string; name: string; slug: string }>,
): CouponEligibility => {
  // 1. Minimum order amount
  if (totalPrice < coupon.min_order_amount) {
    return {
      isEligible: false,
      reason: `Add ₹${(coupon.min_order_amount - totalPrice).toFixed(0)} more to cart`,
      requirementsMet: false,
      shortfall: coupon.min_order_amount - totalPrice,
    };
  }

  // 2. Applicable to everything
  if (coupon.applicable_to === 'all') {
    return { isEligible: true, requirementsMet: true };
  }

  // 3. Category-specific
  if (coupon.applicable_to === 'category' && coupon.applicable_id) {
    return checkCategoryEligibility(coupon, cartItems, categories);
  }

  // 4. Sub-category-specific  ← was wrongly calling checkCategoryEligibility before
  if (coupon.applicable_to === 'subcategory' && coupon.applicable_id) {
    return checkSubCategoryEligibility(coupon, cartItems, subCategories);
  }

  // 5. Product-specific
  if (coupon.applicable_to === 'product' && coupon.applicable_id) {
    return checkProductEligibility(coupon, cartItems);
  }

  // 6. Vendor coupons — not supported client-side yet
  if (coupon.applicable_to === 'vendor') {
    return {
      isEligible: false,
      reason: 'This coupon is only valid for a specific vendor',
      requirementsMet: false,
    };
  }

  return { isEligible: true, requirementsMet: true };
};

// ─── Category ─────────────────────────────────────────────────────────────────

const checkCategoryEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  categories?: Array<{ id: string; name: string; slug: string }>,
): CouponEligibility => {
  const targetCategory = categories?.find(c => c.id === coupon.applicable_id);
  const categoryName = targetCategory?.name ?? 'this category';
  const categorySlug = targetCategory?.slug ?? '';

  const applicableItems = cartItems.filter(
    item => item.product?.category_id === coupon.applicable_id,
  );

  if (applicableItems.length === 0) {
    return {
      isEligible: false,
      reason: `Add items from ${categoryName} to use this coupon`,
      requirementsMet: false,
    };
  }

  const vegConflict = checkVegNonVegConflict(categorySlug, categoryName, cartItems);
  if (!vegConflict.isEligible) return vegConflict;

  return { isEligible: true, requirementsMet: true };
};

// ─── Sub-category ─────────────────────────────────────────────────────────────

const checkSubCategoryEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  subCategories?: Array<{ id: string; name: string; slug: string }>,
): CouponEligibility => {
  const targetSubCategory = subCategories?.find(sc => sc.id === coupon.applicable_id);
  const subCategoryName = targetSubCategory?.name ?? 'this sub-category';
  const subCategorySlug = targetSubCategory?.slug ?? '';

  // Match on sub_category_id — the field that actually exists on the product
  const applicableItems = cartItems.filter(
    item => item.product?.sub_category_id === coupon.applicable_id,
  );

  if (applicableItems.length === 0) {
    return {
      isEligible: false,
      reason: `Add items from ${subCategoryName} to use this coupon`,
      requirementsMet: false,
    };
  }

  const vegConflict = checkVegNonVegConflict(subCategorySlug, subCategoryName, applicableItems);
  if (!vegConflict.isEligible) return vegConflict;

  return { isEligible: true, requirementsMet: true };
};

// ─── Veg / Non-veg conflict ───────────────────────────────────────────────────

const checkVegNonVegConflict = (
  slug: string,
  name: string,
  cartItems: CartItemWithDetails[],
): CouponEligibility => {
  const lowerSlug = slug.toLowerCase();
  const lowerName = name.toLowerCase();

  const isVegCoupon =
    lowerSlug.includes('veg') ||
    lowerSlug.includes('vegetable') ||
    lowerName.includes('veg');

  if (isVegCoupon) {
    const nonVegItems = cartItems.filter(item => item.product?.is_veg === false);

    if (nonVegItems.length > 0) {
      return {
        isEligible: false,
        reason: 'Remove non-veg items to apply this coupon',
        conflictingItems: nonVegItems.map(item => ({
          id: item.productId,
          name: item.product?.name ?? 'Unknown',
          category: item.productDetails?.categoryName,
        })),
        requirementsMet: false,
      };
    }
  }

  return { isEligible: true, requirementsMet: true };
};

// ─── Product ──────────────────────────────────────────────────────────────────

const checkProductEligibility = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
): CouponEligibility => {
  const hasProduct = cartItems.some(item => item.productId === coupon.applicable_id);

  if (!hasProduct) {
    return {
      isEligible: false,
      reason: 'Required product is not in your cart',
      requirementsMet: false,
    };
  }

  return { isEligible: true, requirementsMet: true };
};

// ─── Utilities (exported for use in hooks / UI) ───────────────────────────────

export const getConflictingItems = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
  categories?: Array<{ id: string; name: string; slug: string }>,
): Array<{ id: string; name: string; reason: string }> => {
  if (coupon.applicable_to !== 'category' || !coupon.applicable_id) return [];

  const targetCategory = categories?.find(c => c.id === coupon.applicable_id);
  const isVegCoupon =
    (targetCategory?.slug ?? '').toLowerCase().includes('veg') ||
    (targetCategory?.name ?? '').toLowerCase().includes('veg');

  if (!isVegCoupon) return [];

  return cartItems
    .filter(item => item.product?.is_veg === false)
    .map(item => ({
      id: item.productId,
      name: item.product?.name ?? 'Unknown',
      reason: 'Non-veg item conflicts with veg coupon',
    }));
};

export const calculateDiscountableValue = (
  coupon: Coupon,
  cartItems: CartItemWithDetails[],
): number => {
  const price = (item: CartItemWithDetails) =>
    (item.product?.discount_price ?? 0) * item.quantity;

  if (coupon.applicable_to === 'all') {
    return cartItems.reduce((sum, item) => sum + price(item), 0);
  }

  if (coupon.applicable_to === 'category' && coupon.applicable_id) {
    return cartItems
      .filter(item => item.product?.category_id === coupon.applicable_id)
      .reduce((sum, item) => sum + price(item), 0);
  }

  if (coupon.applicable_to === 'subcategory' && coupon.applicable_id) {
    return cartItems
      .filter(item => item.product?.sub_category_id === coupon.applicable_id)
      .reduce((sum, item) => sum + price(item), 0);
  }

  if (coupon.applicable_to === 'product' && coupon.applicable_id) {
    return cartItems
      .filter(item => item.productId === coupon.applicable_id)
      .reduce((sum, item) => sum + price(item), 0);
  }

  return 0;
};

export const sortCouponsByValue = <T extends { eligibility: CouponEligibility; discount: number }>(
  coupons: T[],
): T[] =>
  [...coupons].sort((a, b) => {
    if (a.eligibility.isEligible !== b.eligibility.isEligible)
      return a.eligibility.isEligible ? -1 : 1;

    if (a.eligibility.isEligible && b.eligibility.isEligible)
      return b.discount - a.discount;

    // Both ineligible — surface the ones closest to qualifying
    const sa = a.eligibility.shortfall ?? Infinity;
    const sb = b.eligibility.shortfall ?? Infinity;
    return sa - sb;
  });