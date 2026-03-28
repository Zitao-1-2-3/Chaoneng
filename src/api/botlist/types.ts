/**
 * 机器人续费价格
 */
type BotRenewPrice = {
  id: number // 价格ID
  amount: number // 续费金额
}

/**
 * 机器人列表查询参数
 */
type BotListParams = {
  current_page?: number // 当前页码
  page_size?: number // 每页数量
  query?: string // 搜索关键字（机器人名称/Token）
  status?: number | string // 状态：1-启用，2-禁用
}

/**
 * 机器人列表项
 */
type BotListItem = {
  id: number | string // 机器人ID
  tg_bot_id?: number | string // TG机器人ID
  name: string // 机器人名称
  firstname: string // 机器人用户名
  username?: string // 机器人用户名（别名）
  token: string // 机器人Token
  status: number // 状态：1-启用，2-禁用
  create_time: string // 创建时间
  update_time?: string // 更新时间
}

/**
 * 机器人列表响应
 */
type BotListResponse = {
  list: BotListItem[] // 机器人列表
  totalCount: number // 总数量
}

type BotPaymentConfig = {
  id: number
  botId: number
  username: string
  flashPaymentWallet: string
  balancePaymentWallet: string
}

type BotTimeEnergyConfig = {
  id: number
  botId: number
  timeEnergyPrice: number
  timeEnergyMultiplier: number
}

type BotCountEnergyConfig = {
  id: number
  botId: number
  countEnergyPriceTRX: number
  countEnergyPriceUSDT: number
}

type BotManagedModeConfig = {
  id: number
  botId: number
  enabled: boolean
  countPrice: number
  customPriceEnabled: boolean
  price65000: number
  price131000: number
}

type BotBatchOrderConfig = {
  id: number
  botId: number
  enabled: boolean
  energyPrice: number
  activatePrice: number
}

type BotFlashExchangeConfig = {
  id: number
  botId: number
  enabled: boolean
  walletAddress: string
  minBalance: number
  exchangeProfit: number
  exchangeLimit: number
  insufficientStock: boolean
  insufficientStockValue: number
}

export type {
  BotRenewPrice,
  BotListParams,
  BotListItem,
  BotListResponse,
  BotPaymentConfig,
  BotTimeEnergyConfig,
  BotCountEnergyConfig,
  BotManagedModeConfig,
  BotBatchOrderConfig,
  BotFlashExchangeConfig
}
