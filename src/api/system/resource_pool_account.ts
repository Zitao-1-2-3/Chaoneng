import request from '@/axios'
import type {
  V2PoolListParams,
  V2PoolListResponse,
  V2CreatePoolParams,
  V2CreatePoolResponse,
  V2UpdatePoolParams,
  V2UpdatePoolResponse
} from './resource_pool_account_types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/pools'

/**
 * 获取资源池列表 - 新接口 v2
 * GET /v2/pools
 */
export const v2GetPoolList = (params: V2PoolListParams) => {
  console.log('[v2GetPoolList] 调用参数:', params)
  return request.get<V2PoolListResponse>({
    url: BASE_URL,
    params
  })
}

/**
 * 创建资源池 - 新接口 v2
 * POST /v2/pools/create
 */
export const v2CreatePool = (data: V2CreatePoolParams) => {
  console.log('[v2CreatePool] 调用参数:', data)
  return request.post<V2CreatePoolResponse>({
    url: `${BASE_URL}/create`,
    data
  })
}

/**
 * 更新资源池 - 新接口 v2
 * POST /v2/pools/update
 */
export const v2UpdatePool = (data: V2UpdatePoolParams) => {
  console.log('[v2UpdatePool] 调用参数:', data)
  return request.post<V2UpdatePoolResponse>({
    url: `${BASE_URL}/update`,
    data
  })
}

// ========== 旧接口 ==========

/**
 * 获取资源池账户列表 - 旧接口
 */
export const getResourcePoolAccountListApi = (params: any) => {
  return request.get({
    url: '/manage/resource_pool/list',
    params
  })
}

/**
 * 创建资源池账户 - 旧接口
 */
export const createResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/add', data })
}

/**
 * 更新资源池账户 - 旧接口
 */
export const updateResourcePoolAccountApi = (data: any) => {
  return request.post({ url: '/manage/resource_pool/update', data })
}

// ==================== 未重构的接口 (保持不变) ====================

/**
 * 删除资源池账户
 */
export const deleteResourcePoolAccountApi = (params: any) => {
  return request.post({ url: '/manage/resource_pool/delete', data: params })
}

/**
 * 批量删除资源池账户
 */
export const batchDeleteResourcePoolAccountApi = (data: any) => {
  return request.delete({ url: '/system/resource-pool-account/batch-delete', data })
}

/**
 * 修改资源池账户状态
 */
export const changeResourcePoolAccountStatusApi = (params: any) => {
  return request.post({ url: '/v2/manage/resource_pool/change', params })
}
