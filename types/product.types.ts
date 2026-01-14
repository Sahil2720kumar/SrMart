export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category_id: string;
  image_urls?: string[];
  is_active: boolean;
}
