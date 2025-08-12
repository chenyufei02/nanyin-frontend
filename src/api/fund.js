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

