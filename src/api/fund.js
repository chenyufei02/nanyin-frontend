import request from './request'; // 引入我们配置好的axios实例

/**
 * 分页并按条件搜索基金信息列表
 * 对应后端的 FundInfoController -> searchFunds
 * @param {object} params - 包含分页和筛选条件的查询参数对象
 * e.g., { page: 1, size: 10, fundName: '成长', fundType: '混合型' }
 * @returns Promise
 */
export function searchFunds(params) {
  return request({
    url: '/fund-info/search',
    method: 'get',
    params: params // GET请求的参数应该放在params选项中
  });
}

/**
 * 【核心修正】为基金详情页提供API函数
 * 对应后端的 FundInfoController -> getFundDetail
 * @param {string} fundCode - 基金代码
 * @returns Promise
 */
export function getFundDetail(fundCode) {
  return request({
    url: `/fund-info/detail/${fundCode}`,
    method: 'get'
  });
}

/**
 * 获取当前用户的基金持仓信息
 * 对应后端的接口 /api/holding/my-holdings
 * @returns Promise
 */
export function getMyHoldings() {
  return request({
    url: '/holding/my-holdings',
    method: 'get'
  });
}

/**
 * 获取基金净值走势数据
 * @param {string} fundCode - 基金代码
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
 * @returns Promise
 */
export function getFundNetValueTrends(fundCode, startDate, endDate) {
  return request({
    url: '/fund-info/net-value-trends',
    method: 'get',
    params: {
      fundCodes: fundCode,
      startDate,
      endDate
    }
  });
}

