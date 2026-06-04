import api from './api';

export const campaignService = {
  getAllCampaigns: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },
  getCampaignStats: async (id) => {
    const response = await api.get(`/campaigns/${id}/stats`);
    return response.data;
  },
  createCampaign: async (data) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },
  updateCampaign: async (id, data) => {
    const response = await api.put(`/campaigns/${id}`, data);
    return response.data;
  },
  deleteCampaign: async (id) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  }
};