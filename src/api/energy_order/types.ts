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
  origin?: number // 来源（1=机器人，2=H5）
}

/**
 * 能量订单列表项 - 新接口 v1
 */
export interface EnergyOrderItemV1 {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number | null // 支付时间（Unix时间戳-秒，可为null）
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
  energy_address: string // 能量接收地址
  energy_amount: string // 能量数量
  energy_count: number // 能量笔数
  energy_actual_amount: string // 实际能量数量
  expirated_at: string | null // 过期时间（ISO时间格式，可为null）
  delegated_at: string | null // 委托时间（ISO时间格式，可为null）
  recycled_at: string | null // 回收时间（ISO时间格式，可为null）
}

/**
 * 能量订单列表响应 - 新接口 v1
 */
export interface EnergyOrderListResponseV1 {
  list: EnergyOrderItemV1[] // 能量订单列表
  pager: Pager // 分页信息
}

/**
 * 订单摘要信息
 */
export interface OrderSummary {
  order_id: string // 订单ID
  gift_bandwidth: boolean // 是否赠送带宽
  active_count: number // 激活数量
  energy_count: number // 能量数量
  used_count: number // 已使用数量
}

/**
 * 资源详情
 */
export interface ResourceDetail {
  id: number // 资源ID
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
  order_id: string // 订单ID
  amount: number // 数量
  target: string // 目标地址
  code: number // 资源类型代码（1: 能量, 2: 带宽）
  source: string // 来源地址
  balance: number // 余额
  expirated_at: number // 过期时间（时间戳）
  used_txid: string // 使用交易hash
  delegated_txid: string // 委托交易hash
  delegated_at: number // 委托时间（时间戳）
  recycled_txid: string // 回收交易hash
  recycled_at: number | null // 回收时间（时间戳，可为null）
}

/**
 * 激活记录
 */
export interface ActivationDetail {
  id: number // 激活记录ID
  order_id: string // 订单ID
  target: string // 目标地址
  actived_at: number // 激活时间（时间戳）
  actived_txid: string // 激活交易ID
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
}

/**
 * 能量订单详情 - 新接口 v1
 */
export interface EnergyOrderDetailV1 {
  id: string // 订单ID
  created_at: number // 创建时间（时间戳）
  updated_at: number // 更新时间（时间戳）
  paid_at: number | null // 支付时间（时间戳，可为null）
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
  bot_user_name: string // 机器人用户名
  bot_first_name: string // 机器人昵称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  summary: OrderSummary // 订单摘要
  resources: ResourceDetail[] // 资源列表
  activations?: ActivationDetail[] // 激活记录列表（可选，用于激活类型订单）
}

/**
 * 能量订单详情响应 - 新接口 v1
 */
export type EnergyOrderDetailResponseV1 = EnergyOrderDetailV1
