// ========== Site 站点管理类型定义 ==========

/**
 * 站点列表查询参数
 */
export type SiteListParams = {
  current_page?: number // 当前页码
  page_size?: number // 每页数量
  keyword?: string // 关键字（搜索）
  name?: string // 站点名称（搜索）
  status?: number // 状态：1-启用，2-禁用
  order?: string // 排序字段，格式：'column ASC' 或 'column DESC'，多字段用逗号隔开
}

/**
 * 站点列表项
 */
export type SiteListItem = {
  id: number // 站点ID
  agent_id: number // 代理ID
  created_at: string // 创建时间
  updated_at: string // 更新时间
  name: string // 站点名称
  describe: string // 描述
  status: number // 状态：1-启用，2-禁用
  tg_admin: string // TG管理员
  price_id: number // 价格ID
}

/**
 * 分页信息
 */
export type Pager = {
  current_page: number // 当前页码
  page_size: number // 每页数量
  total: number // 总数量
}

/**
 * 站点列表响应
 */
export type SiteListResponse = {
  list: SiteListItem[] // 站点列表
  pager: Pager // 分页信息
}

/**
 * 站点详情
 */
export type SiteDetail = {
  id: number // 站点ID
  agent_id: number // 代理ID
  created_at: string // 创建时间
  updated_at: string // 更新时间
  name: string // 站点名称
  describe: string // 描述
  status: number // 状态：1-启用，2-禁用
  tg_admin: string // TG管理员
  price_id: number // 价格ID
}

/**
 * 创建站点参数
 */
export type CreateSiteParams = {
  agent_id: number // 代理ID（必填）
  describe: string // 描述（必填）
  price_id: number // 价格ID（必填）
  status: number // 状态：1-启用，2-禁用（必填）
  tg_admin: string // TG管理员（必填）
}

/**
 * 更新站点参数
 */
export type UpdateSiteParams = {
  id: number // 站点ID（必填）
  describe?: string // 描述
  status?: number // 状态：1-启用，2-禁用
  tg_admin?: string // TG管理员
  price_id?: number // 价格ID
}
