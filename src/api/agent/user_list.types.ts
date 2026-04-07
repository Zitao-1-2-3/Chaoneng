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
 * 用户列表查询参数 - 新接口 v2
 */
export interface UserListParamsV2 {
  agent_id?: number // 代理ID
  bot_id?: number // 机器人ID
  current_page?: number // 当前页码
  end_time?: string // 结束时间
  keyword?: string // 关键字
  page_size?: number // 每页大小
  start_time?: string // 开始时间
  status?: number // 状态
}

/**
 * 用户列表项 - 新接口 v2
 */
export interface UserListItemV2 {
  id: number // 用户ID
  created_at: number // 创建时间（Unix时间戳-秒）
  updated_at: number // 更新时间（Unix时间戳-秒）
  bot_id: number // 机器人ID
  tg_user_id: number // TG用户ID
  tg_user_name: string // TG用户名
  tg_first_name: string // TG用户昵称
  agent_id: number // 代理ID
  trx_balance: string // TRX余额
  usdt_balance: string // USDT余额
  last_address: string // 最后使用地址
  address_list: string[] // 地址列表
  lang: string // 语言
  status: number // 状态
}

/**
 * 用户列表响应 - 新接口 v2
 */
export interface UserListResponseV2 {
  list: UserListItemV2[] // 用户列表
  pager: Pager // 分页信息
}

// ========== 旧接口类型定义 ==========

/**
 * 用户列表查询参数
 */
export interface UserListQueryParams {
  query?: string // 关键字
  bot_id?: string // 机器人ID
  dateRange?: number[] // 前端表单使用的时间范围 [startTime, endTime] (时间戳)
  start_time?: number // API 使用的开始时间 (时间戳)
  end_time?: number // API 使用的结束时间 (时间戳)
  current_page?: number // 当前页码
  page_size?: number // 每页大小
}
