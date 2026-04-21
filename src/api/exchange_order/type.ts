// ========== 闪兑订单类型定义 ==========

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
 * 闪兑订单列表查询参数 - 新接口 v1
 */
export interface ExchangeOrderListParamsV1 {
  bot_name?: string // 机器人名称
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  order_id?: string // 订单ID
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  status?: number // 状态
}

/**
 * 闪兑订单列表项 - 新接口 v1
 */
export interface ExchangeOrderItemV1 {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number | null // 支付时间（Unix时间戳-秒，可为null）
  kind: number // 订单类型
  status: number // 状态
  origin: number // 来源（0=未知，1=机器人，2=H5）
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 接收地址
  pay_id: string // 支付ID
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  username: string // 用户账号
  email: string // 用户邮箱
  in_coin: string // 转入币种
  out_coin: string // 转出币种
  out_amount: string // 转出金额
  real_rate: string // 实际汇率
  actual_rate: string // 实际汇率
  agent_cost: string // 代理成本
  agent_profit: string // 代理利润
  plate_profit: string // 平台利润
  completed_at: number | null // 完成时间（Unix时间戳-秒，可为null）
}

/**
 * 闪兑订单列表响应 - 新接口 v1
 * 注意：经过axios响应拦截器处理后，直接返回data部分
 */
export interface ExchangeOrderListResponseV1 {
  list: ExchangeOrderItemV1[] // 闪兑订单列表
  pager: Pager // 分页信息
}

// ========== 订单详情相关类型 ==========

/**
 * 闪兑订单详情 - 新接口 v1
 * 包含三部分数据：
 * 1. exchange: 兑换详情对话框数据
 * 2. pay_transaction: 交易详情-用户转TRX/USDT hash标签页数据
 * 3. deliver_transaction: 交易详情-系统发放TRX/USDT hash标签页数据
 */
export interface ExchangeOrderDetailV1 {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  paid_at: number | null // 支付时间（Unix时间戳-秒，可为null）
  kind: number // 订单类型
  status: number // 状态
  origin: number // 来源（0=未知，1=机器人，2=H5）
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种
  receive_address: string // 接收地址
  pay_id: string // 支付ID
  describe: string // 描述
  agent_name: string // 代理名称
  bot_user_name: string // 机器人用户名
  bot_first_name: string // 机器人昵称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  username: string // 用户账号
  email: string // 用户邮箱
  exchange: ExchangeInfo // 兑换信息（用于兑换详情对话框）
  pay_transaction: TransactionInfo // 支付交易信息（用于交易详情-用户转TRX/USDT hash标签页）
  deliver_transaction: TransactionInfo // 发放交易信息（用于交易详情-系统发放TRX/USDT hash标签页）
}

/**
 * 兑换信息 - 用于兑换详情对话框
 */
export interface ExchangeInfo {
  order_id: string // 订单ID
  in_address: string // 转入地址
  in_amount: string // 转入金额
  in_coin: string // 转入币种
  in_at: number // 转入时间（Unix时间戳-秒）
  real_rate: string // 实际汇率
  actual_rate: string // 实际汇率
  out_address: string // 转出地址
  out_amount: string // 转出金额
  out_coin: string // 转出币种
  out_txid: string // 转出交易hash
  out_at: number | null // 转出时间（Unix时间戳-秒，可为null）
  agent_cost: string // 代理成本
  agent_profit: string // 代理利润
  plate_profit: string // 平台利润
}

/**
 * 交易信息 - 用于交易详情标签页
 * pay_transaction: 用户转TRX/USDT hash标签页
 * deliver_transaction: 系统发放TRX/USDT hash标签页
 */
export interface TransactionInfo {
  id: string // 交易ID（交易Hash）
  from: string // 发送地址
  to: string // 接收地址
  amount: string // 金额
  coin: string // 币种
  height: number // 区块高度
  time: number // 交易时间（Unix时间戳-秒）
  handled: boolean // 是否已处理
}

/**
 * 闪兑订单详情响应 - 新接口 v1
 * 注意：经过axios响应拦截器处理后，直接返回data部分（即ExchangeOrderDetailV1）
 */
export type ExchangeOrderDetailResponseV1 = ExchangeOrderDetailV1
