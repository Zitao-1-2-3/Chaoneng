/**
 * 角色列表项
 */
export interface RoleItem {
  id: number
  name: string
  status: number
  created_at: string
  updated_at: string
}

/**
 * 角色列表响应
 */
export interface RoleListResponse {
  code: string
  data: RoleItem[]
  msg: string
}
