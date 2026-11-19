import api from './api';

export const batchService = {
  async getBatches(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await api.get('/batches', { params });
    return response.data;
  },

  async getBatchById(id: string) {
    const response = await api.get(`/batches/${id}`);
    return response.data.data;
  },

  async createBatch(data: { name: string; status: 'ACTIVE' | 'INACTIVE' }) {
    const response = await api.post('/batches', data);
    return response.data;
  },

  async updateBatch(id: string, data: { name?: string; status?: 'ACTIVE' | 'INACTIVE' }) {
    const response = await api.put(`/batches/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const response = await api.patch(`/batches/${id}/status`, { status });
    return response.data;
  },

  async deleteBatch(id: string) {
    const response = await api.delete(`/batches/${id}`);
    return response.data;
  },
};
