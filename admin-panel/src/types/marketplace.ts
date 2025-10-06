// Marketplace Types

export enum ProductCategory {
  DENTAL_EQUIPMENT = 'dental_equipment',
  INSTRUMENTS = 'instruments',
  CONSUMABLES = 'consumables',
  MEDICATIONS = 'medications',
  STERILIZATION = 'sterilization',
  PPE = 'ppe',
  OFFICE_SUPPLIES = 'office_supplies',
  IMAGING = 'imaging',
  LABORATORY = 'laboratory',
  ORTHODONTICS = 'orthodontics',
  PERIODONTICS = 'periodontics',
  ENDODONTICS = 'endodontics',
}

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

export interface ProductCategoryEntity {
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
  category?: ProductCategoryEntity | ProductCategory | string;
  name: string;
  description?: string;
  sku: string;
  manufacturer?: string;
  barcode?: string;
  brand?: string;
  model?: string;
  unitOfMeasure?: string;
  costPrice: number;
  unitPrice?: number;
  wholesalePrice?: number;
  sellingPrice: number;
  retailPrice?: number;
  minimumPrice?: number;
  attributes: Record<string, any>;
  specifications: Record<string, any>;
  images: string[];
  imageUrl?: string;
  status: 'active' | 'inactive' | 'discontinued';
  isActive?: boolean;
  isFeatured: boolean;
  requiresPrescription?: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  searchKeywords: string[];
  supplier?: Supplier;
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
