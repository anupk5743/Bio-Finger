
import api from './api';

export type FingerIndex =
  | 'FINGER_1'
  | 'FINGER_2'
  | 'FINGER_3';

export interface StudentFingerprint {
  fingerIndex: FingerIndex;
  biometricData: string;
  qualityScore: number;
  deviceModel: string;
  scannedAt?: string;
  previewImage?: string;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  batchId: string;
  status: 'ACTIVE' | 'INACTIVE';
  fingerprints?: StudentFingerprint[];
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
  batchId?: string;
  status?: 'ACTIVE' | 'INACTIVE';

  // Send only newly captured fingerprints.
  // Do not send an empty array to clear existing enrollment.
  fingerprints?: StudentFingerprint[];
}

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

  async createStudent(data: CreateStudentPayload) {
    const response = await api.post('/students', data);
    return response.data;
  },

  async updateStudent(
    id: string,
    data: UpdateStudentPayload
  ) {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
  ) {
    const response = await api.patch(
      `/students/${id}/status`,
      { status }
    );

    return response.data;
  },

  async deleteStudent(id: string) {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
