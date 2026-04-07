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
  AgentBillListResponse,
  BotPaymentConfig,
  BotTimeEnergyConfig,
  BotCountEnergyConfig,
  BotManagedModeConfig,
  BotBatchOrderConfig,
  BotFlashExchangeConfig
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

// ========== 旧接口 ==========

// 获取所有字典
export const getDictApi = () => {
  return request.get({ url: '/mock/dict/list' })
}

// 模拟获取某个字典
export const getDictOneApi = async () => {
  return request.get({ url: '/mock/dict/one' })
}

// 获取机器人续费价格
export const getBotRenewPriceApi = () => {
  return request.get({ url: '/v1/bot/renew_price/get' })
}

// 获取机器人列表
export const getBotListApi = (params: any) => {
  return request.get({ url: '/v1/bot/list', params })
}

// 获取机器人详情
export const getBotDetailApi = (botId: string) => {
  return request.get({ url: `/v1/bot/${botId}` })
}

// 添加机器人
export const addBotApi = (data: any) => {
  return request.post({ url: '/v1/bot/add', data })
}

// 编辑机器人
export const updateBotApi = (data: any) => {
  return request.post({ url: '/v1/bot/update', data })
}

// 删除机器人
export const deleteBotApi = (botId: string) => {
  return request.delete({ url: `/v1/bot/${botId}` })
}

// 同步TG状态
export const syncTgStatusApi = (botId: string) => {
  return request.post({ url: '/v1/bot/sync-tg-status', data: { botId } })
}

// 机器人续费
export const renewBotApi = (data: { id: string; month_num: number }) => {
  return request.post({ url: '/v1/bot/renew', data })
}

// 获取机器人收款配置
export const getBotPaymentConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/payment-config/${id}` })
}

// 更新机器人收款配置
export const updateBotPaymentConfigApi = (data: BotPaymentConfig) => {
  return request.post({ url: '/v1/bot/payment-config/update', data })
}

// 获取机器人时间能量价格配置
export const getBotTimeEnergyConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/time-energy-config/${id}` })
}

// 更新机器人时间能量价格配置
export const updateBotTimeEnergyConfigApi = (data: BotTimeEnergyConfig) => {
  return request.post({ url: '/v1/bot/time-energy-config/update', data })
}

// 获取机器人笔数能量价格配置
export const getBotCountEnergyConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/count-energy-config/${id}` })
}

// 更新机器人笔数能量价格配置
export const updateBotCountEnergyConfigApi = (data: BotCountEnergyConfig) => {
  return request.post({ url: '/v1/bot/count-energy-config/update', data })
}

// 获取机器人托管模式价格配置
export const getBotManagedModeConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/managed-mode-config/${id}` })
}

// 更新机器人托管模式价格配置
export const updateBotManagedModeConfigApi = (data: BotManagedModeConfig) => {
  return request.post({ url: '/v1/bot/managed-mode-config/update', data })
}

// 获取机器人批量下单价格配置
export const getBotBatchOrderConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/batch-order-config/${id}` })
}

// 更新机器人批量下单价格配置
export const updateBotBatchOrderConfigApi = (data: BotBatchOrderConfig) => {
  return request.post({ url: '/v1/bot/batch-order-config/update', data })
}

// 获取机器人闪兑配置
export const getBotFlashExchangeConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/flash-exchange-config/${id}` })
}

// 更新机器人闪兑配置
export const updateBotFlashExchangeConfigApi = (data: BotFlashExchangeConfig) => {
  return request.post({ url: '/v1/bot/flash-exchange-config/update', data })
}

// 更新所有机器人配置（一次性提交所有配置）
export const updateBotAllConfigsApi = (data: any) => {
  return request.post({ url: '/v1/bot/update-all-configs', data })
}

// 获取机器人消费记录
export const getBotConsumptionRecordApi = (params: { page_size: number; current_page: number }) => {
  return request.get({ url: '/v1/bot/charge_record/list', params })
}

export const getCountEnergyConfigApi = (id: number) => {
  return request.get({ url: `/v1/bot/count-energy-config/${id}` })
}

export const updateWelfarePriceConfigApi = (data: {
  id: number
  weal_address: string
  weal_price_trx: number
}) => {
  return request.post({ url: '/v1/bot/weal/add_address', data })
}
