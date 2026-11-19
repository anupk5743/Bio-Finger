import api from './api';

export const exportService = {
  async exportStudents(format: 'xlsx' | 'csv' = 'xlsx', batchId?: string, status?: string) {
    const response = await api.get('/exports/students', {
      params: { format, batchId, status },
      responseType: 'blob',
    });
    this.downloadBlob(response.data, `Students_Export_${Date.now()}.${format}`);
  },

  async exportBatches(format: 'xlsx' | 'csv' = 'xlsx') {
    const response = await api.get('/exports/batches', {
      params: { format },
      responseType: 'blob',
    });
    this.downloadBlob(response.data, `Batches_Export_${Date.now()}.${format}`);
  },

  async exportUsers(format: 'xlsx' | 'csv' = 'xlsx') {
    const response = await api.get('/exports/users', {
      params: { format },
      responseType: 'blob',
    });
    this.downloadBlob(response.data, `Users_Export_${Date.now()}.${format}`);
  },

  downloadBlob(blobData: BlobPart, fileName: string) {
    const blob = new Blob([blobData]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
