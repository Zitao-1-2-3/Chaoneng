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
  origin?: number // 来源：1-机器人，2-H5
  page_size?: number // 每页大小
  pay_address?: string // 支付地址
  receive_address?: string // 接收地址
  start_time?: string // 开始时间
  status?: number // 状态
  order?: string // 排序参数，格式：字段名 ASC/DESC
}

/**
 * 用户充值列表项 - 新接口 v1
 */
export interface DepositItemV1 {
  id: string // 订单ID
  created_at: number // 创建时间（时间戳-秒）
  updated_at: number // 更新时间（时间戳-秒）
  paid_at: number // 支付时间（时间戳-秒）
  kind: number // 订单类型
  status: number // 状态
  origin: number // 来源：1-机器人，2-H5
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
  tg_first_name: string // TG用户昵称
  username: string // 用户账号（H5用户）
  email: string // 用户邮箱（H5用户）
  pay_address: string // 支付地址
  cost?: string // 成本（可选）
}

/**
 * 用户充值列表响应 - 新接口 v1
 */
export interface DepositListResponseV1 {
  list: DepositItemV1[] // 充值列表
  pager: Pager // 分页信息
}

/**
 * 支付交易详情
 */
export interface PayTransaction {
  id: string // 交易ID
  from: string // 发送地址
  to: string // 接收地址
  amount: string // 金额
  coin: string // 币种
  height: number // 区块高度
  time: number // 交易时间（时间戳-秒）
  handled: boolean // 是否已处理
}

/**
 * 订单详情 - 新接口 v1
 */
export interface DepositDetailV1 {
  id: string // 订单ID
  created_at: number // 创建时间（时间戳-秒）
  updated_at: number // 更新时间（时间戳-秒）
  paid_at: number // 支付时间（时间戳-秒）
  kind: number // 订单类型
  status: number // 状态
  origin: number // 来源：1-机器人，2-H5
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
  bot_user_name: string // 机器人用户名
  bot_first_name: string // 机器人昵称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  username: string // 用户账号（H5用户）
  email: string // 用户邮箱（H5用户）
  pay_transaction?: PayTransaction // 支付交易详情（可选）
}

export type DepositDetailResponseV1 = DepositDetailV1
