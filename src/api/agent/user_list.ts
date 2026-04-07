import request from '@/axios'
import type { UserListParamsV2, UserListResponseV2, UserListQueryParams } from './user_list.types'

// 导出类型定义
export * from './user_list.types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/manage/agent_bot/'

/**
 * 获取用户列表 - 新接口 v2
 * GET /v2/manage/agent_bot/user_list
 */
export const v2GetUserList = (params: UserListParamsV2): Promise<IResponse<UserListResponseV2>> => {
  return request.get({
    url: `${BASE_URL}user_list`,
    params
  })
}

/**
 * 导出用户列表 - 新接口 v2
 * GET /v2/manage/agent_bot/user_export
 */
export const v2ExportUserList = (params: UserListParamsV2): Promise<IResponse<Blob>> => {
  return request.get({
    url: `${BASE_URL}user_export`,
    params,
    responseType: 'blob'
  })
}

// ========== 旧接口 ==========

/**
 * 获取用户列表
 */
export const getUserListApi = (params: UserListQueryParams) => {
  return request.get({
    url: '/manage/agent_bot/user_list',
    params
  })
}

/**
 * 导出用户列表
 */
export const exportUserListApi = (params: UserListQueryParams) => {
  return request.get({
    url: '/manage/agent_bot/user_export',
    params,
    responseType: 'blob'
  })
}
