// ========== 新接口 v2 类型定义 ==========

/**
 * 能量交易订单查询参数 - 新接口 v2
 */
export interface V2EnergyListParams {
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  energy_address?: string // 能量地址
  keyword?: string // 关键字
  kind?: number // 类型: 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活
  order_id?: string // 订单ID（字符串格式）
  page_size?: number // 每页大小
  receive_address?: string // 接收地址
  start_time?: string // 开始时间
  status?: number // 状态: 1-新订单, 2-已支付, 3-已发送, 4-已回收, 5-已完成, 6-失败订单, 7-已退款, 8-已取消, 9-中止订单
  origin?: number // 来源: 1-机器人, 2-H5
}

/**
 * 能量交易订单列表项 - 新接口 v2
 */
export interface V2EnergyItem {
  id: string // 订单ID
  created_at: number // 创建时间（Unix时间戳）
  updated_at: number // 更新时间（Unix时间戳）
  paid_at: number | null // 支付时间（Unix时间戳）
  kind: number // 类型: 1-代理充值, 2-用户充值, 3-兑换, 4-时间能量, 5-笔数能量, 6-福利能量, 7-快速能量, 8-自动托管, 9-批量能量, 10-批量激活, 11-机器人付费
  status: number // 状态: 1-新订单, 2-已支付, 3-已发送(已发送能量或兑换的TRX/USDT交易), 4-已回收(已发送回收能量或带宽的交易), 5-已完成(能量已被回收的), 6-失败订单, 7-已退款, 8-已取消(一般是超时自动取消), 9-中止订单(一般是代理余额不足)
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: string // 金额
  coin: string // 币种: TRX, USDT
  receive_address: string // 接收地址
  pay_id: string // 支付ID
  cost: string // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_name: string // 机器人名称
  tg_user_name: string // TG用户名
  tg_first_name: string // TG名字
  energy_address: string // 能量地址
  energy_amount: string // 能量数量
  energy_count: number // 能量笔数
  energy_actual_amount: string // 实际能量数量
  expirated_at: string | null // 过期时间（ISO时间格式字符串）
  delegated_at: string | null // 委托时间（ISO时间格式字符串）
  recycled_at: string | null // 回收时间（ISO时间格式字符串）
  username?: string // 用户账号
  email?: string // 用户邮箱
  origin?: number // 来源（1=机器人，2=H5）
}

/**
 * 分页信息 - 新接口 v2
 */
export interface V2Pager {
  current_page: number // 当前页码
  page_size: number // 每页大小
  total: number // 总数
}

/**
 * 能量交易订单列表响应 - 新接口 v2
 */
export interface V2EnergyListResponse {
  list: V2EnergyItem[] // 订单列表
  pager: V2Pager // 分页信息
}

/**
 * 订单详情汇总信息 - 新接口 v2
 */
export interface V2OrderSummary {
  order_id: string // 订单ID
  gift_bandwidth: boolean // 是否赠送带宽
  active_count: number // 激活数量
  energy_count: number // 能量笔数
  used_count: number // 已使用数量
}

/**
 * 订单资源详情 - 新接口 v2
 */
export interface V2OrderResource {
  id: number // 资源ID
  created_at: string // 创建时间（ISO时间格式字符串）
  updated_at: string // 更新时间（ISO时间格式字符串）
  order_id: string // 订单ID
  amount: number // 数量
  target: string // 目标地址
  code: number // 状态码
  source: string // 来源地址
  balance: number // 余额
  expirated_at: string // 过期时间（ISO时间格式字符串）
  used_txid: string // 使用交易ID
  delegated_txid: string // 委托交易ID
  delegated_at: string // 委托时间（ISO时间格式字符串）
  recycled_txid: string // 回收交易ID
  recycled_at: string // 回收时间（ISO时间格式字符串）
}

/**
 * 订单详情响应 - 新接口 v2
 * data 对象包含所有订单字段 + summary + resources + activations + exchange + transactions
 */
export interface V2OrderDetailResponse {
  id: string // 订单ID
  created_at: string // 创建时间（ISO时间格式字符串）
  updated_at: string // 更新时间（ISO时间格式字符串）
  paid_at: string // 支付时间（ISO时间格式字符串）
  kind: number // 类型
  status: number // 状态
  user_id: number // 用户ID
  agent_id: number // 代理ID
  bot_id: number // 机器人ID
  amount: number // 金额
  coin: string // 币种
  receive_address: string // 接收地址
  pay_id: string // 支付ID
  cost: number // 成本
  describe: string // 描述
  agent_name: string // 代理名称
  bot_first_name: string // 机器人名字
  bot_user_name: string // 机器人用户名
  tg_user_name: string // TG用户名
  tg_first_name: string // TG名字
  summary: V2OrderSummary // 订单汇总信息
  resources: V2OrderResource[] // 订单资源列表
  activations?: V2OrderActivation[] // 激活记录列表（可选，用于激活类型订单）
  exchange?: V2OrderExchange // 兑换信息（可选，用于兑换类型订单）
  deliver_transaction?: V2Transaction // 发放交易信息（可选）
  pay_transaction?: V2Transaction // 支付交易信息（可选）
}

