import request from '@/axios'
import type {
  BotRenewPrice,
  BotListParams,
  BotListResponse,
  BotPaymentConfig,
  BotTimeEnergyConfig,
  BotCountEnergyConfig,
  BotManagedModeConfig,
  BotBatchOrderConfig,
  BotFlashExchangeConfig
} from './types'
// 获取所有字典
export const getDictApi = () => {
  return request.get({ url: '/mock/dict/list' })
}

// 模拟获取某个字典
export const getDictOneApi = async () => {
  return request.get({ url: '/mock/dict/one' })
}

/**
 * 获取机器人续费价格
 * @returns Promise<IResponse<BotRenewPrice>> 返回续费价格信息
 * @example
 * const res = await getBotRenewPriceApi()
 * console.log(res.data.amount) // 续费金额
 */
export const getBotRenewPriceApi = (): Promise<IResponse<BotRenewPrice>> => {
  return request.get({ url: '/v1/bot/renew_price/get' })
}

/**
 * 获取机器人列表
 * @param params 查询参数
 * @param params.current_page 当前页码
 * @param params.page_size 每页数量
 * @param params.query 搜索关键字（机器人名称/Token）
 * @param params.status 状态：1-启用，2-禁用
 * @returns Promise<IResponse<BotListResponse>> 返回机器人列表
 * @example
 * const res = await getBotListApi({
 *   current_page: 1,
 *   page_size: 10,
 *   status: 1
 * })
 * console.log(res.data.list) // 机器人列表
 * console.log(res.data.totalCount) // 总数量
 */
export const getBotListApi = (params: BotListParams): Promise<IResponse<BotListResponse>> => {
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
