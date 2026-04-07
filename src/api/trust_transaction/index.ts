import request from '@/axios'
import type {
  AutoManageAddressListParams,
  AutoManageAddressItem,
  HostingListParamsV2,
  HostingListResponseV2,
  RemoveHostingParamsV2,
  RecycleOrderParamsV2,
  V2AgentBotListParams,
  V2AgentBotListResponse,
  TrustTransactionQueryParams,
  TrustTransactionDetailResponse,
  RetrieveAssetParams,
  RetrieveAssetResponse,
  RetrieveEnergyParams,
  RetrieveEnergyResponse,
  ResendEnergyParams,
  ResendEnergyResponse,
  HostedOrderQueryParams,
  HostedOrderListResponse
} from './types'

// 导出类型定义
export * from './types'

// ========== 新接口 v2 ==========

const BASE_URL = '/v2/manage/hosting/'

/**
 * 获取托管列表 - 新接口 v2
 * GET /v2/hosting/list
 */
export const v2GetHostingList = (
  params: HostingListParamsV2
): Promise<IResponse<HostingListResponseV2>> => {
  return request.get({
    url: `${BASE_URL}list`,
    params
  })
}

/**
 * 删除托管地址 - 新接口 v2
 * POST /v2/hosting/remove
 */
export const v2RemoveHosting = (data: RemoveHostingParamsV2): Promise<IResponse> => {
  return request.post({
    url: `${BASE_URL}remove`,
    data
  })
}

/**
 * 获取机器人列表 - 新接口 v2
 * GET /v2/manage/agent_bot/list
 */
export const v2GetAgentBotList = (
  params: V2AgentBotListParams
): Promise<IResponse<V2AgentBotListResponse>> => {
  return request.get({
    url: '/v2/manage/agent_bot/list',
    params
  })
}

/**
 * 回收与重置 - 新接口 v2
 * POST /v2/order/recycle
 */
export const v2RecycleOrder = (data: RecycleOrderParamsV2): Promise<IResponse> => {
  return request.post({
    url: '/v2/order/recycle',
    data
  })
}

// ========== 旧接口 ==========

// API URL前缀
const API_PREFIX = '/v2/manage/order'

/**
 * 获取托管订单列表 (原 getTrustTransactionListApi)
 */
export const getTrustTransactionListApi = (params: HostedOrderQueryParams) => {
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
    url: `${API_PREFIX}/detail`,
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

/**
 * 导出托管订单
 */
export const exportTrustTransactionApi = (params: HostedOrderQueryParams) => {
  return request.get<IResponse<boolean>>({
    url: '/v2/manage/order/hosted_order/export',
    params,
    responseType: 'blob'
  })
}

/**
 * 手动回收重置托管订单
 */
export const handRecycleTrustTransactionApi = (data: { id: number }) => {
  return request.post<IResponse<boolean>>({
    url: '/v2/manage/manage_order/hand_recycle',
    data
  })
}

// 获取tg用户智能托管地址列表
export const getAutoManageAddressListApi = (params: AutoManageAddressListParams) => {
  return request.get<{ list: AutoManageAddressItem[]; totalCount: number }>({
    url: '/v1/bot/tg_user/auto_manage/list',
    params
  })
}

// 取消智能托管地址
export const deleteAutoManageAddressApi = (id: number) => {
  return request.post<boolean>({
    url: '/v1/bot/tg_user/auto_manage/delete',
    data: { id }
  })
}
