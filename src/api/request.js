import axios from 'axios';

// 1. 创建一个新的axios实例
const service = axios.create({
  // 【核心配置】设置基础请求路径
  // Apifox里的“前置URL”就是在这里配置的
  baseURL: 'http://localhost:8080/api',

  // 设置请求超时时间，单位是毫秒
  timeout: 5000
});

// 2. 添加请求拦截器 (可选，但推荐)
// 作用：在每个请求发送前，都进行一些预处理。例如，自动为请求头添加Token。
service.interceptors.request.use(
  config => {
    // 从浏览器的本地存储中获取Token
    const token = localStorage.getItem('authToken');
    if (token) {
      // 如果Token存在，则将其添加到请求的 Authorization 头中
      config.headers['Authorization'] = token;
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
    // 如果后端返回的是统一的ApiResponseVO格式，可以只返回核心的data部分
    const res = response.data;
    if (res.success) {
      return res.data; // 直接返回核心业务数据
    } else {
      // 如果业务失败（res.success为false），可以统一弹出错误提示
      // 例如：ElementUI的Message组件
      // Message.error(res.message || 'Error');
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  error => {
    console.error('Response Error:', error);
    // 在这里可以处理HTTP状态码错误，例如401（未授权）跳转到登录页
    if (error.response && error.response.status === 401) {
      // 跳转到登录页的逻辑
      // router.push('/login');
    }
    return Promise.reject(error);
  }
);

// 4. 导出配置好的axios实例
export default service;