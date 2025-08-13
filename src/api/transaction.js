import request from './request';

/**
 * 获取当前用户的所有交易记录
 * 对应后端接口 /api/transaction/my-transactions
 * @returns Promise
 */
export function getMyTransactions() {
  return request({
    url: '/transaction/my-transactions',
    method: 'get'
  });
}

/**
 * 根据交易ID获取交易详情
 * 对应后端接口 /api/transaction/{id}
 * @param {string|number} transactionId - 交易记录ID
 * @returns Promise
 */
export function getTransactionById(transactionId) {
  return request({
    url: `/transaction/${transactionId}`,
    method: 'get'
  });
}