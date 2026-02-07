// delivery-orders.types.ts
// Additional types needed for the delivery order system

import { OrderStatus, PaymentStatus } from './orders-carts.types';
import { Customer, Vendor, DeliveryBoy, CustomerAddress } from './users.types';

/**
 * Extended Order type with populated relations for delivery boy view
 */
export interface DeliveryOrderWithRelations {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: string;
  delivery_fee: string;
  delivery_fee_paid_by_customer: string;
  delivery_otp: string | null;
  created_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  item_count: number;
  
  // Relations
  customers: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  
  customer_addresses: {
    id: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  };
  
  vendors: {
    user_id: string;
    store_name: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
  };
  
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit: string | null;
  }>;
}

/**
 * Transformed delivery order for UI consumption
 */
export interface DeliveryOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  delivery_boy_id:string
  customer: {
    name: string;
    address: string;
    phone: string;
    lat?: number;
    lng?: number;
  };
  vendors: DeliveryOrderVendor[];
  payout: number;
  distance: number;
  totalItems: number;
  deliveryOtp: string;
  created_at: string;
  pickup_address?: string;
}

/**
 * Vendor information in delivery order
 */
export interface DeliveryOrderVendor {
  id: string;
  name: string;
  address: string;
  items: DeliveryOrderItem[];
  collected: boolean;
}

/**
 * Item information in delivery order
 */
export interface DeliveryOrderItem {
  id: string;
  name: string;
  qty: string;
  collected: boolean;
}

/**
 * Delivery boy statistics
 */
export interface DeliveryBoyStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  totalDistance: number;
}

/**
 * Accept order mutation parameters
 */
export interface AcceptOrderParams {
  orderId: string;
}

/**
 * Mark order picked up mutation parameters
 */
export interface MarkOrderPickedUpParams {
  orderId: string;
}

/**
 * Complete delivery mutation parameters
 */
export interface CompleteDeliveryParams {
  orderId: string;
  otp: string;
}

/**
 * Delivery boy location update
 */
export interface DeliveryBoyLocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
}

/**
 * Order filters for delivery boy
 */
export interface DeliveryOrderFilters {
  status?: OrderStatus | 'all';
  startDate?: string;
  endDate?: string;
  minPayout?: number;
  maxDistance?: number;
}

/**
 * Delivery assignment notification
 */
export interface DeliveryAssignmentNotification {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  customerName: string;
  payout: number;
  distance: number;
  pickupAddress: string;
  deliveryAddress: string;
}

/**
 * Order tracking data
 */
export interface OrderTrackingData {
  orderId: string;
  status: OrderStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  deliveryBoy?: {
    name: string;
    phone: string;
    photo?: string;
    vehicleType?: string;
    vehicleNumber?: string;
  };
}

/**
 * Earnings breakdown
 */
export interface EarningsBreakdown {
  date: string;
  orders: number;
  earnings: number;
  distance: number;
}

/**
 * Daily earnings summary
 */
export interface DailyEarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  breakdown: EarningsBreakdown[];
}

/**
 * Delivery performance metrics
 */
export interface DeliveryPerformanceMetrics {
  totalDeliveries: number;
  successRate: number;
  averageRating: number;
  onTimeDeliveryRate: number;
  averageDeliveryTime: number; // in minutes
  totalEarnings: number;
  totalDistance: number;
}

/**
 * Order history item
 */
export interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  vendorName: string;
  payout: number;
  distance: number;
  status: OrderStatus;
  rating?: number;
}

/**
 * Delivery route waypoint
 */
export interface DeliveryWaypoint {
  type: 'pickup' | 'delivery';
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  name: string;
  orderId?: string;
}

/**
 * Optimized delivery route
 */
export interface OptimizedDeliveryRoute {
  waypoints: DeliveryWaypoint[];
  totalDistance: number;
  estimatedDuration: number; // in minutes
  totalEarnings: number;
}

/**
 * Delivery zone
 */
export interface DeliveryZone {
  id: string;
  name: string;
  polygon: Array<{ latitude: number; longitude: number }>;
  isActive: boolean;
  baseDeliveryFee: number;
  perKmRate: number;
}

/**
 * Delivery partner availability
 */
export interface DeliveryPartnerAvailability {
  isOnline: boolean;
  isAvailable: boolean;
  currentOrders: number;
  maxOrders: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
}

/**
 * Order acceptance response
 */
export interface OrderAcceptanceResponse {
  success: boolean;
  order: DeliveryOrder;
  message: string;
}

/**
 * Order completion response
 */
export interface OrderCompletionResponse {
  success: boolean;
  orderId: string;
  earnings: number;
  rating?: number;
  message: string;
}

/**
 * Delivery incident report
 */
export interface DeliveryIncidentReport {
  orderId: string;
  incidentType: 'customer_unavailable' | 'address_wrong' | 'item_damaged' | 'other';
  description: string;
  photos?: string[];
  timestamp: string;
}

/**
 * Customer feedback on delivery
 */
export interface DeliveryFeedback {
  orderId: string;
  deliveryBoyId: string;
  rating: number; // 1-5
  comment?: string;
  tags?: string[]; // e.g., ['on-time', 'professional', 'careful']
  timestamp: string;
}

/**
 * Delivery preferences
 */
export interface DeliveryPreferences {
  acceptRadius: number; // in km
  preferredZones: string[];
  minPayout: number;
  maxSimultaneousOrders: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

/**
 * Real-time order update
 */
export interface RealtimeOrderUpdate {
  orderId: string;
  status: OrderStatus;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Batch order acceptance
 */
export interface BatchOrderAcceptance {
  orderIds: string[];
  totalEarnings: number;
  totalDistance: number;
  estimatedDuration: number;
}

/**
 * Order cancellation by delivery boy
 */
export interface OrderCancellationRequest {
  orderId: string;
  reason: 'vehicle_breakdown' | 'emergency' | 'too_far' | 'other';
  description?: string;
}

/**
 * Tip received
 */
export interface TipReceived {
  orderId: string;
  amount: number;
  timestamp: string;
}

/**
 * Extended delivery boy with earnings
 */
export interface DeliveryBoyWithEarnings extends DeliveryBoy {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingPayout: number;
}

/**
 * Payout request
 */
export interface PayoutRequest {
  deliveryBoyId: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'upi' | 'cash';
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  upiId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
}

/**
 * Delivery shift
 */
export interface DeliveryShift {
  id: string;
  deliveryBoyId: string;
  startTime: string;
  endTime?: string;
  totalOrders: number;
  totalEarnings: number;
  totalDistance: number;
  status: 'active' | 'completed';
}

export type DeliveryOrderStatus = 
  | 'ready_for_pickup'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/**
 * Type guard to check if an order is deliverable
 */
export const isOrderDeliverable = (status: OrderStatus): boolean => {
  return ['ready_for_pickup', 'out_for_delivery'].includes(status);
};

/**
 * Type guard to check if an order is completed
 */
export const isOrderCompleted = (status: OrderStatus): boolean => {
  return status === 'delivered';
};

/**
 * Type guard to check if an order can be accepted
 */
export const canAcceptOrder = (order: DeliveryOrder): boolean => {
  return order.status === 'ready_for_pickup';
};

/**
 * Type guard to check if an order can be picked up
 */
export const canPickUpOrder = (order: DeliveryOrder): boolean => {
  return order.status === 'ready_for_pickup';
};

/**
 * Type guard to check if an order can be delivered
 */
export const canDeliverOrder = (order: DeliveryOrder): boolean => {
  return order.status === 'out_for_delivery';
};