import request from '@/axios'
import type { RoleItem } from './type'

// 重新导出类型
export type { RoleItem, RoleListResponse } from './type'

// ==================== 新接口（v2） ====================

/**
 * 获取角色列表（新接口）
 * 接口路径：GET /v2/role/list
 * 无参数
 */
export const getRoleListApi = (): Promise<IResponse<RoleItem[]>> => {
  return request.get({ url: '/v2/role/list' })
}

// 添加角色
export const addRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/add', data })
}

// 删除角色
export const deleteRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/delete', data })
}

// 修改角色
export const updateRoleApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/update', data })
}

// 添加角色权限
export const addRolePermissionApi = (data: any) => {
  return request.post({ url: '/v2/manage/user/permission/role_permission/add', data })
}

// 获取角色权限
export const getRolePermissionsApi = (id: string) => {
  return request.get({ url: `/v2/manage/user/permission/role_permission/${id}` })
}

// ==================== 旧接口（已废弃，保留参考） ====================

/**
 * 获取角色列表（旧接口，已废弃）
 * @deprecated 请使用上面的 getRoleListApi 代替
 * 旧接口路径：GET /v2/manage/user/permission/roles/list（已返回 404）
 */
// export const getRoleListApiOld = (params: any = {}) => {
//   return request.get({ url: '/v2/manage/user/permission/roles/list', params })
// }
