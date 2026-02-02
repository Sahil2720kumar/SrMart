# Enhanced Coupon Queries - Usage Examples

## Import Statement

```typescript
import {
  // Hooks
  useActiveCoupons,
  useCouponByCode,
  useValidateCoupon,
  useRecordCouponUsage,
  
  // Helper Functions
  filterEligibleItems,
  calculateCouponDiscountForCart,
  isCouponApplicableToCategory,
  isCouponApplicableToVendor,
  getCouponApplicabilityDescription,
  validateCartAgainstCoupon,
  
  // Types
  ExtendedCoupon,
} from '@/hooks/queries/orders';
```

---

## Example 1: Validate Coupon with Cart Items

```typescript
import { useValidateCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';

function ApplyCouponButton({ couponCode }: { couponCode: string }) {
  const { totalPrice, cartItems } = useCartStore();
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    try {
      const result = await validateCoupon.mutateAsync({
        couponCode,
        orderAmount: totalPrice,
        cartItems, // Pass cart items for category/vendor filtering
      });

      console.log('Coupon is valid!');
      console.log('Discount:', result.discountAmount);
      console.log('Eligible total:', result.eligibleTotal);
      
      if (result.eligibilityInfo) {
        console.log('Eligible items:', result.eligibilityInfo.eligibleItems.length);
        console.log('Ineligible items:', result.eligibilityInfo.ineligibleItems.length);
      }
      
      // Apply coupon to your store
      // ...
      
    } catch (error) {
      console.error('Validation failed:', error.message);
      // Show error to user
      // Possible errors:
      // - "No items in your cart are eligible for this coupon"
      // - "Add ₹X more of eligible items to use this coupon"
      // - "Coupon has expired"
      // etc.
    }
  };

  return (
    <button onClick={handleApply} disabled={validateCoupon.isPending}>
      Apply Coupon
    </button>
  );
}
```

---

## Example 2: Filter Eligible Items

```typescript
import { filterEligibleItems, ExtendedCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';

function CouponEligibilityCheck({ coupon }: { coupon: ExtendedCoupon }) {
  const { cartItems } = useCartStore();

  const { eligibleItems, eligibleTotal, ineligibleItems } = filterEligibleItems(
    cartItems,
    coupon
  );

  return (
    <div>
      <p>Eligible items: {eligibleItems.length}</p>
      <p>Eligible total: ₹{eligibleTotal.toFixed(2)}</p>
      <p>Ineligible items: {ineligibleItems.length}</p>
      
      {ineligibleItems.length > 0 && (
        <div className="warning">
          This coupon doesn't apply to {ineligibleItems.length} item(s) in your cart
        </div>
      )}
    </div>
  );
}
```

---

## Example 3: Calculate Discount for Cart

```typescript
import { calculateCouponDiscountForCart, ExtendedCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';

function DiscountPreview({ coupon }: { coupon: ExtendedCoupon }) {
  const { cartItems } = useCartStore();

  const {
    discount,
    eligibleTotal,
    eligibleItems,
    ineligibleItems,
  } = calculateCouponDiscountForCart(coupon, cartItems);

  const isPartiallyApplicable = 
    eligibleItems.length > 0 && 
    eligibleItems.length < cartItems.length;

  return (
    <div className="discount-preview">
      <h3>You'll save: ₹{discount.toFixed(2)}</h3>
      <p>Applied to ₹{eligibleTotal.toFixed(2)} worth of products</p>
      
      {isPartiallyApplicable && (
        <div className="warning">
          <Icon name="info" />
          This coupon applies to {eligibleItems.length} of {cartItems.length} items
        </div>
      )}
    </div>
  );
}
```

---

## Example 4: Check Category/Vendor Applicability

```typescript
import {
  isCouponApplicableToCategory,
  isCouponApplicableToVendor,
  ExtendedCoupon,
} from '@/hooks/queries/orders';

function ProductCouponBadge({
  product,
  coupon,
}: {
  product: Product;
  coupon: ExtendedCoupon;
}) {
  const isCategoryEligible = isCouponApplicableToCategory(
    coupon,
    product.category_id
  );
  
  const isVendorEligible = isCouponApplicableToVendor(
    coupon,
    product.vendor_id
  );
  
  const isEligible = isCategoryEligible && isVendorEligible;

  if (!isEligible) {
    return null;
  }

  return (
    <div className="badge">
      {coupon.code} applies to this product
    </div>
  );
}
```

