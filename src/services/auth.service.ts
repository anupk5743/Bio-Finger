import api from './api';

export const authService = {
  async login(credentials: { username: string; password: string }) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async logout(refreshToken?: string) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('biofinger_access_token');
      localStorage.removeItem('biofinger_refresh_token');
      localStorage.removeItem('biofinger_user');
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};
