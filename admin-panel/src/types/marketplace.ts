// Marketplace Types

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  businessInfo: {
    taxId?: string;
    businessLicense?: string;
  };
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  rating: number;
  totalOrders: number;
  onTimeDeliveryRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  supplierId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  brand?: string;
  model?: string;
  costPrice: number;
  sellingPrice: number;
  minimumPrice?: number;
  attributes: Record<string, any>;
  specifications: Record<string, any>;
  images: string[];
  status: 'active' | 'inactive' | 'discontinued';
  isFeatured: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords: string[];
  supplier?: Supplier;
  category?: ProductCategory;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  productSku: string;
  product?: Product;
  createdAt: string;
}

export interface Order {
  id: string;
  tenantId: string;
  clinicId: string;
  supplierId: string;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  shippingAddress?: Record<string, any>;
  supplier?: Supplier;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  tenantId: string;
  clinicId: string;
  productId: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reservedStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  averageCost?: number;
  lastCost?: number;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'expired';
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  clinicId: string;
  productId: string;
  inventoryId: string;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'waste';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  inventory?: Inventory;
  product?: Product;
  createdAt: string;
}

export interface MarketplaceOverview {
  suppliers: {
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    averageRating: number;
    topSuppliers: Array<{
      id: string;
      name: string;
      rating: number;
      totalOrders: number;
    }>;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    featuredProducts: number;
    categoriesCount: number;
  };
  orders: {
    totalOrders: number;
    statusStats: Record<string, number>;
    totalValue: number;
    averageOrderValue: number;
  };
  summary: {
    totalSuppliers: number;
    totalProducts: number;
    totalOrders: number;
    averageSupplierRating: number;
  };
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiredItems: number;
  totalValue: number;
}
