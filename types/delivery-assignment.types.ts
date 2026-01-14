export interface DeliveryAssignment {
  id: string;
  order_id: string;
  delivery_boy_id: string;
  assigned_at: string;
  picked_at?: string;
  delivered_at?: string;
}
