import request from '@/axios'
import type {
  UserBalanceRecordParams,
  UserListParamsV1,
  UserListResponseV1,
  RechargeUserParamsV1,
  AdminChangePasswordParamsV1,
  MassSendListParamsV1,
  MassSendListResponseV1,
  SendGroupMessageParamsV1,
  SendMessageParamsV1,
  UserBillListParamsV1,
  UserBillListResponseV1
} from './types'

// 导出类型定义
export * from './types'

// ========== 新接口 v1 ==========

const BASE_UEL = '/v1/user/bot/tg_user/'
const TWO_BASE_URL = '/v1/bot/reply/'

/**
 * 获取用户列表 - 新接口 v1
 * GET /v1/user/bot/tg_user/list
 */
export const v1GetUserList = (params: UserListParamsV1): Promise<IResponse<UserListResponseV1>> => {
  return request.get({
    url: `${BASE_UEL}list`,
    params
  })
}

/**
 * 用户充值 - 新接口 v1
 * POST /v1/user/bot/tg_user/change_balance
 */
export const v1RechargeUser = (data: RechargeUserParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_UEL}change_balance`,
    data
  })
}

/**
 * 管理员修改用户密码 - 新接口 v1
 * POST /v1/user/update
 */
export const v1AdminChangePassword = (data: AdminChangePasswordParamsV1): Promise<IResponse> => {
  return request.post({
    url: '/v1/user/update',
    data
  })
}

/**
 * 获取群发消息列表 - 新接口 v1
 * GET /v1/bot/reply/msg/list
 */
export const v1GetMassSendList = (
  params: MassSendListParamsV1
): Promise<IResponse<MassSendListResponseV1>> => {
  return request.get({
    url: `${TWO_BASE_URL}msg/list`,
    params
  })
}

/**
 * 删除群发消息 - 新接口 v1
 * POST /v1/bot/reply/msg/delete/{id}
 */
export const v1DeleteMassSend = (id: number): Promise<IResponse> => {
  return request.post({
    url: `${TWO_BASE_URL}msg/delete/${id}`
  })
}

/**
 * 给指定的tg用户群发信息 - 新接口 v1
 * POST /v1/bot/group_msg
 */
export const v1SendGroupMessage = (data: SendGroupMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: '/v1/bot/group_msg',
    data
  })
}

/**
 * 给指定的tg用户发信息 - 新接口 v1
 * POST /v1/bot/reply/send_msg
 */
export const v1SendMessage = (data: SendMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${TWO_BASE_URL}send_msg`,
    data
  })
}

/**
 * 获取用户账单列表 - 新接口 v1
 * GET /v1/bill/user/list
 */
export const v1GetUserBillList = (
  params: UserBillListParamsV1
): Promise<IResponse<UserBillListResponseV1>> => {
  return request.get({
    url: '/v1/bill/user/list',
    params
  })
}

/**
 * 获取内联按钮列表 - 新接口 v1
 * GET /v1/bot/menu/list
 */
export const v1GetInlineButtonList = (params: {
  menu_type: number
  current_page?: number
  page_size?: number
}): Promise<IResponse<any>> => {
  return request.get({
    url: '/v1/bot/menu/list',
    params
  })
}

// ========== 旧接口 ==========

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
  return request.post({ url: '/v1/bot/reply/reply_msg/delete', data: { id } })
}

/**
 * 再次发送群发消息
 * @param id 记录ID
 */
export const resendMassSendRecordApi = (id: number | string) => {
  return request.post({ url: '/v1/bot/reply/group_msg/again', data: { id } })
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
