// ==================== 客服管理类型定义 ====================

/**
 * 客服数据项接口
 */
export interface CustomerServiceItem {
  id: number | string // 客服ID
  tg_name: string // TG用户名
  status: number // 状态：1-启用，2-禁用
  created_at?: number // 创建时间（Unix时间戳-秒）
  updated_at?: number // 更新时间（Unix时间戳-秒）
}

/**
 * 分页信息
 */
export interface PagerInfo {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 客服列表查询参数
 */
export interface CustomerServiceQueryParams {
  current_page?: number // 当前页码
  keyword?: string // 关键字搜索（TG用户名）
  page_size?: number // 每页大小
  status?: number | string // 状态筛选：1-启用，2-禁用
}

/**
 * 客服列表响应数据
 */
export interface CustomerServiceListResponse {
  list: CustomerServiceItem[] // 客服列表
  pager: PagerInfo // 分页信息
}

/**
 * 创建客服参数
 */
export interface CreateCustomerServiceParams {
  tg_name: string // TG用户名
  status: number // 状态：1-启用，2-禁用
}

/**
 * 更新客服参数
 */
export interface UpdateCustomerServiceParams {
  id: number // 客服ID
  tg_name: string // TG用户名
  status: number // 状态：1-启用，2-禁用
}

/**
 * 删除客服参数
 */
export interface DeleteCustomerServiceParams {
  id: number // 客服ID
}
