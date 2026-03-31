import request from '@/axios'
import type {
  RoleItem,
  RoleListData,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionItem
} from './type'

// 重新导出类型
export type {
  RoleItem,
  RoleListData,
  Pager,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionItem
} from './type'

// ==================== 新接口（v2） ====================

const ROLE_API_BASE = '/v2/role/'

/**
 * 获取角色列表（新接口）
 * 接口路径：GET /v2/role/list
 * 无参数
 */
export const getRoleListApi = (): Promise<IResponse<RoleListData>> => {
  return request.get({ url: `${ROLE_API_BASE}list` })
}

/**
 * 获取角色详情（新接口）
 * 接口路径：GET /v2/role/{id}
 * 参数：id (角色ID)
 */
export const getRoleDetailApi = (id: number): Promise<IResponse<RoleItem>> => {
  return request.get({ url: `${ROLE_API_BASE}${id}` })
}

/**
 * 获取权限列表（新接口）
 * 接口路径：GET /v2/role/permissions
 * 无参数
 * @description 获取系统中所有可用的权限列表，暂未使用
 */
export const getPermissionsApi = (): Promise<IResponse<PermissionItem[]>> => {
  return request.get({ url: `${ROLE_API_BASE}permissions` })
}

/**
 * 创建角色（新接口）
 * 接口路径：POST /v2/role/create
 * 参数：name, permissions, status
 */
export const createRoleApi = (data: CreateRolePayload): Promise<IResponse> => {
  return request.post({ url: `${ROLE_API_BASE}create`, data })
}

/**
 * 更新角色（新接口）
 * 接口路径：POST /v2/role/update
 * 参数：id, name, permissions, status
 */
export const updateRoleApiV2 = (data: UpdateRolePayload): Promise<IResponse> => {
  return request.post({ url: `${ROLE_API_BASE}update`, data })
}

/**
 * 删除角色（新接口）
 * 接口路径：POST /v2/role/delete/{id}
 * 参数：id (角色ID)
 */
export const deleteRoleApiV2 = (id: number): Promise<IResponse> => {
  return request.post({ url: `${ROLE_API_BASE}delete/${id}` })
}

// ==================== 旧接口 ====================

export const getRoleListApiOld = (params: any = {}) => {
  return request.get({ url: '/v2/manage/user/permission/roles/list', params })
}

// 添加角色（旧接口，待替换为 createRoleApi）
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
