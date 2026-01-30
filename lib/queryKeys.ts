// lib/queryKeys.ts
// Centralized query keys for the entire application

export const queryKeys = {
  // ==========================================
  // 1. AUTHENTICATION & USER MANAGEMENT
  // ==========================================
  users: {
    all: ['users'] as const,
    detail: (userId: string) => ['users', userId] as const,
    byEmail: (email: string) => ['users', 'email', email] as const,
    byPhone: (phone: string) => ['users', 'phone', phone] as const,
    byRole: (role: string) => ['users', 'role', role] as const,
  },

  customers: {
    all: ['customers'] as const,
    detail: (customerId: string) => ['customers', customerId] as const,
    byUser: (userId: string) => ['customers', 'user', userId] as const,
  },

  vendors: {
    all: ['vendors'] as const,
    list: (filters?: {
      city?: string;
      isVerified?: boolean;
      isOpen?: boolean;
      search?: string;
    }) => ['vendors', 'list', filters] as const,
    detail: (vendorId: string) => ['vendors', vendorId] as const,
    byUser: (userId: string) => ['vendors', 'user', userId] as const,
    nearby: (lat: number, lng: number, radius?: number) => 
      ['vendors', 'nearby', lat, lng, radius] as const,
    byCity: (city: string) => ['vendors', 'city', city] as const,
    kycPending: ['vendors', 'kyc', 'pending'] as const,
  },

  deliveryBoys: {
    all: ['delivery-boys'] as const,
    detail: (deliveryBoyId: string) => ['delivery-boys', deliveryBoyId] as const,
    byUser: (userId: string) => ['delivery-boys', 'user', userId] as const,
    available: ['delivery-boys', 'available'] as const,
    online: ['delivery-boys', 'online'] as const,
    nearby: (lat: number, lng: number) => ['delivery-boys', 'nearby', lat, lng] as const,
  },

  // ==========================================
  // 2. PRODUCT CATALOG
  // ==========================================
  categories: {
    all: ['categories'] as const,
    active: ['categories', 'active'] as const,
    allWithSubCategories: ['categories', 'sub_categories'] as const,
    detail: (categoryId: string) => ['categories', categoryId] as const,
    bySlug: (slug: string) => ['categories', 'slug', slug] as const,
    withCommission: ['categories', 'commission'] as const,
  },

  subCategories: {
    all: ['sub-categories'] as const,
    byCategory: (categoryId: string) => ['sub-categories', 'category', categoryId] as const,
    detail: (subCategoryId: string) => ['sub-categories', subCategoryId] as const,
    active: (categoryId: string) => ['sub-categories', 'category', categoryId, 'active'] as const,
  },

  products: {
    all: ['products'] as const,
    list: (filters?: {
      vendorId?: string;
      categoryId?: string;
      subCategoryId?: string;
      search?: string;
      isAvailable?: boolean;
      isTrending?: boolean;
      isBestSeller?: boolean;
      isFeatured?: boolean;
      isOrganic?: boolean;
      isVeg?: boolean;
      minPrice?: number;
      maxPrice?: number;
      sortBy?: string;
      page?: number;
      limit?: number;
    }) => ['products', 'list', filters] as const,
    detail: (productId: string) => ['products', productId] as const,
    byVendor: (vendorId: string, filters?: any) => ['products', 'vendor', vendorId, filters] as const,
    byCategory: (categoryId: string) => ['products', 'category', categoryId] as const,
    bySubCategory: (subCategoryId: string) => ['products', 'sub-category', subCategoryId] as const,
    bySku: (sku: string) => ['products', 'sku', sku] as const,
    bySlug: (slug: string) => ['products', 'slug', slug] as const,
    trending: ['products', 'trending'] as const,
    bestSellers: ['products', 'best-sellers'] as const,
    featured: ['products', 'featured'] as const,
    lowStock: (vendorId: string) => ['products', 'vendor', vendorId, 'low-stock'] as const,
    outOfStock: (vendorId: string) => ['products', 'vendor', vendorId, 'out-of-stock'] as const,
    search: (query: string) => ['products', 'search', query] as const,
  },

  productImages: {
    byProduct: (productId: string) => ['product-images', 'product', productId] as const,
    primary: (productId: string) => ['product-images', 'product', productId, 'primary'] as const,
  },

  // ==========================================
  // 3. PROMOTIONS & DISCOUNTS
  // ==========================================
  coupons: {
    all: ['coupons'] as const,
    active: ['coupons', 'active'] as const,
    detail: (couponId: string) => ['coupons', couponId] as const,
    byCode: (code: string) => ['coupons', 'code', code] as const,
    available: (customerId: string) => ['coupons', 'customer', customerId, 'available'] as const,
    validate: (code: string, customerId: string, amount: number) => 
      ['coupons', 'validate', code, customerId, amount] as const,
  },

  couponUsage: {
    byCustomer: (customerId: string) => ['coupon-usage', 'customer', customerId] as const,
    byCoupon: (couponId: string) => ['coupon-usage', 'coupon', couponId] as const,
  },

  offers: {
    all: ['offers'] as const,
    active: ['offers', 'active'] as const,
    detail: (offerId: string) => ['offers', offerId] as const,
    byType: (type: string) => ['offers', 'type', type] as const,
  },

  flashSales: {
    all: ['flash-sales'] as const,
    active: ['flash-sales', 'active'] as const,
    detail: (flashSaleId: string) => ['flash-sales', flashSaleId] as const,
    byProduct: (productId: string) => ['flash-sales', 'product', productId] as const,
  },

  // ==========================================
  // 4. CUSTOMER DATA
  // ==========================================
  addresses: {
    all: (customerId: string) => ['addresses', 'customer', customerId] as const,
    detail: (addressId: string) => ['addresses', addressId] as const,
    default: (customerId: string) => ['addresses', 'customer', customerId, 'default'] as const,
  },

  cart: {
    all: (customerId: string) => ['cart', 'customer', customerId] as const,
    count: (customerId: string) => ['cart', 'customer', customerId, 'count'] as const,
    total: (customerId: string) => ['cart', 'customer', customerId, 'total'] as const,
  },

  wishlist: {
    all: (customerId: string) => ['wishlist', 'customer', customerId] as const,
    count: (customerId: string) => ['wishlist', 'customer', customerId, 'count'] as const,
    check: (customerId: string, productId: string) => 
      ['wishlist', 'check', customerId, productId] as const,
  },

  // ==========================================
  // 5. ORDERS & FULFILLMENT
  // ==========================================
  orders: {
    all: ['orders'] as const,
    list: (filters?: {
      customerId?: string;
      vendorId?: string;
      deliveryBoyId?: string;
      status?: string;
      paymentStatus?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }) => ['orders', 'list', filters] as const,
    detail: (orderId: string) => ['orders', orderId] as const,
    byCustomer: (customerId: string, filters?: any) => 
      ['orders', 'customer', customerId, filters] as const,
    byVendor: (vendorId: string, filters?: any) => 
      ['orders', 'vendor', vendorId, filters] as const,
    byDeliveryBoy: (deliveryBoyId: string, filters?: any) => 
      ['orders', 'delivery-boy', deliveryBoyId, filters] as const,
    byNumber: (orderNumber: string) => ['orders', 'number', orderNumber] as const,
    pending: (vendorId: string) => ['orders', 'vendor', vendorId, 'pending'] as const,
    active: (deliveryBoyId: string) => ['orders', 'delivery-boy', deliveryBoyId, 'active'] as const,
    stats: (userId: string, userType: string) => 
      ['orders', 'stats', userId, userType] as const,
  },

  orderItems: {
    byOrder: (orderId: string) => ['order-items', 'order', orderId] as const,
  },

  orderTracking: {
    byOrder: (orderId: string) => ['order-tracking', 'order', orderId] as const,
  },

  // ==========================================
  // 6. SEARCH & ANALYTICS
  // ==========================================
  recentSearches: {
    byCustomer: (customerId: string, limit?: number) => 
      ['recent-searches', 'customer', customerId, limit] as const,
  },

  searchAnalytics: {
    trending: (limit?: number) => ['search-analytics', 'trending', limit] as const,
    byQuery: (query: string) => ['search-analytics', 'query', query] as const,
  },

  trendingSearches: {
    daily: ['trending-searches', 'daily'] as const,
    weekly: ['trending-searches', 'weekly'] as const,
    byCategory: (categoryId: string) => ['trending-searches', 'category', categoryId] as const,
  },

  // ==========================================
  // 7. REVIEWS & RATINGS
  // ==========================================
  reviews: {
    all: ['reviews'] as const,
    detail: (reviewId: string) => ['reviews', reviewId] as const,
    byVendor: (vendorId: string, filters?: any) => 
      ['reviews', 'vendor', vendorId, filters] as const,
    byProduct: (productId: string, filters?: any) => 
      ['reviews', 'product', productId, filters] as const,
    byDeliveryBoy: (deliveryBoyId: string) => 
      ['reviews', 'delivery-boy', deliveryBoyId] as const,
    byCustomer: (customerId: string) => ['reviews', 'customer', customerId] as const,
    pending: ['reviews', 'pending'] as const,
  },

  // ==========================================
  // 8. NOTIFICATIONS
  // ==========================================
  notifications: {
    all: (userId: string) => ['notifications', 'user', userId] as const,
    unread: (userId: string) => ['notifications', 'user', userId, 'unread'] as const,
    count: (userId: string) => ['notifications', 'user', userId, 'count'] as const,
    byType: (userId: string, type: string) => 
      ['notifications', 'user', userId, 'type', type] as const,
  },

  // ==========================================
  // 9. PAYMENT & TRANSACTIONS
  // ==========================================
  paymentTransactions: {
    all: ['payment-transactions'] as const,
    detail: (transactionId: string) => ['payment-transactions', transactionId] as const,
    byOrder: (orderId: string) => ['payment-transactions', 'order', orderId] as const,
    byStatus: (status: string) => ['payment-transactions', 'status', status] as const,
  },

  // ==========================================
  // 10. VENDOR MANAGEMENT
  // ==========================================
  vendorBankDetails: {
    byVendor: (vendorId: string) => ['vendor-bank-details', 'vendor', vendorId] as const,
    pending: ['vendor-bank-details', 'pending'] as const,
  },

  kycDocuments: {
    byUser: (userId: string, userType: string) => 
      ['kyc-documents', 'user', userId, userType] as const,
    pending: ['kyc-documents', 'pending'] as const,
  },

  deliveryVehicles: {
    byDeliveryBoy: (deliveryBoyId: string) => 
      ['delivery-vehicles', 'delivery-boy', deliveryBoyId] as const,
  },

  // ==========================================
  // 11. WALLET & EARNINGS
  // ==========================================
  wallets: {
    byUser: (userId: string) => ['wallets', 'user', userId] as const,
    detail: (walletId: string) => ['wallets', walletId] as const,
  },

  walletTransactions: {
    byWallet: (walletId: string, filters?: any) => 
      ['wallet-transactions', 'wallet', walletId, filters] as const,
  },

  cashoutRequests: {
    all: ['cashout-requests'] as const,
    byWallet: (walletId: string) => ['cashout-requests', 'wallet', walletId] as const,
    pending: ['cashout-requests', 'pending'] as const,
    detail: (requestId: string) => ['cashout-requests', requestId] as const,
  },

  stockMovements: {
    byProduct: (productId: string, filters?: any) => 
      ['stock-movements', 'product', productId, filters] as const,
  },

  vendorPayouts: {
    byVendor: (vendorId: string, filters?: any) => 
      ['vendor-payouts', 'vendor', vendorId, filters] as const,
    byOrder: (orderId: string) => ['vendor-payouts', 'order', orderId] as const,
  },

  deliveryEarnings: {
    byDeliveryBoy: (deliveryBoyId: string, filters?: any) => 
      ['delivery-earnings', 'delivery-boy', deliveryBoyId, filters] as const,
    byOrder: (orderId: string) => ['delivery-earnings', 'order', orderId] as const,
  },

  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================
  dashboard: {
    customer: (customerId: string) => ['dashboard', 'customer', customerId] as const,
    vendor: (vendorId: string) => ['dashboard', 'vendor', vendorId] as const,
    deliveryBoy: (deliveryBoyId: string) => ['dashboard', 'delivery-boy', deliveryBoyId] as const,
    admin: ['dashboard', 'admin'] as const,
  },

  analytics: {
    sales: (vendorId: string, period: string) => 
      ['analytics', 'sales', vendorId, period] as const,
    revenue: (vendorId: string, period: string) => 
      ['analytics', 'revenue', vendorId, period] as const,
    topProducts: (vendorId: string, limit?: number) => 
      ['analytics', 'top-products', vendorId, limit] as const,
    deliveryStats: (deliveryBoyId: string, period: string) => 
      ['analytics', 'delivery-stats', deliveryBoyId, period] as const,
  },
} as const;