/**
 * 激活记录 - 新接口 v2
 */
export interface V2OrderActivation {
  id: number // 激活记录ID
  order_id: string // 订单ID
  target: string // 目标地址
  actived_at: string // 激活时间（ISO时间格式字符串）
  actived_txid: string // 激活交易ID
  created_at: string // 创建时间（ISO时间格式字符串）
  updated_at: string // 更新时间（ISO时间格式字符串）
}

/**
 * 兑换信息 - 新接口 v2
 */
export interface V2OrderExchange {
  order_id: string // 订单ID
  in_coin: string // 输入币种
  in_amount: number // 输入金额
  in_address: string // 输入地址
  out_coin: string // 输出币种
  out_amount: number // 输出金额
  out_address: string // 输出地址
  out_at: string // 输出时间（ISO时间格式字符串）
  out_txid: string // 输出交易ID
  actual_rate: number // 实际汇率
  real_rate: number // 真实汇率
  agent_profit: number // 代理利润
  plate_profit: number // 平台利润
}

/**
 * 交易信息 - 新接口 v2
 */
export interface V2Transaction {
  id: string // 交易ID
  from: string // 发送地址
  to: string // 接收地址
  amount: number // 金额
  coin: string // 币种
  time: string // 交易时间（ISO时间格式字符串）
  height: number // 区块高度
  handled: boolean // 是否已处理
}

// summary[卡片上面的总比数使用笔数]
// activations激活
// 资源详情，激活详情
// activations

// ========== 旧接口类型定义 ==========

// 能量交易订单接口定义
export interface EnergyTransactionOrder {
  id: string // 订单ID
  agentId: string // 代理ID
  agentName: string // 代理名称
  orderType: string // 订单类型
  transactionAmount: string // 交易金额
  energyToBeIssued: string // 应发放能量
  energyIssued: string // 实际发放能量
  receivingAddress: string // 接收地址
  validDuration: string // 有效时长
  usageTime: string // 使用时间
  remainingEnergy: string // 剩余能量
  issueStatus: number // 发放状态
  issueStatusText: string // 发放状态文本
  recoveryStatus: number // 回收状态
  recoveryStatusText: string // 回收状态文本
  createTime: string // 创建时间
}

// 能量交易订单响应接口
export interface EnergyTransactionResponse {
  list: EnergyTransactionOrder[]
  totalCount: number
}

// 能量交易订单查询参数
export interface EnergyTransactionQueryParams {
  agentId?: string
  orderType?: string
  issueStatus?: number
  recoveryStatus?: number
  pageSize?: number
  currentPage?: number // 与后端确认分页参数名 (currentPage vs pageNo vs page)
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
}

// 状态更新参数
export interface UpdateStatusParams {
  id: string
  issueStatus?: number
  recoveryStatus?: number
}

// --- 新增：通用分页参数 --- (请根据后端实际情况调整)
export interface PageParams {
  currentPage: number
  pageSize: number
  // 其他可能的通用分页或排序参数
}

// --- 新增：通用列表结果 --- (请根据后端实际情况调整)
export interface ListResult<T> {
  list: T[]
  totalCount: number // 或 total, count 等
  // 其他可能的分页结果字段
}

// --- 新增：按笔数订单子项类型 (占位符) ---
// !!请根据 /v2/manage/energy_count/list/:id 接口实际返回调整字段!!
export interface EnergyCountListItem {
  id: string | number // 子项 ID
  usage_address?: string // 使用地址?
  status?: number // 子项状态 (1:待使用, 2:已使用, 3:已过期?)
  statusText?: string // 状态文本?
  usage_time?: number | string // 使用时间 (时间戳或字符串?)
  transaction_hash?: string // 交易 hash?
  // 其他可能的字段...
}

// --- 新增：批量/激活订单子项类型 (占位符) ---
// !!请根据 /v2/manage/batch_active/list/:id 接口实际返回调整字段!!
// !!确认批量 (Type 3) 和激活 (Type 5) 是否使用相同结构!!
export interface BatchActiveListItem {
  id: string | number // 子项 ID
  to_address?: string // 接收地址
  energy_amount?: number | string // 能量数量
  status?: number // 子项状态 (成功/失败/处理中 或 已激活/未激活?)
  statusText?: string // 状态文本?
  create_time?: number | string // 创建时间?
  finish_time?: number | string // 完成/激活时间?
  transaction_hash?: string // 交易 hash?
  error_message?: string // 失败原因?
  active_price?: number | string // 激活价格 (仅 Type 5?)
  active_status?: number // 激活状态 (仅 Type 3?)
  // 其他可能的字段...
}
