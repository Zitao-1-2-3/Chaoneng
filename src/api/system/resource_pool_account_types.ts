// ========== 新接口 v2 类型定义 ==========

/**
 * 资源池列表查询参数 - 新接口 v2
 */
export interface V2PoolListParams {
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
  kind?: number // 类型：1-TRX池, 2-USDT池, 3-能量池, 4-带宽池
  status?: number // 状态：1-启用, 2-禁用
}

/**
 * 资源池列表项 - 新接口 v2
 */
export interface V2PoolItem {
  id: number // ID
  created_at: number // 创建时间（Unix时间戳秒）
  updated_at: number // 更新时间（Unix时间戳秒）
  address: string // 地址
  kind: number // 类型：1-TRX池, 2-USDT池, 3-能量池, 4-带宽池
  status: number // 状态：1-启用, 2-禁用
  amount: string // 余额
  limit: string // 限额
  permission_id: number // 权限ID
  permission_name: string // 权限名称
  created_by: string // 创建人
  describe: string // 描述
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
 * 资源池列表响应 - 新接口 v2
 */
export interface V2PoolListResponse {
  code: string // 响应码
  data: {
    list: V2PoolItem[] // 资源池列表
    pager: V2Pager // 分页信息
  }
  msg: string // 响应消息
}

/**
 * 创建资源池参数 - 新接口 v2
 */
export interface V2CreatePoolParams {
  address: string // 地址（必填）
  kind: number // 类型：1-TRX池, 2-USDT池, 3-能量池, 4-带宽池（必填）
  limit: number // 限额（必填）
  permission_name: string // 权限名称（必填）
}

/**
 * 创建资源池响应 - 新接口 v2
 */
export interface V2CreatePoolResponse {
  code: string // 响应码
  data: string // 响应数据
  msg: string // 响应消息
}

/**
 * 更新资源池参数 - 新接口 v2
 */
export interface V2UpdatePoolParams {
  id: number // 资源池ID（必填）
  limit?: number // 限额（可选）
  status?: number // 状态：1-启用, 2-禁用（可选）
}

/**
 * 更新资源池响应 - 新接口 v2
 */
export interface V2UpdatePoolResponse {
  code: string // 响应码
  data: string // 响应数据
  msg: string // 响应消息
}
