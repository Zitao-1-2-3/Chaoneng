// ========== 新接口 v1 类型定义 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 账单列表查询参数 - 新接口 v1
 */
export interface BillListParamsV1 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  coin?: string // 币种：TRX, USDT
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kinds?: number[] // 类型数组：1-代理充值, 2-用户充值, 3-兑换, 4-按时间, 5-按笔数, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  user_id?: number // 用户ID
}

/**
 * 账单列表项 - 新接口 v1
 */
export interface BillItemV1 {
  order_id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  kind: number // 类型：1-代理充值, 2-用户充值, 3-兑换, 4-按时间, 5-按笔数, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  balance: string // 余额
  coin: string // 币种（如 "TRX"）
  profit: string // 利润
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
}

/**
 * 账单列表响应 - 新接口 v1
 */
export interface BillListResponseV1 {
  list: BillItemV1[] // 账单列表
  pager: Pager // 分页信息
}

// ========== 旧接口类型定义 ==========

/**
 * 余额记录项
 */
export interface BalanceRecordItem {
  id: number | string
  user_id: number
  username: string
  account_name?: string
  amount: string
  after_amount: string
  unit: string
  create_time: number
  describe: string
  order_num?: string
  order_type?: number
  bot_name?: string
  change_type?: 'in' | 'out'
}

/**
 * 余额记录查询参数
 */
export interface BalanceRecordParams {
  current_page?: number
  page_size?: number
  change_type?: 'in' | 'out' // in-充值, out-扣款
  accountId?: number
  order_type?: number | string
  id?: string
  time_range?: number[]
}
