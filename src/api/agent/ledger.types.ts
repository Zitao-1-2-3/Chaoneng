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
