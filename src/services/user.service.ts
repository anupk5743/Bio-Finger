import api from './api';

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  async getRoles() {
    const response = await api.get('/users/roles');
    return response.data.data;
  },

  async createUser(data: any) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async updateUser(id: string, data: any) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  async updateRole(id: string, role: string) {
    const response = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};
