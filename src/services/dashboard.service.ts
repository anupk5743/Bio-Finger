import api from './api';

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },

  async getStudentStatistics() {
    const response = await api.get('/dashboard/student-statistics');
    return response.data.data;
  },

  async getBatchStatistics() {
    const response = await api.get('/dashboard/batch-statistics');
    return response.data.data;
  },

  async getRecentActivities() {
    const response = await api.get('/dashboard/recent-activities');
    return response.data.data;
  },
};
