// ========== 新接口 v2 类型定义 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 代理账单列表查询参数 - 新接口 v2
 */
export interface AgentBillListParamsV2 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  coin?: string // 币种：TRX, USDT
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kinds?: number[] // 类型数组：1-能量订单, 2-托管, 3-兑换, 4-按笔数, 5-按时间, 6-批量下单, 7-闪租, 8-激活, 9-机器人续费, 10-后台手动变更, 11-福利订单
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  user_id?: number // 用户ID
}

/**
 * 代理账单列表项 - 新接口 v2
 */
export interface AgentBillItemV2 {
  order_id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  kind: number // 类型：1-能量订单, 2-托管, 3-兑换, 4-按笔数, 5-按时间, 6-批量下单, 7-闪租, 8-激活, 9-机器人续费, 10-后台手动变更, 11-福利订单
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  balance: string // 余额
  coin: string // 币种（如 "TRX"）
  profit: string // 利润
  describe: string // 描述
  agent_name: string // 代理名称
  agent_email?: string // 代理邮箱（如果接口返回）
  bot_name: string // 机器人名称
}

/**
 * 代理账单列表响应 - 新接口 v2
 */
export interface AgentBillListResponseV2 {
  list: AgentBillItemV2[] // 账单列表
  pager: Pager // 分页信息
}

// ========== 旧接口类型定义 ==========

/**
 * 代理账单数据项接口
 */
export interface AgentLedgerItem {
  id: number | string // 扣款ID
  email: string // 代理信息
  username: string // 代理名称
  describe: string // 交易类型
  amount: string | number
  change_type: 'in' | 'out' // 用于格式化金额颜色
  unit: string // 单位，例如 TRX
  after_amount: string | number // 交易后TRX余额
  status: number // 扣款状态 (0, 1: 已完成, 2: 已取消, 3: 进行中)
  order_num: string | number // 关联订单ID
  create_time: string | number // 扣款时间
  order_type?: number // 订单类型
  bot_name?: string // 机器人名称
}

/**
 * 代理账单查询参数
 */
export interface AgentLedgerQueryParams {
  query?: string // 关键字
  status?: number | string // 扣款状态
  order_type?: number | string // 订单类型
  current_page?: number
  page_size?: number
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
}

/**
 * 代理账单列表响应
 */
export interface AgentLedgerListResponseData {
  list: AgentLedgerItem[]
  totalCount: number
}
