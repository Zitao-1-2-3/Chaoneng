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

// ==================== v1 接口（管理端） ====================

const BASE_URL_V1 = '/v1/user/bot/tg_user/'
const REPLY_BASE_URL_V1 = '/v1/bot/reply/'

/**
 * 获取用户列表
 * GET /v1/user/bot/tg_user/list
 */
export const v1GetUserList = (params: UserListParamsV1): Promise<IResponse<UserListResponseV1>> => {
  return request.get({
    url: `${BASE_URL_V1}list`,
    params
  })
}

/**
 * 用户充值
 * POST /v1/user/bot/tg_user/change_balance
 */
export const v1RechargeUser = (data: RechargeUserParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL_V1}change_balance`,
    data
  })
}

/**
 * 管理员修改用户密码
 * POST /v1/user/update
 */
export const v1AdminChangePassword = (data: AdminChangePasswordParamsV1): Promise<IResponse> => {
  return request.post({
    url: '/v1/user/update',
    data
  })
}

/**
 * 获取群发消息列表
 * GET /v1/bot/reply/msg/list
 */
export const v1GetMassSendList = (
  params: MassSendListParamsV1
): Promise<IResponse<MassSendListResponseV1>> => {
  return request.get({
    url: `${REPLY_BASE_URL_V1}msg/list`,
    params
  })
}

/**
 * 删除群发消息
 * POST /v1/bot/reply/msg/delete/{id}
 */
export const v1DeleteMassSend = (id: number): Promise<IResponse> => {
  return request.post({
    url: `${REPLY_BASE_URL_V1}msg/delete/${id}`
  })
}

/**
 * 给指定的tg用户群发信息
 * POST /v1/bot/group_msg
 */
export const v1SendGroupMessage = (data: SendGroupMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: '/v1/bot/group_msg',
    data
  })
}

/**
 * 给指定的tg用户发信息
 * POST /v1/bot/reply/send_msg
 */
export const v1SendMessage = (data: SendMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${REPLY_BASE_URL_V1}send_msg`,
    data
  })
}

/**
 * 获取用户账单列表
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
 * 获取内联按钮列表
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

/**
 * 获取用户余额记录
 * GET /v1/user/bot/tg_user/change_balance/{id}
 */
export const getUserBalanceRecordsApi = (id: number | string, params?: UserBalanceRecordParams) => {
  return request.get({ url: `${BASE_URL_V1}change_balance/${id}`, params })
}

/**
 * 导出用户列表
 * GET /v1/user/bot/tg_user/export
 */
export const exportTgUserListApi = (params: any) => {
  return request.get({ url: `${BASE_URL_V1}export`, params, responseType: 'blob' })
}

// ==================== v2 接口（运营端） ====================

const REPLY_BASE_URL_V2 = '/v2/bot/reply/'

/**
 * 获取群发消息列表
 * GET /v2/bot/reply/msg/list
 */
export const v2GetMassSendList = (
  params: MassSendListParamsV1
): Promise<IResponse<MassSendListResponseV1>> => {
  return request.get({
    url: `${REPLY_BASE_URL_V2}msg/list`,
    params
  })
}

/**
 * 删除群发消息
 * POST /v2/bot/reply/msg/delete/{id}
 */
export const v2DeleteMassSend = (id: number): Promise<IResponse> => {
  return request.post({
    url: `${REPLY_BASE_URL_V2}msg/delete/${id}`
  })
}

/**
 * 给指定的tg用户群发信息
 * POST /v2/bot/group_msg
 */
export const v2SendGroupMessage = (data: SendGroupMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: '/v2/bot/group_msg',
    data
  })
}

/**
 * 给指定的tg用户发信息
 * POST /v2/bot/reply/send_msg
 */
export const v2SendMessage = (data: SendMessageParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${REPLY_BASE_URL_V2}send_msg`,
    data
  })
}

/**
 * 获取内联按钮列表
 * GET /v2/bot/menu/list
 */
export const v2GetInlineButtonList = (params: {
  menu_type: number
  current_page?: number
  page_size?: number
}): Promise<IResponse<any>> => {
  return request.get({
    url: '/v2/bot/menu/list',
    params
  })
}
