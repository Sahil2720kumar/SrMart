export type OfferApplicableTo =
  | 'all'
  | 'category'
  | 'vendor'
  | 'product';

export type OfferType =
  | 'discount'
  | 'bogo'
  | 'bundle'
  | 'free_delivery'
  | 'clearance'
  | 'combo'
  | 'flash_sale';

export type DiscountType =
  | 'percentage'
  | 'flat'
  | 'bogo';

export type CouponApplicableTo = 'all' | 'category' | 'vendor' | 'product';

export interface Offer {
  id: string;                     // uuid
  title: string;
  description?: string | null;

  discount: string;               // "20% OFF", "₹100 OFF"
  offer_type: OfferType;

  discount_type?: DiscountType | null;
  discount_value?: number | null;

  applicable_to: OfferApplicableTo;
  applicable_id?: string | null;  // NULL when using junction tables

  min_purchase_amount?: number | null;

  start_date: string;             // ISO string
  end_date?: string | null;

  is_active: boolean;
  display_order: number;

  bg_color?: string | null;
  tag?: string | null;
  banner_image?: string | null;

  item_count: number;

  created_at: string;
  updated_at: string;
}

export interface OfferProduct {
  id: string;          // uuid
  offer_id: string;   // FK → offers.id
  product_id: string; // FK → products.id
  created_at: string;
}

export interface OfferWithProducts extends Offer {
  products: {
    id: string;
    name: string;
    price: number;
    image?: string | null;
  }[];
}

export interface ProductOffer {
  offer_id: string;
  title: string;
  discount_type: DiscountType;
  discount_value: number;
  offer_type: OfferType;
}

export type OfferInsert = Omit<
  Offer,
  'id' | 'created_at' | 'updated_at' | 'item_count'
>;

export type OfferProductInsert = Omit<
  OfferProduct,
  'id' | 'created_at'
>;



export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_user: number;
  applicable_to: CouponApplicableTo;
  applicable_id?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}


export interface CouponUsage {
  id: string;                 // uuid
  coupon_id: string;          // uuid → coupons.id
  customer_id: string;        // uuid → customers.user_id
  order_id: string;           // uuid → orders.id
  discount_amount: number;    // numeric(10,2)
  used_at: string;            // timestamptz (ISO string)
}
