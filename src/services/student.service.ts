import api from './api';

export const studentService = {
  async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    batchId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const response = await api.get('/students', { params });
    return response.data;
  },

  async getStudentById(id: string) {
    const response = await api.get(`/students/${id}`);
    return response.data.data;
  },

  async createStudent(data: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email?: string;
    batchId: string;
    status: 'ACTIVE' | 'INACTIVE';
  }) {
    const response = await api.post('/students', data);
    return response.data;
  },

  async updateStudent(id: string, data: any) {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const response = await api.patch(`/students/${id}/status`, { status });
    return response.data;
  },

  async deleteStudent(id: string) {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
