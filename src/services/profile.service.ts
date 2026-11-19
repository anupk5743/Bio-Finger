import api from './api';

export const profileService = {
  async getProfile() {
    const response = await api.get('/profile');
    return response.data.data;
  },

  async updateProfile(data: { firstName: string; lastName: string; mobileNumber: string }) {
    const response = await api.put('/profile', data);
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const response = await api.post('/profile/change-password', data);
    return response.data;
  },
};
