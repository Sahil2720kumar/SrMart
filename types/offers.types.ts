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

