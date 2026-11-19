import api from './api';

export const fingerprintService = {
  async getDeviceStatus() {
    const response = await api.get('/fingerprints/device/status');
    return response.data.data;
  },

  async getStudentFingerprints(studentId: string) {
    const response = await api.get(`/fingerprints/student/${studentId}`);
    return response.data.data;
  },

  async enrollFingerprint(data: {
    studentId: string;
    fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
    biometricData: string;
    qualityScore?: number;
    deviceModel?: string;
  }) {
    const response = await api.post('/fingerprints/enrollment', data);
    return response.data;
  },

  async deleteFingerprint(id: string) {
    const response = await api.delete(`/fingerprints/${id}`);
    return response.data;
  },
};
