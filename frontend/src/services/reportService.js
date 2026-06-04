import api from './api';

export const reportService = {
  getStatistics: async () => {
    const response = await api.get('/reports/statistics');
    return response.data;
  }
};