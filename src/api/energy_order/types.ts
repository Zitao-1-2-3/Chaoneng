// ========== 能量订单类型定义 ==========

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

// ========== 订单列表相关类型 ==========

/**
 * 能量订单列表查询参数 - 新接口 v1
 */
export interface EnergyOrderListParamsV1 {
  current_page?: number // 当前页码
  page_size?: number // 每页大小
  order_id?: string // 订单ID
  keyword?: string // 关键字（TG用户名/机器人名称/用户账号/用户邮箱）
  kind?: number // 订单类型（4=按时间, 5=按笔数, 6=福利, 7=闪租, 8=托管, 9=批量下单, 10=激活）
  status?: number // 状态（1=新订单, 2=已支付, 3=已发送, 4=已回收, 5=已完成, 6=失败, 7=已退款, 8=已取消, 9=中止）
  origin?: number // 来源（1=机器人，2=H5）
  receive_address?: string // 收款钱包地址
  energy_address?: string // 能量接收地址
  start_time?: string // 开始时间（Unix时间戳-秒，字符串格式）
  end_time?: string // 结束时间（Unix时间戳-秒，字符串格式）
  order?: string // 排序参数（格式：字段名 ASC/DESC）
}

/**
 * 能量订单列表项 - 新接口 v1
 */
export interface EnergyOrderItemV1 {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number | null // 支付时间（Unix时间戳-秒，可为null）
  kind: number // 订单类型（4=按时间, 5=按笔数, 6=福利, 7=闪租, 8=托管, 9=批量下单, 10=激活）
  status: number // 状态
  origin: number // 来源（1=机器人，2=H5）
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 收款钱包地址
  pay_id: string // 支付ID
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  username: string // 用户账号
  email: string // 用户邮箱
  energy_address: string // 能量接收地址
  energy_amount: string // 能量数量
  energy_count: number // 能量笔数
  energy_actual_amount: string // 实际能量数量
  expirated_at: number | null // 过期时间（Unix时间戳-秒，可为null）
  delegated_at: number | null // 委托时间（Unix时间戳-秒，可为null）
  recycled_at: number | null // 回收时间（Unix时间戳-秒，可为null）
}

/**
 * 能量订单列表响应 - 新接口 v1
 * 注意：经过axios响应拦截器处理后，直接返回data部分
 */
export interface EnergyOrderListResponseV1 {
  list: EnergyOrderItemV1[] // 能量订单列表
  pager: Pager // 分页信息
}

// ========== 订单详情相关类型 ==========

/**
 * 订单摘要信息
 */
export interface OrderSummary {
  order_id: string // 订单ID
  gift_bandwidth: boolean // 是否赠送带宽
  duration: number // 时长（纳秒）
  active_count: number // 激活数量
  energy_count: number // 能量数量
  used_count: number // 已使用数量
  cost: string // 成本
  profit: string // 利润
}

/**
 * 资源详情
 */
export interface ResourceDetail {
  id: number // 资源ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  order_id: string // 订单ID
  amount: number // 数量
  target: string // 目标地址
  code: number // 资源类型代码（1: 能量, 2: 带宽）
  source: string // 来源地址
  balance: number // 余额
  expirated_at: number // 过期时间（Unix时间戳-秒）
  used_txid: string // 使用交易hash
  delegated_txid: string // 委托交易hash
  delegated_at: number // 委托时间（Unix时间戳-秒）
  recycled_txid: string // 回收交易hash
  recycled_at: number | null // 回收时间（Unix时间戳-秒，可为null）
}

/**
 * 激活记录
 */
export interface ActivationDetail {
  id: number // 激活记录ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  order_id: string // 订单ID
  target: string // 目标地址
  actived_txid: string // 激活交易ID
  actived_at: number // 激活时间（Unix时间戳-秒）
}

/**
 * 能量订单详情 - 新接口 v1
 */
export interface EnergyOrderDetailV1 {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number | null // 支付时间（Unix时间戳-秒，可为null）
  kind: number // 订单类型
  status: number // 状态
  origin: number // 来源（1=机器人，2=H5）
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 收款钱包地址
  pay_id: string // 支付ID
  describe: string // 描述
  agent_name: string // 代理名称
  bot_user_name: string // 机器人用户名
  bot_first_name: string // 机器人昵称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  username: string // 用户账号
  email: string // 用户邮箱
  summary: OrderSummary // 订单摘要
  resources: ResourceDetail[] // 资源列表
  activations?: ActivationDetail[] // 激活记录列表（可选，用于激活类型订单）
}

/**
 * 能量订单详情响应 - 新接口 v1
 * 注意：经过axios响应拦截器处理后，直接返回data部分
 */
export type EnergyOrderDetailResponseV1 = EnergyOrderDetailV1
