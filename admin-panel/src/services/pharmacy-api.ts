import api from './api';

// Inventory API
export const pharmacyInventoryApi = {
  getInventory: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/pharmacy/inventory', { params });
    return response.data;
  },

  createInventory: async (data: any) => {
    const response = await api.post('/pharmacy/inventory', data);
    return response.data;
  },

  adjustStock: async (id: string, adjustment: number, reason: string) => {
    const response = await api.post(`/pharmacy/inventory/${id}/adjust`, { adjustment, reason });
    return response.data;
  },

  deleteInventory: async (id: string) => {
    await api.delete(`/pharmacy/inventory/${id}`);
  },
};

// Sales / POS API
export const pharmacySalesApi = {
  getSales: async (clinicId?: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (clinicId) params.clinicId = clinicId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/pharmacy/sales', { params });
    return response.data;
  },

  createSale: async (data: any) => {
    const response = await api.post('/pharmacy/sales', data);
    return response.data;
  },

  getSale: async (id: string) => {
    const response = await api.get(`/pharmacy/sales/${id}`);
    return response.data;
  },
};

// Prescriptions API
export const pharmacyPrescriptionsApi = {
  getPrescriptions: async (clinicId?: string, status?: string) => {
    const params: any = {};
    if (clinicId) params.clinicId = clinicId;
    if (status) params.status = status;
    const response = await api.get('/pharmacy/prescriptions', { params });
    return response.data;
  },

  createPrescription: async (data: any) => {
    const response = await api.post('/pharmacy/prescriptions', data);
    return response.data;
  },

  verifyPrescription: async (id: string) => {
    const response = await api.patch(`/pharmacy/prescriptions/${id}/verify`);
    return response.data;
  },

  markPickedUp: async (id: string) => {
    const response = await api.patch(`/pharmacy/prescriptions/${id}/pickup`);
    return response.data;
  },
};

// Suppliers API
export const pharmacySuppliersApi = {
  getSuppliers: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/pharmacy/suppliers', { params });
    return response.data;
  },

  createSupplier: async (data: any) => {
    const response = await api.post('/pharmacy/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: string, data: any) => {
    const response = await api.patch(`/pharmacy/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: string) => {
    await api.delete(`/pharmacy/suppliers/${id}`);
  },
};

// Dashboard API
export const pharmacyDashboardApi = {
  getDashboard: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/pharmacy/dashboard', { params });
    return response.data;
  },

  getExpiringDrugs: async (days: number = 30, clinicId?: string) => {
    const params: any = { days };
    if (clinicId) params.clinicId = clinicId;
    const response = await api.get('/pharmacy/expiring', { params });
    return response.data;
  },

  getLowStockDrugs: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/pharmacy/low-stock', { params });
    return response.data;
  },

  getOutOfStockDrugs: async (clinicId?: string) => {
    const params = clinicId ? { clinicId } : {};
    const response = await api.get('/pharmacy/out-of-stock', { params });
    return response.data;
  },
};