---

## Example 5: Get Human-Readable Applicability

```typescript
import { getCouponApplicabilityDescription, ExtendedCoupon } from '@/hooks/queries/orders';

function CouponCard({ coupon }: { coupon: ExtendedCoupon }) {
  const applicabilityText = getCouponApplicabilityDescription(coupon);
  // Returns:
  // - "all products" (if no restrictions)
  // - "2 categories" (if has category filter)
  // - "3 vendors" (if has vendor filter)
  // - "2 categories and 3 vendors" (if both)

  return (
    <div className="coupon-card">
      <h3>{coupon.code}</h3>
      <p>Valid on {applicabilityText}</p>
    </div>
  );
}
```

---

## Example 6: Validate at Checkout

```typescript
import { validateCartAgainstCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import useDiscountStore from '@/store/useDiscountStore';

function CheckoutButton() {
  const { cartItems } = useCartStore();
  const { activeDiscount } = useDiscountStore();
  const { session } = useAuthStore();

  const handleCheckout = async () => {
    // Validate coupon one more time before checkout
    if (activeDiscount && session?.user?.id) {
      const validation = await validateCartAgainstCoupon(
        activeDiscount.code,
        cartItems,
        session.user.id
      );

      if (!validation.isValid) {
        alert(`Coupon validation failed: ${validation.error}`);
        return;
      }

      console.log('Coupon is valid!');
      console.log('Discount:', validation.discount);
      console.log('Eligible total:', validation.eligibleTotal);
    }

    // Proceed with checkout
    // ...
  };

  return <button onClick={handleCheckout}>Checkout</button>;
}
```

---

## Example 7: Record Coupon Usage After Order

```typescript
import { useRecordCouponUsage } from '@/hooks/queries/orders';
import useDiscountStore from '@/store/useDiscountStore';

function OrderConfirmation({ orderId }: { orderId: string }) {
  const { activeDiscount, discountAmount } = useDiscountStore();
  const recordUsage = useRecordCouponUsage();

  useEffect(() => {
    if (activeDiscount && orderId) {
      // Record that user used this coupon
      recordUsage.mutate({
        couponId: activeDiscount.couponId, // You'll need to store this
        orderId,
        discountAmount,
      });
    }
  }, [orderId]);

  return <div>Order placed successfully!</div>;
}
```

---

## Example 8: Display Eligible Items in Cart

```typescript
import { filterEligibleItems, ExtendedCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';

function CartWithCouponHighlight({ coupon }: { coupon: ExtendedCoupon }) {
  const { cartItems } = useCartStore();

  const { eligibleItems, ineligibleItems } = filterEligibleItems(
    cartItems,
    coupon
  );

  return (
    <div className="cart">
      {cartItems.map((item) => {
        const isEligible = eligibleItems.some(
          (ei) => ei.productId === item.productId
        );

        return (
          <div
            key={item.productId}
            className={isEligible ? 'eligible' : 'ineligible'}
          >
            <ProductCard product={item.product} />
            {isEligible && (
              <div className="badge">
                {coupon.code} applies here
              </div>
            )}
            {!isEligible && (
              <div className="info">
                Not eligible for {coupon.code}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Example 9: Show Minimum Order Requirement

```typescript
import { filterEligibleItems, ExtendedCoupon } from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';

function MinimumOrderWarning({ coupon }: { coupon: ExtendedCoupon }) {
  const { cartItems } = useCartStore();

  const { eligibleTotal } = filterEligibleItems(cartItems, coupon);

  const shortfall = coupon.min_order_amount - eligibleTotal;

  if (shortfall <= 0) {
    return null; // Requirement met
  }

  return (
    <div className="warning">
      Add ₹{shortfall.toFixed(0)} more of eligible items to use {coupon.code}
    </div>
  );
}
```

---

## Example 10: Complete Coupon Application Flow

```typescript
import {
  useValidateCoupon,
  calculateCouponDiscountForCart,
  ExtendedCoupon,
} from '@/hooks/queries/orders';
import useCartStore from '@/store/cartStore';
import useDiscountStore from '@/store/useDiscountStore';

