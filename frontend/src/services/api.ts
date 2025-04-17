import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',  // 后端服务地址
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 如果是登录请求，不需要添加 token
    if (config.url === '/api/login') {
      return config;
    }

    const token = localStorage.getItem('token');
    console.log('[API] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('[API] No token found in localStorage');
    }
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
      isTokenExpired: error.response?.data?.message?.includes('expired')
    });

    // 如果不是登录请求且返回 401，则清除 token 并重定向到登录页面
    if (error.config?.url !== '/api/login' && 
        (error.response?.status === 401 || error.response?.data?.message?.includes('expired'))) {
      console.log('[API] Unauthorized access or token expired, clearing token and redirecting to login');
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
); 