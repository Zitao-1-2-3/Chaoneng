import request from '@/axios'
import type {
  BotListParams,
  BotListResponse,
  BotDetail,
  SystemPrice,
  BotPriceConfig,
  AddressListParams,
  AddressListResponse,
  BindAddressParams,
  UpdateBotParams,
  UpdateBotPriceParams,
  RenewBotParams,
  BotRenewPrice,
  CreateBotParams,
  AgentBillListParams,
  AgentBillListResponse
} from './types'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/bot/'

/**
 * 分页获取机器人列表 - 新接口 v1
 * GET /v1/bot/list
 */
export const v1GetBotList = (params: BotListParams): Promise<IResponse<BotListResponse>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 获取机器人详情 - 新接口 v1
 * GET /v1/bot/get
 */
export const v1GetBotDetail = (id: number | string): Promise<IResponse<BotDetail>> => {
  return request.get({
    url: `${BASE_URL}get`,
    params: { id }
  })
}

/**
 * 获取系统价格（成本价） - 新接口 v1
 * GET /v1/system/price
 */
export const v1GetSystemPrice = (): Promise<IResponse<SystemPrice>> => {
  return request.get({
    url: '/v1/system/price'
  })
}

/**
 * 获取机器人价格配置详情 - 新接口 v1
 * GET /v1/bot/price/get
 */
export const v1GetBotPriceConfig = (id: number | string): Promise<IResponse<BotPriceConfig>> => {
  return request.get({
    url: `${BASE_URL}price/get`,
    params: { id }
  })
}

/**
 * 获取 Address 地址列表 - 新接口 v1
 * GET /v1/address/list
 */
export const v1GetAddressList = (
  params: AddressListParams
): Promise<IResponse<AddressListResponse>> => {
  return request.get({
    url: '/v1/address/list',
    params
  })
}

/**
 * 更新机器人 - 新接口 v1
 * POST /v1/bot/update
 * 代理只能更新自己的机器人
 */
export const v1UpdateBot = (data: UpdateBotParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}update`,
    data
  })
}

/**
 * 更新机器人价格配置 - 新接口 v1
 * POST /v1/bot/price/update
 * 每个标签页更新时只需要传入需要更新的字段
 */
export const v1UpdateBotPrice = (data: UpdateBotPriceParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}price/update`,
    data
  })
}

/**
 * 机器人续费 - 新接口 v1
 * POST /v1/bot/renew
 */
export const v1RenewBot = (data: RenewBotParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}renew`,
    data
  })
}

/**
 * 获取机器人续费价格 - 新接口 v1
 * GET /v1/bot/renew_price/get
 */
export const v1GetBotRenewPrice = (): Promise<IResponse<BotRenewPrice>> => {
  return request.get({
    url: `${BASE_URL}renew_price/get`
  })
}

/**
 * 创建机器人 - 新接口 v1
 * POST /v1/bot/add
 */
export const v1CreateBot = (data: CreateBotParams): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}add`,
    data
  })
}

/**
 * 获取代理账单列表（自己的） - 新接口 v1
 * GET /v1/bill/agent/list
 */
export const v1GetAgentBillList = (
  params: AgentBillListParams
): Promise<IResponse<AgentBillListResponse>> => {
  return request.get({
    url: '/v1/bill/agent/list',
    params
  })
}

/**
 * 绑定地址 - 新接口 v1
 * POST /v1/address/bind
 */
export const v1BindAddress = (data: BindAddressParams): Promise<IResponse> => {
  return request.post({
    url: '/v1/address/bind',
    data
  })
}

/**
 * 同步TG状态
 * POST /v1/bot/sync-tg-status
 */
export const syncTgStatusApi = (botId: string) => {
  return request.post({ url: '/v1/bot/sync-tg-status', data: { botId } })
}
