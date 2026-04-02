// ========== 新接口 v2 类型定义 ==========

/**
 * 每日能量收入项 - 新接口 v2
 */
export interface V2DailyEnergyInItem {
  date: string // 日期
  energy_in: string // 能量收入
}

/**
 * 每日活跃代理项 - 新接口 v2
 */
export interface V2DailyActiveAgentItem {
  date: string // 日期
  active_agent: number // 活跃代理数
}

/**
 * 统计数据 - 新接口 v2
 */
export interface V2StatsData {
  updated_at: number // 更新时间（Unix时间戳秒）
  today_energy_in: string // 今日能量收入
  total_energy_in: string // 总能量收入
  today_exchange_in: string // 今日闪兑收入
  total_exchange_in: string // 总闪兑收入
  today_exchange_out: string // 今日闪兑支出
  total_exchange_out: string // 总闪兑支出
  today_profit: string // 今日利润
  total_profit: string // 总利润
  today_agent_add: number // 今日新增代理
  total_agent_add: number // 总代理数
  today_bot_add: number // 今日新增机器人
  total_bot_add: number // 总机器人数
  today_bot_in: string // 今日机器人收入
  total_bot_in: string // 总机器人收入
  today_active_in: string // 今日激活收入
  total_active_in: string // 总激活收入
  today_bandwidth_out: string // 今日带宽支出
  total_bandwidth_out: string // 总带宽支出
  today_energy_out: string // 今日能量支出
  total_energy_out: string // 总能量支出
  daily_energy_in: V2DailyEnergyInItem[] // 每日能量收入列表
  daily_active_agent: V2DailyActiveAgentItem[] // 每日活跃代理列表
}

/**
 * 统计数据响应 - 新接口 v2
 */
export interface V2StatsResponse {
  code: string // 响应码
  data: V2StatsData // 统计数据
  msg: string // 响应消息
}

// ========== 旧接口类型定义 ==========

// 定义统计数据接口
export interface StatisticsItem {
  amount: number
  currency: string
  description: string
}

export interface RobotIncomeItem {
  totalIncome: number
  currency: string
  robotQuantity: number
  description: string
}

export interface DailyStatistics {
  energyIncome: StatisticsItem
  exchangeExpense: StatisticsItem
  exchangeIncome: StatisticsItem
  netProfit: StatisticsItem
  newAgents: StatisticsItem
  energyExpense: StatisticsItem
  robotIncomePerQuantity: RobotIncomeItem
}

export interface StatisticsData {
  dailyStatistics: DailyStatistics
}

export interface StatisticsResponse {
  code: number
  data: StatisticsData
  message: string
}

// 机器人摘要数据类型定义
export interface BotSummaryItem {
  id: string
  date: string
  botId: string
  botUsername: string

  // 金额相关字段（将显示在表格中）
  trxCost: number
  trxProfit: number
  rechargeTrxAmount: number
  rechargeUsdtAmount: number
  energyOrderTrxAmount: number
  energyOrderUsdtAmount: number
  hostedOrderTrxAmount: number
  hostedOrderUsdtAmount: number

  // 笔数相关字段（将显示在详情中）
  newUserCount: number
  rechargeOrderCount: number
  rechargeTrxOrderCount: number
  rechargeUsdtOrderCount: number
  energyOrderCount: number
  energyTimeRentalOrderCount: number
  energyBatchOrderCount: number
  hostedOrderCount: number
  hostedTransactionCount: number
}

export interface BotSummaryResponse {
  code: number
  data: {
    list: BotSummaryItem[]
    total: number
  }
  message: string
}
