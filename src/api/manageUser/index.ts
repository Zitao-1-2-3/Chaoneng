import request from '@/axios'
import type {
  ManageUserQueryParams,
  ManageUserListResponse,
  ManageUserItem,
  AddManageUserPayload,
  UpdateManageUserPayload,
  DeleteManageUserPayload
} from './type'

// 重新导出类型
export type {
  ManageUserItem,
  ManageUserQueryParams,
  ManageUserListResponse,
  AddManageUserPayload,
  UpdateManageUserPayload,
  DeleteManageUserPayload
} from './type'

// 新接口的主分支
const USER_BASE = '/v2/manage/user/'

// ==================== 新接口（v2） ====================

/**
 * 获取运营用户列表（新接口）
 * 接口路径：GET /v2/manage/user/list
 * 参数：current_page, page_size
 */
export const getManageUserListApiV2 = (
  params: ManageUserQueryParams
): Promise<IResponse<ManageUserListResponse>> => {
  return request.get({ url: `${USER_BASE}list`, params })
}

export const getUserDetailApi = (id: number | string): Promise<IResponse<ManageUserItem>> => {
  return request.get({ url: `${USER_BASE}detail/${id}` })
}

/**
 * 新增运营用户（新接口）
 * 接口路径：POST /v2/manage/user/add
 * 参数：username, password, role_id, status
 */
export const addManageUserApiV2 = (data: AddManageUserPayload): Promise<IResponse> => {
  return request.post({ url: `${USER_BASE}add`, data })
}

/**
 * 更新运营用户（新接口）
 * 接口路径：POST /v2/manage/user/update
 * 参数：id, username, password (留空不修改), role_id, status
 */
export const updateManageUserApiV2 = (data: UpdateManageUserPayload): Promise<IResponse> => {
  return request.post({ url: `${USER_BASE}update`, data })
}

/**
 * 删除运营用户（新接口）
 * 接口路径：POST /v2/manage/user/del
 * 参数：id
 */
export const deleteManageUserApiV2 = (data: DeleteManageUserPayload): Promise<IResponse> => {
  return request.post({ url: `${USER_BASE}del`, data })
}

// ==================== 旧接口（已废弃，保留参考） ====================

/**
 * 获取运营列表（旧接口）
 * @deprecated 请使用 getManageUserListApiV2 代替
 */
export const listManageUserApi = (params: any) => {
  return request.get({ url: '/manage/user/list', params })
}

/**
 * 新增运营用户（旧接口）
 * @deprecated 请使用 addManageUserApiV2 代替
 */
export const addManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/add', data: params })
}

/**
 * 更新运营用户（旧接口）
 * @deprecated 请使用 updateManageUserApiV2 代替
 */
export const updateManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/update', data: params })
}

/**
 * 删除运营用户（旧接口）
 * @deprecated 请使用 deleteManageUserApiV2 代替
 */
export const deleteManageUserApi = (params: any) => {
  return request.post({ url: '/manage/user/delete', data: params })
}
