import api from './api';

export const documentService = {
  uploadFile: async (formData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getDocumentsByTopic: async (topicId) => {
    const response = await api.get(`/documents/topic/${topicId}`);
    return response.data;
  }
};