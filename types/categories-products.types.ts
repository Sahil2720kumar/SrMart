export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  color?: string;
  icon?: string;
  commission_rate: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  commission_rate?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CommissionType = 'default' | 'category' | 'subcategory' | 'custom';

export interface Product {
  id: string;
  vendor_id: string;
  category_id: string;
  sub_category_id?: string;
  sku: string;
  slug: string;
  name: string;
  description?: string;
  short_description?: string;
  price: number;
  discount_price?: number;
  discount_percentage: number;
  unit: string;
  stock_quantity: number;
  low_stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  image?: string;
  is_available: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  is_organic: boolean;
  is_veg: boolean;
  commission_type: CommissionType;
  commission_rate?: number;
  attributes: Record<string, any>;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}
