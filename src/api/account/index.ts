import request from '@/axios'

// ==================== 代理端账户接口 ====================

/**
 * 获取代理账户信息
 * 接口路径：GET /v1/user/get_detail
 * 参数：无
 */
export const getAccountListApi = (params: any) => {
  return request.get({ url: '/user/get_detail', params })
}

/**
 * 获取余额记录（充值记录/扣款记录）
 * 接口路径：GET /v1/user/balance_record
 * 参数：type (record_type: 1-充值记录, 2-扣款记录)
 */
export const getBalanceRecordApi = (params: any) => {
  return request.get({ url: '/user/balance_record', params })
}

// ==================== 旧接口（保留） ====================

// 获取账户详情
export const getAccountDetailApi = (id: number) => {
  return request.get({ url: '/v1/account/detail', params: { id } })
}

// 创建账户
export const createAccountApi = (data: any) => {
  return request.post({ url: '/v1/account/create', data })
}

// 更新账户
export const updateAccountApi = (data: any) => {
  return request.put({ url: '/v1/account/update', data })
}

// 删除账户
export const deleteAccountApi = (id: number) => {
  return request.delete({ url: '/v1/account/delete', params: { id } })
}

// 导出账户信息
export const exportAccountListApi = (params: any) => {
  return request.get({ url: '/v1/account/export', params, responseType: 'blob' })
}
