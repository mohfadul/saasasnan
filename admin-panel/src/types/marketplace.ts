/**
 * Marketplace Type Definitions
 */

// Supplier Types
export interface Supplier {
  id: string;
  tenant_id: string;
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  };
  address: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  tax_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  contact_info: Supplier['contact_info'];
  address: Supplier['address'];
  tax_id?: string;
  status?: Supplier['status'];
}

// Product Types (matches existing component usage)
export interface Product {
  id: string;
  tenant_id: string;
  supplier_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  manufacturer?: string;
  brand?: string;
  model?: string;
  unitPrice: number;
  unit_price: number;
  sellingPrice: number;
  costPrice: number;
  cost_price?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  unit: string;
  unitOfMeasure?: string;
  status: 'active' | 'inactive' | 'discontinued';
  isActive?: boolean;
  is_featured: boolean;
  isFeatured: boolean;
  requiresPrescription?: boolean;
  specifications?: Record<string, any>;
  image_url?: string;
  imageUrl?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  category?: string;
}

// Product Category (enum for compatibility with existing code)
export enum ProductCategory {
  DENTAL_EQUIPMENT = 'DENTAL_EQUIPMENT',
  CONSUMABLES = 'CONSUMABLES',
  INSTRUMENTS = 'INSTRUMENTS',
  MATERIALS = 'MATERIALS',
  PHARMACEUTICALS = 'PHARMACEUTICALS',
  PROTECTIVE_EQUIPMENT = 'PROTECTIVE_EQUIPMENT',
  DIAGNOSTIC = 'DIAGNOSTIC',
  OTHER = 'OTHER',
}

export interface ProductCategoryEntity {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  supplier_id: string;
  category_id?: string;
  name: string;
  description?: string;
  sku?: string;
  unit_price: number;
  cost_price?: number;
  unit: string;
  status?: Product['status'];
  is_featured?: boolean;
  specifications?: Record<string, any>;
  image_url?: string;
}

// Order Types
export interface Order {
  id: string;
  tenant_id: string;
  clinic_id: string;
  supplier_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  expected_delivery?: string;
  delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  total_price: number;
  product?: Product;
}

export interface CreateOrderRequest {
  clinic_id: string;
  supplier_id: string;
  expected_delivery?: string;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

// Inventory Types (matches existing component usage)
export interface Inventory {
  id: string;
  tenant_id: string;
  clinic_id: string;
  product_id: string;
  quantity: number;
  currentStock: number;
  reservedStock: number;
  min_stock_level: number;
  minimumStock: number;
  max_stock_level: number;
  maximumStock: number;
  reorder_point: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  expiryDate?: string;
  last_restocked?: string;
  averageCost?: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  clinic_id: string;
  product_id: string;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
  last_restocked?: string;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: string;
  tenant_id: string;
  inventory_id: string;
  transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'transfer' | 'waste';
  quantity: number;
  reference_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export interface CreateInventoryRequest {
  clinic_id: string;
  product_id: string;
  quantity: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_point?: number;
  location?: string;
  batch_number?: string;
  expiry_date?: string;
}

// Stats Types
export interface MarketplaceOverview {
  suppliers: {
    totalSuppliers: number;
    activeSuppliers: number;
    averageRating: number;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    featuredProducts: number;
  };
  orders: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalValue: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    expiringSoon: number;
    totalValue: number;
  };
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  suspendedSuppliers: number;
  averageRating: number;
  topSuppliers: Array<{
    id: string;
    name: string;
    totalOrders: number;
    totalValue: number;
    rating: number;
  }>;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringSoon: number;
  expiredItems: number;
}
