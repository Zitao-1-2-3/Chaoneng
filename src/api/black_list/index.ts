import request from '@/axios'
import type {
  BlackListParamsV1,
  BlackListResponseV1,
  CreateBlackListParamsV1,
  DeleteBlackListParamsV1,
  BlackListParams,
  BlackListItem
} from './types'

// ========== 新接口 v1 ==========

const BASE_URL = '/v1/blacklist/'

/**
 * 获取黑名单列表 - 新接口 v1
 * GET /v1/blacklist/list
 */
export const v1GetBlackList = (
  params: BlackListParamsV1
): Promise<IResponse<BlackListResponseV1>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 创建黑名单 - 新接口 v1
 * POST /v1/blacklist/add
 */
export const v1CreateBlackList = (data: CreateBlackListParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}add`,
    data
  })
}

/**
 * 删除黑名单 - 新接口 v1
 * POST /v1/blacklist/delete
 */
export const v1DeleteBlackList = (data: DeleteBlackListParamsV1): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}delete`,
    data
  })
}

// ========== 旧接口 ==========

/**
 * 获取黑名单列表
 * GET /v1/order/count_black/list
 */
export const getBlackListApi = (params: BlackListParams) => {
  return request.get<{ list: BlackListItem[]; totalCount: number }>({
    url: '/v1/order/count_black/list',
    params
  })
}

/**
 * 添加黑名单
 * POST /v1/order/count_black/add
 */
export const addBlackListApi = (data: { address: string }) => {
  return request.post<BlackListItem>({
    url: '/v1/order/count_black/add',
    data
  })
}

/**
 * 删除黑名单
 * POST /v1/order/count_black/delete
 */
export const deleteBlackListApi = (data: { id: number | string }) => {
  return request.post({
    url: '/v1/order/count_black/delete',
    data
  })
}
