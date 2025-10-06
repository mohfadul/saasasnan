import api from './api';

// Clinical Notes API
export const clinicalNotesApi = {
  // Get all clinical notes with filters
  getClinicalNotes: async (filters?: {
    patientId?: string;
    providerId?: string;
    noteType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get('/clinical/notes', { params: filters });
    return response.data;
  },

  // Get a single clinical note
  getClinicalNote: async (id: string) => {
    const response = await api.get(`/clinical/notes/${id}`);
    return response.data;
  },

  // Create a new clinical note
  createClinicalNote: async (noteData: any) => {
    const response = await api.post('/clinical/notes', noteData);
    return response.data;
  },

  // Update a clinical note
  updateClinicalNote: async (id: string, noteData: any) => {
    const response = await api.patch(`/clinical/notes/${id}`, noteData);
    return response.data;
  },

  // Finalize a clinical note (lock for editing)
  finalizeClinicalNote: async (id: string, signature: string) => {
    const response = await api.patch(`/clinical/notes/${id}/finalize`, { signature });
    return response.data;
  },

  // Amend a finalized clinical note
  amendClinicalNote: async (id: string, amendmentText: string, reason: string) => {
    const response = await api.patch(`/clinical/notes/${id}/amend`, { amendmentText, reason });
    return response.data;
  },

  // Delete a clinical note
  deleteClinicalNote: async (id: string) => {
    await api.delete(`/clinical/notes/${id}`);
  },
};

// Treatment Plans API
export const treatmentPlansApi = {
  // Get all treatment plans
  getTreatmentPlans: async (filters?: {
    patientId?: string;
    status?: string;
  }) => {
    const response = await api.get('/clinical/treatment-plans', { params: filters });
    return response.data;
  },

  // Get a single treatment plan
  getTreatmentPlan: async (id: string) => {
    const response = await api.get(`/clinical/treatment-plans/${id}`);
    return response.data;
  },

  // Create a new treatment plan
  createTreatmentPlan: async (planData: any) => {
    const response = await api.post('/clinical/treatment-plans', planData);
    return response.data;
  },

  // Update a treatment plan
  updateTreatmentPlan: async (id: string, planData: any) => {
    const response = await api.patch(`/clinical/treatment-plans/${id}`, planData);
    return response.data;
  },

  // Propose a treatment plan (send to patient for approval)
  proposeTreatmentPlan: async (id: string) => {
    const response = await api.patch(`/clinical/treatment-plans/${id}/propose`);
    return response.data;
  },

  // Accept a treatment plan (patient approval)
  acceptTreatmentPlan: async (id: string) => {
    const response = await api.patch(`/clinical/treatment-plans/${id}/accept`);
    return response.data;
  },

  // Complete a treatment plan
  completeTreatmentPlan: async (id: string) => {
    const response = await api.patch(`/clinical/treatment-plans/${id}/complete`);
    return response.data;
  },

  // Delete a treatment plan
  deleteTreatmentPlan: async (id: string) => {
    await api.delete(`/clinical/treatment-plans/${id}`);
  },
};

// Clinical Analytics API
export const clinicalAnalyticsApi = {
  // Get clinical analytics
  getClinicalAnalytics: async (filters?: {
    startDate?: string;
    endDate?: string;
    providerId?: string;
  }) => {
    const response = await api.get('/clinical/analytics', { params: filters });
    return response.data;
  },
};

export default {
  ...clinicalNotesApi,
  treatmentPlans: treatmentPlansApi,
  analytics: clinicalAnalyticsApi,
};

