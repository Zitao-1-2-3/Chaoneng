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
 * 托管列表查询参数 - 新接口 v2
 */
export interface HostingListParamsV2 {
  address?: string // 地址
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
  user_id?: number // 用户ID
}

/**
 * 托管列表项 - 新接口 v2
 */
export interface HostingItemV2 {
  address: string // 托管地址
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  bot_id: number // 机器人ID
  bot_name: string // 机器人名称
  created_at: string // 创建时间
  id: number // 托管ID
  order_id: string // 订单ID
  updated_at: string // 更新时间
  user_id: number // 用户ID
  user_name: string // 用户名
}

/**
 * 托管列表响应 - 新接口 v2
 */
export interface HostingListResponseV2 {
  list: HostingItemV2[] // 托管列表
  pager: Pager // 分页信息
}

/**
 * 删除托管地址请求参数 - 新接口 v2
 */
export interface RemoveHostingParamsV2 {
  address: string // 托管地址（必填）
}

// ========== 旧接口类型定义 ==========

export interface BotOption {
  label: string
  value: any
}

export interface AutoManageAddressListParams {
  current_page: number
  page_size: number
  tg_bot_id?: number | string // 筛选机器人
  address?: string // 托管地址关键词
}

export interface AutoManageAddressItem {
  id: number // 记录ID，用于删除
  manage_record_id?: number
  order_id?: string
  tg_id?: number // 用户TG ID
  tg_bot_id: number // 机器人TG ID
  bot_id?: number // 机器人ID（新接口字段）
  address: string // 托管地址
  from_address?: string
  txid?: string
  energy_num?: number
  energy_rent_time?: number
  energy_rent_text?: string
  order_amount?: string
  pay_amount?: string
  pay_unit?: string
  status?: number
  manage_status?: number
  create_time: number | string // 创建时间 (秒级时间戳或字符串)
  finish_time?: number | string // 完成/更新时间 (秒级时间戳或字符串)
  describe?: string
  delegate_balance?: number
  recycle_time?: number
  recycle_txid?: string
  handle_status?: number
  delegate_status?: number
  used_energy_num?: number
  nickname?: string // 用户昵称
  tg_name?: string // 用户TG名
  user_name?: string // 用户名（新接口字段）
  bot_name?: string // 机器人用户名
}

export interface TrustTransactionItem {
  // 基本信息
  id: string
  agentId: string
  agentName: string
  trustType: number // 1: TRX托管, 2: USDT托管, 3: 能量托管
  assetAmount: number // 托管数量
  estReturnRate: number // 预期收益率
  actualReturn: number // 实际收益

  // 状态信息
  status: number // 1: 托管中, 2: 已完成, 3: 待处理, 4: 已取消

  // 时间信息
  startTime: string
  endTime: string
  createTime: string

  // 地址信息
  receivingAddress: string

  // 其他信息
  remark?: string
}

export interface TrustTransactionQueryParams {
  pageNo?: number
  pageSize?: number
  keyword?: string
  trustType?: number
  status?: number
}

export interface TrustTransactionDetailResponse {
  code: number
  message: string
  data: TrustTransactionItem
}

export interface TrustTransactionListResponse {
  code: number
  message: string
  data: {
    list: TrustTransactionItem[]
    total: number
  }
}

export interface RetrieveAssetParams {
  id: string
  retrieveAmount: number
  calculatedReturn: number
  returnAddress: string
  remark?: string
}

export interface RetrieveAssetResponse {
  code: number
  message: string
  data: any
}

// 回收能量参数
export interface RetrieveEnergyParams {
  id: string
  amount: number
  reason: number
  remark?: string
}

// 补发能量参数
export interface ResendEnergyParams {
  id: string
  amount: number
  reason: number
  remark?: string
}

// 回收能量响应
export interface RetrieveEnergyResponse {
  code: string
  message: string
  data: any
}

// 补发能量响应
export interface ResendEnergyResponse {
  code: string
  message: string
  data: any
}

// 获取托管订单列表的查询参数类型 (Updated)
export interface HostedOrderQueryParams {
  current_page?: number // 页码 (从1开始) - Changed from pageNo
  page_size?: number // 每页数量 - Changed from pageSize
  query?: string // 关键字 (替换 keyword)
  status?: number // 托管状态 (见 HostedOrder.manage_status 定义)
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  startTime?: number // 查询范围：开始时间戳 (毫秒) - CamelCase
  endTime?: number // 查询范围：结束时间戳 (毫秒) - CamelCase
  start_time?: number // API 使用的开始时间 (时间戳，与 startTime 二选一)
  end_time?: number // API 使用的结束时间 (时间戳，与 endTime 二选一)
}

// 托管订单数据结构 (Updated based on Go struct)
export interface HostedOrder {
  id: number // ID (int unsigned)
  manage_record_id: number // 托管记录id (int unsigned not null)
  order_id: string // 订单id号 (varchar(36))
  tg_id: number // tg用户ID (bigint unsigned)
  tg_bot_id: number // tg机器人id (bigint unsigned)
  address: string // 收款地址 (varchar(128))
  from_address: string // 发送地址 (varchar(128))
  txid: string // 交易hash (varchar(100))
  energy_num: number // 能量数量 (int unsigned)
  energy_rent_time: number // 能量有效期单位小时 (int unsigned)
  energy_rent_text: string // 有效期文本 (varchar(10), e.g., "1天", "1小时")
  order_amount: string // 订单金额 (DECIMAL(25,6) unsigned)
  pay_amount: string // 支付金额 (DECIMAL(25,6) unsigned)
  pay_unit: string // 支付单位 (varchar(10))
  status: number // 订单状态 (int unsigned, 1:已完成, 2:待支付, 3:已取消)
  manage_status: number // 托管状态 (int unsigned, 1:托管中, 2:已取消托管)
  resource_type: number // 资源类型 (int unsigned, 1:能量, 2:带宽)
  create_time: number // 创建时间 (int unsigned, timestamp)
  finish_time: number // 完成时间 (int64, timestamp)
  describe: string // 描述 (varchar(256))
  delegate_balance: number // 代理质押sun数量 (bigint unsigned)
  recycle_time: number // 回收时间 (int64, timestamp)
  recycle_txid: string // 回收交易hash (varchar(100))
  handle_status: number // 处理状态 (int unsigned, 1:已处理, 2:未处理, 3:处理失败)
}

// 获取托管订单列表的响应类型 (No change here, already updated)
export interface HostedOrderListResponse {
  code: number // 响应码
  message: string // 响应消息
  data: {
    list: HostedOrder[] // 订单列表
    total: number // 总记录数
  }
}

/**
 * 机器人列表查询参数 - v2
 */
export interface V2AgentBotListParams {
  agent_name?: string // 代理名称
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
  status?: number // 状态
  user_name?: string // 机器人用户名
}

/**
 * 机器人列表项 - v2
 */
export interface V2AgentBotItem {
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  auto_renew: number // 自动续费
  created_at: string // 创建时间
  describe: string // 描述
  expired_at: string // 过期时间
  first_name: string // 名字
  id: number // 机器人ID
  status: number // 状态
  tg_admin: string // TG管理员
  token: string // Token
  total_fee: number // 总费用
  updated_at: string // 更新时间
  user_name: string // 用户名
}

/**
 * 机器人列表响应 - v2
 */
export interface V2AgentBotListResponse {
  list: V2AgentBotItem[] // 机器人列表
  pager: Pager // 分页信息
}
