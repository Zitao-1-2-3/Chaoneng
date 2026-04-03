// ========== 新类型定义 v1 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 用户充值列表查询参数 - 新接口 v1
 */
export interface DepositListParamsV1 {
  coin?: string // 币种
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  kind?: number // 订单类型
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  pay_address?: string // 支付地址
  receive_address?: string // 接收地址
  start_time?: string // 开始时间
  status?: number // 状态
}

/**
 * 用户充值列表项 - 新接口 v1
 */
export interface DepositItemV1 {
  id: string // 订单ID
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
  paid_at: number // 支付时间（时间戳）
  kind: number // 订单类型
  status: number // 状态
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 接收地址
  pay_id: string // 支付ID
  cost: string // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  pay_address: string // 支付地址
}

/**
 * 用户充值列表响应 - 新接口 v1
 */
export interface DepositListResponseV1 {
  list: DepositItemV1[] // 充值列表
  pager: Pager // 分页信息
}

/**
 * 订单详情 - 新接口 v1
 */
export interface DepositDetailV1 {
  agent_id: number // 代理ID
  amount: string // 金额
  bot_id: number // 机器人ID
  coin: string // 币种
  cost: string // 成本
  created_at: string // 创建时间
  describe: string // 描述
  id: string // 订单ID
  kind: number // 订单类型
  paid_at: string // 支付时间
  pay_id: string // 支付ID
  receive_address: string // 接收地址
  status: number // 状态
  updated_at: string // 更新时间
  user_id: number // 用户ID
  bot_name?: string // 机器人名称（可选）
  tg_user_name?: string // TG用户名（可选）
  tg_first_name?: string // TG用户昵称（可选）
}

/**
 * 订单详情响应 - 新接口 v1
 */
export interface DepositDetailResponseV1 {
  agent_id: number
  amount: string
  bot_id: number
  coin: string
  cost: string
  created_at: string
  describe: string
  id: string
  kind: number
  paid_at: string
  pay_id: string
  receive_address: string
  status: number
  updated_at: string
  user_id: number
  bot_name?: string
  tg_user_name?: string
  tg_first_name?: string
}
