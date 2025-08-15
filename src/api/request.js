import axios from 'axios';
import router from '@/router';

// 1. 创建一个新的axios实例
const service = axios.create({
  // 设置基础请求路径（直连后端 8080 端口）
  baseURL: 'http://localhost:8080/api',

  // 设置请求超时时间，单位是毫秒
  timeout: 150000
});

// 2. 添加请求拦截器 (可选，但推荐)
// 作用：在每个请求发送前，都进行一些预处理。例如，自动为请求头添加Token。
service.interceptors.request.use(
  config => {
    // 从浏览器的本地存储中获取Token
    const token = localStorage.getItem('authToken');
    if (token) {
      // 如果Token存在，则将其添加到请求的 Authorization 头中（确保带上Bearer前缀）
      const hasBearer = /^Bearer\s+/i.test(token);
      config.headers['Authorization'] = hasBearer ? token : `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 处理请求错误
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 3. 添加响应拦截器 (可选，但推荐)
// 作用：在接收到后端响应后，进行一些统一处理。例如，处理登录过期、服务器错误等。
service.interceptors.response.use(
  response => {
    // 兼容两种返回：
    // 1) 统一包装 { success, data, message }
    // 2) 直接返回业务对象
    const res = response.data;
    if (res && typeof res === 'object' && Object.prototype.hasOwnProperty.call(res, 'success')) {
      if (res.success) {
        return res.data;
      }
      return Promise.reject(new Error(res.message || res.msg || 'Error'));
    }
    return res;
  },
  error => {
    console.error('Response Error:', error);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      const redirect = window && window.location ? window.location.pathname + window.location.search : '/';
      router.push({ path: '/login', query: { redirect } });
    }
    const message = (error.response && error.response.data && (error.response.data.message || error.response.data.msg)) || error.message || 'Request Error';
    return Promise.reject(new Error(message));
  }
);

// 4. 导出配置好的axios实例
export default service;