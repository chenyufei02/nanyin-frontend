// 导入自定义的axios实例，该实例已包含基础URL、拦截器等配置
import request from './request';

/**
 * 获取当前用户的所有基金持仓信息（不分页，用于计算总计值）
 * 对应后端的接口 /api/holding/my-holdings
 * @param {number} userId - 用户ID
 * @returns {Promise} 返回一个Promise对象，其解析后的值为后端返回的数据
 */
export function getAllMyHoldings(userId) {
  // 构建一个对象来存放将要发送到后端的查询参数
  const params = { userId };

  // 使用配置好的axios实例发起GET请求
  return request({
    url: '/holding/my-holdings', // 请求的API路径（获取所有数据）
    method: 'get',                   // HTTP请求方法
    params: params                   // 将构建好的参数对象作为查询参数
  }).then(response => {
    // 返回后端响应的数据部分
    return response;
  });
}

/**
 * 获取当前用户的基金持仓信息（分页查询）
 * 对应后端的接口 /api/holding/my-holdings/page
 * @param {number} userId - 用户ID
 * @param {string} fundCode - 基金代码（可选，用于筛选）
 * @param {string} fundName - 基金名称（可选，用于筛选）
 * @param {number} pageNum - 当前页码，默认为1
 * @param {number} pageSize - 每页记录数，默认为10
 * @returns {Promise} 返回一个Promise对象，其解析后的值为后端返回的数据
 */
export function getMyHoldings(userId, fundCode, fundName, pageNum = 1, pageSize = 10) {
  // 构建一个对象来存放将要发送到后端的查询参数
  const params = { userId };

  // 如果函数调用时传入了fundCode，则将其添加到参数对象中
  if (fundCode) {
    params.fundCode = fundCode;
  }

  // 如果函数调用时传入了fundName，则将其添加到参数对象中
  if (fundName) {
    params.fundName = fundName;
  }
  
  // 添加分页参数
  params.pageNum = pageNum;
  params.pageSize = pageSize;

  // 在控制台打印请求参数，方便前端开发时调试
  console.log('请求参数:', params);

  // 使用配置好的axios实例发起GET请求
  return request({
    url: '/holding/my-holdings/page', // 请求的API路径（分页）
    method: 'get',                     // HTTP请求方法
    params: params                     // 将构建好的参数对象作为查询参数
  }).then(response => {
    // 请求成功后，在控制台打印从后端接收到的原始数据，方便调试
    console.log('后端返回数据:', response);
    // 返回后端响应的数据部分
    return response;
  });
}