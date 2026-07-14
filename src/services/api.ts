import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = 'https://wudassie-sda-web.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  // Render cold starts can be slow; allow enough time before treating it as offline.
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Platform': Platform.OS,
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (__DEV__) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response Error:', error.response.data);
        console.error('Response Status:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Request Error:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
      }
    }
    const config = error.config;
    const canRetry = config && !config.__retryCount && (!error.response || error.code === 'ECONNABORTED');
    if (canRetry) {
      config.__retryCount = 1;
      await delay(1200);
      return api(config);
    }
    return Promise.reject(error);
  },
);

export default api;
