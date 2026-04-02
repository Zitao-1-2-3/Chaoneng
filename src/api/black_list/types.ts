// ========== 黑名单类型定义 ==========

// ========== 新类型定义 ==========
/**
 * 分页信息
 */
export interface Pager {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 黑名单列表查询参数 - 新接口 v1
 */
export interface BlackListParamsV1 {
  address?: string // 地址
  agent_id?: number // 代理ID
  current_page?: number // 当前页码
  keyword?: string // 关键字
  page_size?: number // 每页大小
}

/**
 * 黑名单列表项 - 新接口 v1
 */
export interface BlackListItemV1 {
  id: number // 黑名单ID
  address: string // 地址
  agent_id: number // 代理ID
  agent_name: string // 代理名称
  created_at: string // 创建时间
  updated_at: string // 更新时间
  describe: string // 描述
}

/**
 * 黑名单列表响应 - 新接口 v1
 */
export interface BlackListResponseV1 {
  list: BlackListItemV1[] // 黑名单列表
  pager: Pager // 分页信息
}

/**
 * 创建黑名单请求参数 - 新接口 v1
 */
export interface CreateBlackListParamsV1 {
  address: string // 地址（必填）
  describe: string // 描述（必填）
}

/**
 * 删除黑名单请求参数 - 新接口 v1
 */
export interface DeleteBlackListParamsV1 {
  address?: string // 地址
  agent_id?: number // 代理ID
  id?: number // 黑名单ID
}

// ========== 旧类型定义 ==========

/**
 * 黑名单列表查询参数 - 旧接口
 */
export interface BlackListParams {
  current_page: number // 当前页码
  page_size: number // 每页数量
  address?: string // 地址搜索
}

/**
 * 黑名单列表项 - 旧接口
 */
export interface BlackListItem {
  id: number // 黑名单ID
  address: string // 地址
  create_time: number | string // 创建时间
}
