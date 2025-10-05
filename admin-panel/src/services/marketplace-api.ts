import api from './api';

// Suppliers API
export const suppliersApi = {
  getSuppliers: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/marketplace/suppliers', { params });
    return response.data;
  },

  getSupplier: async (id: string) => {
    const response = await api.get(`/marketplace/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (supplierData: any) => {
    const response = await api.post('/marketplace/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (id: string, supplierData: any) => {
    const response = await api.patch(`/marketplace/suppliers/${id}`, supplierData);
    return response.data;
  },

  deleteSupplier: async (id: string) => {
    await api.delete(`/marketplace/suppliers/${id}`);
  },

  getSupplierStats: async () => {
    const response = await api.get('/marketplace/suppliers/stats/overview');
    return response.data;
  },
};

// Products API
export const productsApi = {
  getProducts: async (filters?: any) => {
    const response = await api.get('/marketplace/products', { params: filters });
    return response.data;
  },

  getProduct: async (id: string) => {
    const response = await api.get(`/marketplace/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/marketplace/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await api.patch(`/marketplace/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    await api.delete(`/marketplace/products/${id}`);
  },

  searchProducts: async (searchTerm: string, filters?: any) => {
    const params = { q: searchTerm, ...filters };
    const response = await api.get('/marketplace/products/search', { params });
    return response.data;
  },

  getFeaturedProducts: async (limit?: number) => {
    const params = limit ? { limit } : {};
    const response = await api.get('/marketplace/products/featured', { params });
    return response.data;
  },

  getProductStats: async () => {
    const response = await api.get('/marketplace/products/stats/overview');
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  getOrders: async (filters?: any) => {
    const response = await api.get('/marketplace/orders', { params: filters });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await api.get(`/marketplace/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: any) => {
    const response = await api.post('/marketplace/orders', orderData);
    return response.data;
  },

  updateOrder: async (id: string, orderData: any) => {
    const response = await api.patch(`/marketplace/orders/${id}`, orderData);
    return response.data;
  },

  confirmOrder: async (id: string) => {
    const response = await api.patch(`/marketplace/orders/${id}/confirm`);
    return response.data;
  },

  markAsDelivered: async (id: string) => {
    const response = await api.patch(`/marketplace/orders/${id}/delivered`);
    return response.data;
  },
};

// Inventory API
export const inventoryApi = {
  getInventory: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getInventoryItem: async (id: string) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  createInventoryItem: async (inventoryData: any) => {
    const response = await api.post('/inventory', inventoryData);
    return response.data;
  },

  updateInventoryItem: async (id: string, inventoryData: any) => {
    const response = await api.patch(`/inventory/${id}`, inventoryData);
    return response.data;
  },

  deleteInventoryItem: async (id: string) => {
    await api.delete(`/inventory/${id}`);
  },

  getLowStockItems: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/inventory/low-stock', { params });
    return response.data;
  },

  getExpiredItems: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/inventory/expired', { params });
    return response.data;
  },

  getExpiringSoon: async (days?: number, clinicId?: string) => {
    const params = { days, clinicId };
    const response = await api.get('/inventory/expiring-soon', { params });
    return response.data;
  },

  adjustInventory: async (id: string, adjustment: number, reason: string) => {
    const response = await api.post(`/inventory/${id}/adjust`, { adjustment, reason });
    return response.data;
  },

  getInventoryTransactions: async (filters?: any) => {
    const response = await api.get('/inventory/transactions', { params: filters });
    return response.data;
  },

  getInventoryStats: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/inventory/stats', { params });
    return response.data;
  },
};

// Marketplace overview
export const marketplaceApi = {
  getOverview: async () => {
    const response = await api.get('/marketplace/overview');
    return response.data;
  },
};
