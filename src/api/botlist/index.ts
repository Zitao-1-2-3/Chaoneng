import request from '@/axios'
import type {
  BotListParams,
  BotListResponse,
  BotDetail,
  SystemPrice,
  BotPriceConfig,
  BotWealConfig,
  AddressListParams,
  AddressListResponse,
  AddressAddParams,
  AddressDeleteParams,
  BindAddressParams,
  UpdateBotParams,
  UpdateBotPriceParams,
  UpdateBotWealParams,
  RenewBotParams,
  BotRenewPrice,
  CreateBotParams,
  AgentBillListParams,
  AgentBillListResponse
} from './types'

// ========== 基础路径 ==========
const BASE_URL = '/v1/bot/'
const BASE_URL_V2 = '/v2/bot/'

// ========== 机器人管理接口 ==========

/**
 * 分页获取机器人列表 - 运营端 v2
 * GET /v2/bot/list
 */
export const v2GetBotList = (params: BotListParams): Promise<IResponse<BotListResponse>> => {
  return request.get({ url: `${BASE_URL_V2}list`, params })
}

/**
 * 分页获取机器人列表 - 代理端 v1
 * GET /v1/bot/list
 */
export const v1GetBotList = (params: BotListParams): Promise<IResponse<BotListResponse>> => {
  return request.get({ url: `${BASE_URL}list`, params })
}

/**
 * 获取机器人详情 - v1
 * GET /v1/bot/get
 */
export const v1GetBotDetail = (id: number | string): Promise<IResponse<BotDetail>> => {
  return request.get({ url: `${BASE_URL}get`, params: { id } })
}

/**
 * 创建机器人 - v1
 * POST /v1/bot/add
 */
export const v1CreateBot = (data: CreateBotParams): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL}add`, data })
}

/**
 * 更新机器人基本信息 - v1
 * POST /v1/bot/update
 * 代理只能更新自己的机器人
 */
export const v1UpdateBot = (data: UpdateBotParams): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL}update`, data })
}

/**
 * 机器人续费 - v1
 * POST /v1/bot/renew
 */
export const v1RenewBot = (data: RenewBotParams): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL}renew`, data })
}

/**
 * 获取机器人续费价格 - v1
 * GET /v1/bot/renew_price/get
 */
export const v1GetBotRenewPrice = (): Promise<IResponse<BotRenewPrice>> => {
  return request.get({ url: `${BASE_URL}renew_price/get` })
}

/**
 * 同步TG状态 - v1
 * POST /v1/bot/sync-tg-status
 */
export const syncTgStatusApi = (botId: string): Promise<IResponse> => {
  return request.post({ url: '/v1/bot/sync-tg-status', data: { botId } })
}

// ========== 价格配置接口 ==========

/**
 * 获取系统价格（成本价） - v1
 * GET /v1/system/price
 */
export const v1GetSystemPrice = (): Promise<IResponse<SystemPrice>> => {
  return request.get({ url: '/v1/system/price' })
}

/**
 * 获取机器人价格配置详情 - v1
 * GET /v1/bot/price/get
 */
export const v1GetBotPriceConfig = (id: number | string): Promise<IResponse<BotPriceConfig>> => {
  return request.get({ url: `${BASE_URL}price/get`, params: { id } })
}

/**
 * 更新机器人价格配置 - v1
 * POST /v1/bot/price/update
 * 每个标签页更新时只需要传入需要更新的字段
 */
export const v1UpdateBotPrice = (data: UpdateBotPriceParams): Promise<IResponse> => {
  return request.post({ url: `${BASE_URL}price/update`, data })
}

// ========== 福利配置接口 ==========

/**
 * 获取机器人福利能量限制配置 - v1
 * GET /v1/bot/{id}/weal
 */
export const v1GetBotWealConfig = (id: number | string): Promise<IResponse<BotWealConfig>> => {
  return request.get({ url: `${BASE_URL}${id}/weal` })
}

/**
 * 更新机器人福利能量限制配置 - v1
 * PUT /v1/bot/{id}/weal
 */
export const v1UpdateBotWealConfig = (
  id: number | string,
  data: UpdateBotWealParams
): Promise<IResponse> => {
  return request.put({ url: `${BASE_URL}${id}/weal`, data })
}

// ========== 地址管理接口 ==========

/**
 * 获取地址列表 - v1
 * GET /v1/address
 */
export const v1GetAddressList = (
  params: AddressListParams
): Promise<IResponse<AddressListResponse>> => {
  return request.get({ url: '/v1/address', params })
}

/**
 * 批量创建地址 - v1
 * POST /v1/address
 */
export const v1AddAddressList = (data: AddressAddParams): Promise<IResponse> => {
  return request.post({ url: '/v1/address', data })
}

/**
 * 批量删除地址 - v1
 * DELETE /v1/address
 */
export const v1DeleteAddressList = (data: AddressDeleteParams): Promise<IResponse> => {
  return request.delete({ url: '/v1/address', data })
}

/**
 * 绑定地址 - v1
 * POST /v1/address/bind
 */
export const v1BindAddress = (data: BindAddressParams): Promise<IResponse> => {
  return request.post({ url: '/v1/address/bind', data })
}

// ========== 账单管理接口 ==========

/**
 * 获取代理账单列表（自己的） - v1
 * GET /v1/bill/agent/list
 */
export const v1GetAgentBillList = (
  params: AgentBillListParams
): Promise<IResponse<AgentBillListResponse>> => {
  return request.get({ url: '/v1/bill/agent/list', params })
}