function CouponApplicationFlow({ coupon }: { coupon: ExtendedCoupon }) {
  const { totalPrice, cartItems } = useCartStore();
  const { applyDiscount, calculateDiscountForCart } = useDiscountStore();
  const validateCoupon = useValidateCoupon();
  const [error, setError] = useState('');

  const handleApply = async () => {
    try {
      // Step 1: Validate with backend
      const result = await validateCoupon.mutateAsync({
        couponCode: coupon.code,
        orderAmount: totalPrice,
        cartItems,
      });

      // Step 2: Calculate what discount user will get
      const {
        discount,
        eligibleTotal,
        eligibleItems,
        ineligibleItems,
      } = calculateCouponDiscountForCart(coupon, cartItems);

      // Step 3: Apply to local store
      applyDiscount(
        coupon.code,
        coupon.discount_type === 'percentage' ? 'percent' : 'flat',
        totalPrice,
        coupon.discount_value,
        coupon.max_discount_amount,
        coupon.applicable_categories,
        coupon.applicable_vendors
      );

      // Step 4: Recalculate for cart
      calculateDiscountForCart(cartItems);

      // Step 5: Show success message
      const message = ineligibleItems.length > 0
        ? `${coupon.code} applied to ${eligibleItems.length} items! You're saving ₹${discount.toFixed(2)}`
        : `${coupon.code} applied! You're saving ₹${discount.toFixed(2)}`;

      alert(message);
      setError('');

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <button onClick={handleApply} disabled={validateCoupon.isPending}>
        {validateCoupon.isPending ? 'Applying...' : 'Apply Coupon'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

---

## Common Error Messages

The `useValidateCoupon` hook can throw these errors:

1. **"Invalid coupon code"** - Coupon doesn't exist or is inactive
2. **"Coupon not yet valid"** - Start date is in the future
3. **"Coupon has expired"** - End date has passed
4. **"No items in your cart are eligible for this coupon"** - Category/vendor filters exclude all cart items
5. **"Add ₹X more of eligible items to use this coupon"** - Minimum order requirement not met
6. **"Coupon usage limit reached"** - Total usage limit exceeded
7. **"You have already used this coupon maximum times"** - Per-user limit exceeded

Handle these appropriately in your UI!

---

## Testing Scenarios

### Test 1: Category-Specific Coupon
```typescript
const coupon: ExtendedCoupon = {
  code: 'VEGGIE50',
  discount_type: 'percentage',
  discount_value: 50,
  applicable_categories: ['cat_vegetables'],
  // ... other fields
};

// Cart with mixed items
const cartItems = [
  { product: { category_id: 'cat_vegetables', price: 100 } }, // Eligible
  { product: { category_id: 'cat_dairy', price: 200 } },      // Not eligible
];

// Result: Only vegetable products get 50% off
```

### Test 2: Vendor-Specific Coupon
```typescript
const coupon: ExtendedCoupon = {
  code: 'ORGANIC100',
  discount_type: 'flat',
  discount_value: 100,
  applicable_vendors: ['vendor_organic_farm'],
  // ... other fields
};

// Cart with mixed vendors
const cartItems = [
  { product: { vendor_id: 'vendor_organic_farm', price: 300 } }, // Eligible
  { product: { vendor_id: 'vendor_regular', price: 200 } },      // Not eligible
];

// Result: ₹100 off on organic farm products only
```

### Test 3: Category + Vendor Combo
```typescript
const coupon: ExtendedCoupon = {
  code: 'PREMIUMDAIRY30',
  discount_type: 'percentage',
  discount_value: 30,
  applicable_categories: ['cat_dairy'],
  applicable_vendors: ['vendor_premium1', 'vendor_premium2'],
  max_discount_amount: 200,
  // ... other fields
};

// Result: 30% off only on dairy products from premium vendors
```