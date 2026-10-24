import axios from 'axios';

const api = axios.create({
  baseURL: '', // Vite proxy forwards /api to http://localhost:8080
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Basic Auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Basic ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle ApiResponse unwrapping and 401 unauthorized
api.interceptors.response.use(
  (response) => {
    // If backend returns standardized ApiResponse<T> ({ success, message, data })
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      const payload = response.data.data;
      return {
        ...response,
        data: payload !== undefined ? payload : response.data,
        _rawResponse: response.data,
      };
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const get = (url, config) => api.get(url, config);
export const post = (url, data, config) => api.post(url, data, config);
export const put = (url, data, config) => api.put(url, data, config);
export const del = (url, config) => api.delete(url, config);

export default api;
