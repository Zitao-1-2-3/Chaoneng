// ==================== 新接口 v2 类型定义 ====================

/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 机器人列表查询参数 - v2
 */
export interface AgentBotQueryParams {
  agent_name?: string // 代理名称
  current_page?: number // 页码
  keyword?: string // 关键字搜索
  page_size?: number // 每页大小
  status?: number // 状态筛选
  user_name?: string // 机器人用户名
}

/**
 * 机器人列表项 - v2
 */
export interface AgentBotItem {
  id: number // 机器人ID
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  auto_renew: number // 自动续费（1: 开启, 2: 关闭）
  created_at: number // 创建时间（Unix时间戳-秒）
  describe: string // 描述
  expired_at: number // 过期时间（Unix时间戳-秒）
  first_name: string // 机器人昵称
  order_count: number // 交易订单数
  status: number // 状态 (1: 启用, 2: 禁用)
  tg_admin: string // 管理员TG号
  token: string // 机器人Token
  total_fee: string // 总费用
  updated_at: number // 更新时间（Unix时间戳-秒）
  user_count: number // 用户数量
  user_name: string // 机器人用户名
  // 兼容旧字段名
  firstname?: string // 兼容旧字段：机器人昵称
  username?: string // 兼容旧字段：机器人用户名
  account_num?: number // 兼容旧字段：用户数量（映射自user_count）
}

/**
 * 机器人列表响应数据（新接口格式）
 */
export interface AgentBotListResponse {
  list: AgentBotItem[]
  pager: Pager
}

/**
 * 更新机器人参数（新接口）
 */
export interface UpdateAgentBotPayload {
  id: number // 机器人ID
  auto_renew?: number // 自动续费 (1: 开启, 0: 关闭)
  describe?: string // 描述
  status?: number // 状态 (1: 启用, 2: 禁用)
  tg_admin?: string // 管理员TG号
}

/**
 * 更新机器人状态参数（兼容旧接口）
 * @deprecated 请使用 UpdateAgentBotPayload 代替
 */
export interface UpdateAgentBotStatusPayload {
  id: number | string // 机器人ID
  status: number // 新的状态 (1: 启用, 2: 禁用)
}
