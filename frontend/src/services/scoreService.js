import api from './api';

export const scoreService = {
  submitScore: async (scoreData) => {
    const response = await api.post('/scores', scoreData);
    return response.data;
  },
  getMyScoreForTopic: async (topicId) => {
    const response = await api.get(`/scores/my-score/${topicId}`);
    return response.data;
  }
};