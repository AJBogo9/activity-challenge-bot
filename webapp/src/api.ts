import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add Telegram initData to headers
api.interceptors.request.use((config) => {
  const webapp = (window as any).Telegram?.WebApp;
  if (webapp?.initData) {
    config.headers['X-Telegram-Init-Data'] = webapp.initData;
  }
  return config;
});

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getPersonalStats = async () => {
  const response = await api.get('/stats/personal');
  return response.data;
};

export const getGuildStats = async () => {
  const response = await api.get('/stats/guilds');
  return response.data;
};

export default api;
