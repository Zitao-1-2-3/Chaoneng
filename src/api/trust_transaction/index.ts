import request from '@/axios'
import type {
  // TrustTransactionQueryParams, // Remove or comment out if unused
  // TrustTransactionListResponse, // Remove or comment out if unused
  TrustTransactionDetailResponse,
  RetrieveAssetParams,
  RetrieveAssetResponse,
  RetrieveEnergyParams,
  RetrieveEnergyResponse,
  ResendEnergyParams,
  ResendEnergyResponse,
  HostedOrderQueryParams, // Ensure this is imported
  HostedOrderListResponse // Ensure this is imported
} from './types'

// API URL前缀
// 注意：这里使用 mock 前缀是为了对接 mock 数据，实际环境下需要修改为真实 API 地址
// API_PREFIX might be less relevant now if '/v2/...' is used directly
const API_PREFIX = '/v2/manage/order'

/**
 * 获取托管订单列表 (原 getTrustTransactionListApi)
 */
export const getTrustTransactionListApi = (params: HostedOrderQueryParams) => {
  // 使用新的 URL 和类型
  return request.get<HostedOrderListResponse>({
    url: '/v2/manage/order/hosted_order/list',
    params
  })
}

/**
 * 获取托管明细详情
 */
export const getTrustTransactionDetailApi = (id: string) => {
  return request.get<TrustTransactionDetailResponse>({
    url: `${API_PREFIX}/detail`, // Keep existing prefix logic for others
    params: { id }
  })
}

/**
 * 取回托管资产
 */
export const retrieveTrustAssetApi = (data: RetrieveAssetParams) => {
  return request.post<RetrieveAssetResponse>({
    url: `${API_PREFIX}/retrieve`,
    data
  })
}

/**
 * 回收能量
 */
export const retrieveEnergyApi = (data: RetrieveEnergyParams) => {
  return request.post<RetrieveEnergyResponse>({
    url: `${API_PREFIX}/recycle-energy`,
    data
  })
}

/**
 * 补发能量
 */
export const resendEnergyApi = (data: ResendEnergyParams) => {
  return request.post<ResendEnergyResponse>({
    url: `${API_PREFIX}/resend-energy`,
    data
  })
}

/**
 * 删除托管明细（一般仅用于管理员）
 */
export const deleteTrustTransactionApi = (id: string) => {
  return request.delete<any>({
    url: `${API_PREFIX}/delete`,
    params: { id }
  })
}

// 移除之前添加的 getHostedOrderListApi 函数
// /**
//  * 获取托管订单列表 (新增)
//  */
// export const getHostedOrderListApi = (params: HostedOrderQueryParams) => {
//   // 注意：这里使用了您提供的完整路径，因为它与现有的 API_PREFIX 不同
//   return request.get<HostedOrderListResponse>({
//     url: '/v2/manage/order/hosted_order/list',
//     params
//   })
// }

export const exportTrustTransactionApi = (params: HostedOrderQueryParams) => {
  return request.get<IResponse<boolean>>({
    url: '/v2/manage/order/hosted_order/export',
    params,
    responseType: 'blob'
  })
}

//手动回收重置托管订单
export const handRecycleTrustTransactionApi = (data: { id: number }) => {
  return request.post<IResponse<boolean>>({
    url: '/v2/manage/manage_order/hand_recycle',
    data
  })
}
