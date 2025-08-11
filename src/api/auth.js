import request from './request';

/**
 * 用户登录API
 * @param {object} data - 包含username和password的对象
 * @returns Promise
 */
export function login(data) {
  return request({
    url: '/auth/login', // 请求路径
    method: 'post',     // 请求方法
    data: data          // 请求体数据
  });
}

/**
 * 用户注册API
 * @param {object} data - 包含username和password的对象
 * @returns Promise
 */
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data: data
  });
}