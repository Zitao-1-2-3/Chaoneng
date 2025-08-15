import request from '@/axios'

/**
 * 定义用户余额记录请求参数类型
 */
export interface UserBalanceRecordParams {
  current_page?: number
  page_size?: number
  unit?: 'TRX' | 'USDT' | ''
  change_type?: 'in' | 'out' | ''
}

/**
 * 获取机器人TG用户列表
 * @param params 查询参数
 */
export const getTgUserListApi = (params: {
  bot_id?: number | string
  tg_user_id?: number | string
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/user/bot/tg_user/list', params })
}

/**
 * 获取TG用户详情
 * @param id 用户ID
 */
export const getTgUserDetailApi = (id: number) => {
  return request.get({ url: '/v1/user/bot/tg_user/detail', params: { id } })
}

/**
 * 给单个用户发送消息
 * @param data 消息数据
 */
export const sendMessageToUserApi = (data: {
  id: number | string
  content: string
  keyboards?: (number | string)[]
}) => {
  return request.post({ url: '/v1/bot/reply/send_msg', data })
}

/**
 * 群发消息
 * @param data 群发消息数据
 */
export const massSendMessageApi = (data: {
  bot_id: number | string
  receive_type: 'user_custom' | 'all_user' | 'one_user'
  content: string
  image?: string
  keyboards?: (number | string)[]
  tg_user_ids?: (number | string)[]
}) => {
  return request.post({ url: '/v1/bot/reply/send_group_msg', data })
}

/**
 * 获取群发记录
 * @param params 查询参数
 */
export const getMassSendRecordsApi = (params: {
  bot_id?: number | string
  start_date?: string
  end_date?: string
  pageSize?: number
  currentPage?: number
}) => {
  return request.get({ url: '/v1/bot/reply/reply_msg/list', params })
}

/**
 * 获取群发记录详情
 * @param id 记录ID
 */
export const getMassSendRecordDetailApi = (id: number | string) => {
  return request.get({ url: '/v1/user/bot/tg_user/mass_send/detail', params: { id } })
}

/**
 * 删除群发消息记录
 * @param id 记录ID
 */
export const deleteMassSendRecordApi = (id: number | string) => {
  return request.post({ url: '/v1/bot/reply/reply_msg/delete', data: { id } }) // Assuming id should be in data
}

/**
 * 再次发送群发消息
 * @param id 记录ID
 */
export const resendMassSendRecordApi = (id: number | string) => {
  return request.post({ url: '/v1/bot/reply/group_msg/again', data: { id } }) // Assuming id should be in data
}

/**
 * 获取用户余额记录
 * @param id 用户 ID
 * @param params 查询参数 (可选, 包含分页和筛选)
 */
export const getUserBalanceRecordsApi = (id: number | string, params?: UserBalanceRecordParams) => {
  return request.get({ url: `/v1/user/bot/tg_user/change_balance/${id}`, params })
}

/**
 * 用户充值
 * @param data 充值数据
 */
export const rechargeUserBalanceApi = (data: {
  id: number | string
  amount: number | string
  unit: 'TRX' | 'USDT'
  describe: string
}) => {
  return request.post({ url: '/v1/user/bot/tg_user/change_balance', data })
}

export const exportTgUserListApi = (params: any) => {
  return request.get({ url: '/v1/user/bot/tg_user/export', params, responseType: 'blob' })
}
