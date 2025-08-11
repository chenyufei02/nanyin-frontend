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
 * 根据基金代码获取基金详细信息
 * 对应后端的 FundInfoController -> getFundInfo
 * @param {string} fundCode - 基金代码
 * @returns Promise
 */
export function getFundInfoByCode(fundCode) {
  return request({
    // 使用 ES6 的模板字符串拼接URL
    url: `/fund-info/${fundCode}`,
    method: 'get'
  });
}

/**
 * 【后台管理功能】手动触发从外部数据源导入所有基金
 * 对应后端的 FundInfoController -> importAllFunds
 * @returns Promise
 */
export function importAllFunds() {
    return request({
        url: '/fund-info/import-all',
        method: 'post'
    });
}