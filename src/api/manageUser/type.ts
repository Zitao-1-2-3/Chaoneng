/**
 * 运营用户列表项
 */
export interface ManageUserItem {
  id: number
  username: string // 用户名
  email: string | null // 邮箱
  role_id: number // 角色ID
  status: number // 状态 (1:启用, 2:禁用)
  gift_bandwidth: boolean // 是否赠送带宽
  trx_balance: string // TRX余额
  usdt_balance: string // USDT余额
  created_at: number // 创建时间 (时间戳)
  updated_at: number // 更新时间 (时间戳)
}

/**
 * 运营用户列表查询参数
 */
export interface ManageUserQueryParams {
  current_page: number // 页码
  page_size: number // 每页数量
}

/**
 * 运营用户列表响应
 */
export interface ManageUserListResponse {
  list: ManageUserItem[]
  pager: {
    current_page: number
    page_size: number
    total: number
  }
}

/**
 * 新增运营用户参数
 */
export interface AddManageUserPayload {
  username: string // 用户名
  password: string // 密码
  role_id: number // 角色ID
  status: number // 状态 (1:启用, 2:禁用)
}

/**
 * 更新运营用户参数
 */
export interface UpdateManageUserPayload {
  id: number // 运营用户ID
  username?: string // 用户名
  password?: string // 密码（留空不修改）
  role_id?: number // 角色ID
  status?: number // 状态 (1:启用, 2:禁用)
}

/**
 * 删除运营用户参数
 */
export interface DeleteManageUserPayload {
  id: number // 运营用户ID
}
