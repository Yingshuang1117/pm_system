import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',  // 后端服务地址
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const hasToken = !!token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('[API] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasToken
    });

    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response interceptor:', {
      url: response.config.url,
      status: response.status,
      hasUserData: !!response.data?.user
    });
    return response;
  },
  (error) => {
    console.error('[API] Response interceptor error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      isAuthError: error.response?.status === 401,
      isTokenExpired: error.response?.data?.message === 'Token has expired'
    });
    return Promise.reject(error);
  }
);

export { api }; 