import request from './request';

/**
 * 获取当前用户的基金持仓信息
 * 对应后端的接口 /api/holding/my-holdings
 * @param {number} userId - 用户ID
 * @param {string} fundCode - 基金代码（可选，用于筛选）
 * @param {string} fundName - 基金名称（可选，用于筛选）
 * @returns Promise
 */
export function getMyHoldings(userId, fundCode, fundName) {
  // 构建请求参数
  const params = { userId };
  
  // 如果提供了基金代码，添加到参数中
  if (fundCode) {
    params.fundCode = fundCode;
  }
  
  // 如果提供了基金名称，添加到参数中
  if (fundName) {
    params.fundName = fundName;
  }
  
  // 输出日志，方便调试
  console.log('请求参数:', params);
  
  return request({
    url: '/holding/my-holdings',
    method: 'get',
    params: params
  }).then(response => {
    // 输出从后端获取的数据，方便调试
    console.log('后端返回数据:', response);
    return response;
  });
}