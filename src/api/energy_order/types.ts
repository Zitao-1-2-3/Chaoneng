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
 * 能量订单列表查询参数 - 新接口 v1
 */
export interface EnergyOrderListParamsV1 {
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  energy_address?: string // 能量地址
  keyword?: string // 关键字
  kind?: number // 订单类型（1-11）
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  receive_address?: string // 接收地址
  start_time?: string // 开始时间
  status?: number // 状态（1,2,3,4,5,7,8,9）
}

/**
 * 能量订单列表项 - 新接口 v1
 */
export interface EnergyOrderItemV1 {
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
  energy_address: string // 能量地址
  energy_amount: string // 能量数量
  energy_count: number // 能量笔数
  energy_actual_amount: string // 实际能量数量
  expirated_at: string // 过期时间
  delegated_at: string // 委托时间
  recycled_at: string // 回收时间
}

/**
 * 能量订单列表响应 - 新接口 v1
 */
export interface EnergyOrderListResponseV1 {
  list: EnergyOrderItemV1[] // 能量订单列表
  pager: Pager // 分页信息
}

/**
 * 能量订单详情 - 新接口 v1
 */
export interface EnergyOrderDetailV1 {
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
}

/**
 * 能量订单详情响应 - 新接口 v1
 */
export interface EnergyOrderDetailResponseV1 {
  id: string
  created_at: number
  updated_at: number
  paid_at: number
  kind: number
  status: number
  user_id: number
  agent_id: number
  bot_id: number
  amount: string
  coin: string
  receive_address: string
  pay_id: string
  cost: string
  describe: string
  agent_name: string
  bot_name: string
  tg_user_name: string
}
