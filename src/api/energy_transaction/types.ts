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
