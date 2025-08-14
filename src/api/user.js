import request from './request'; // 引入我们配置好的axios实例

// --- 1. 个人资料 (UserProfile) ---

/**
 * 获取当前登录用户的个人资料
 * 对应后端的 UserProfileController -> getMyProfile
 * @returns Promise
 */
export function getMyProfile() {
  return request({
    url: '/user/profile',
    method: 'get'
  });
}

/**
 * 【【【 核心修正：补上这个缺失的函数！！！ 】】】
 * 更新当前登录用户的个人资料
 * 对应后端的 UserProfileController -> updateUserProfile
 * @param {object} data - 包含待更新字段的UserProfileUpdateDTO对象
 * @returns Promise
 */
export function updateMyProfile(data) {
  return request({
    url: '/user/profile',
    method: 'put',
    data: data
  });
}


/**
 * 获取当前登录用户的主页仪表盘所有数据 (聚合接口)
 * 对应后端的 UserProfileController -> getMyDashboard
 * @returns Promise
 */
export function getMyDashboard() {
  return request({
    url: '/user/dashboard',
    method: 'get'
  });
}


// --- 2. 个人持仓 (UserHolding) ---

/**
 * 获取当前登录用户的所有持仓信息
 * 对应后端的 UserHoldingController -> getMyHoldings
 * @returns Promise
 */
export function getMyHoldings() {
  return request({
    url: '/holding/my-holdings',
    method: 'get'
  });
}


// --- 3. 个人交易 (FundTransaction) ---

/**
 * 申购基金
 * 对应后端的 FundTransactionController -> purchase
 * @param {object} data - 包含申购信息的FundPurchaseDTO对象
 * @returns Promise
 */
export function purchaseFund(data) {
  return request({
    url: '/transaction/purchase',
    method: 'post',
    data: data
  });
}

/**
 * 赎回基金
 * 对应后端的 FundTransactionController -> redeem
 * @param {object} data - 包含赎回信息的FundRedeemDTO对象
 * @returns Promise
 */
export function redeemFund(data) {
  return request({
    url: '/transaction/redeem',
    method: 'post',
    data: data
  });
}



/**
 * 根据交易ID获取当前用户的单条交易详情
 * 对应后端的 FundTransactionController -> getById
 * @param {number} transactionId - 交易记录的ID
 * @returns Promise
 */
export function getTransactionDetail(transactionId) {
  return request({
    url: `/transaction/${transactionId}`,
    method: 'get'
  });
}



// --- 5. AI投资助手 (AI) ---

/**
 * 为当前登录用户生成投资建议
 * 对应后端的 AIController -> generateSuggestionForCurrentUser
 * @returns Promise
 */
export function getAISuggestion() {
  return request({
    url: '/ai/suggestion',
    method: 'post' // 这是一个POST请求
  });
}